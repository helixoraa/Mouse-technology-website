import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { STRONG, STRONG2, app, codeFor, hasSessionCookie, makeUser, newAgent, newSecret, prisma, resetDb, signIn } from './helpers.js';
import { TEST_ENV } from './test-env.js';
import { decryptSecret, encryptSecret } from '../src/lib/crypto.js';
import { productionSecretProblems } from '../src/secrets.js';
import { replaceBackupCodes } from '../src/lib/totp.js';

beforeEach(resetDb);

const login = (email: string, password: string) => request(app).post('/api/auth/login').send({ email, password });

describe('password step', () => {
  it('rejects a wrong password with a generic 401 and no cookie, and audits it', async () => {
    const u = await makeUser({ totp: true });
    const res = await login(u.user.email, 'Totally-Wrong-Pass-1!');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
    expect(hasSessionCookie(res)).toBe(false);
    const unknown = await login('nobody@example.com', STRONG);
    expect(unknown.status).toBe(401);
    expect(unknown.body.error).toBe('Invalid email or password');
    expect(await prisma.auditLog.count({ where: { action: 'login.password.fail', success: false } })).toBe(2);
  });

  it('rate limits password attempts per email+IP (DB-backed) with 429', async () => {
    const u = await makeUser({ totp: true });
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push((await login(u.user.email, 'Wrong-Password-1234!')).status);
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
    expect(await prisma.rateLimit.count()).toBeGreaterThan(0);
  });
});

describe('no session before the second factor', () => {
  it('returns only a pre-auth token after the password: no cookie, no access to /me or admin data', async () => {
    const u = await makeUser({ totp: true, role: 'ADMIN' });
    const res = await login(u.user.email, u.password);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ next: 'verify-code' });
    expect(typeof res.body.preAuthToken).toBe('string');
    expect(hasSessionCookie(res)).toBe(false);
    expect(res.body.user).toBeUndefined();

    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/admin/stats')).status).toBe(401);
    expect((await request(app).get('/api/admin/users')).status).toBe(401);
    // the pre-auth token cannot be replayed as a session cookie or bearer token
    const asCookie = await request(app).get('/api/admin/stats').set('Cookie', `token=${res.body.preAuthToken}`);
    expect(asCookie.status).toBe(401);
    const asBearer = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${res.body.preAuthToken}`);
    expect(asBearer.status).toBe(401);
  });

  it('a pre-auth token only works for its own stage', async () => {
    const u = await makeUser({ totp: true });
    const { body } = await login(u.user.email, u.password);
    const wrongStage = await request(app).post('/api/auth/pre/2fa/setup').send({ preAuthToken: body.preAuthToken });
    expect(wrongStage.status).toBe(401);
    const garbage = await request(app)
      .post('/api/auth/pre/verify')
      .send({ preAuthToken: 'x'.repeat(40), code: '123456' });
    expect(garbage.status).toBe(401);
  });
});

describe('second factor', () => {
  it('rejects a wrong code (no cookie) and accepts the right one (cookie, /me works)', async () => {
    const u = await makeUser({ totp: true });
    const { body } = await login(u.user.email, u.password);
    const bad = await request(app)
      .post('/api/auth/pre/verify')
      .send({ preAuthToken: body.preAuthToken, code: codeFor(u.secret, 5) });
    expect(bad.status).toBe(401);
    expect(hasSessionCookie(bad)).toBe(false);
    const agent = newAgent();
    const ok = await agent.post('/api/auth/pre/verify').send({ preAuthToken: body.preAuthToken, code: codeFor(u.secret) });
    expect(ok.status).toBe(200);
    expect(hasSessionCookie(ok)).toBe(true);
    expect(ok.body.user.email).toBe(u.user.email);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
    // httpOnly cookie
    expect((ok.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('token='))).toMatch(/HttpOnly/i);
  });

  it('accepts the +-1 step window and rejects codes outside it', async () => {
    const u = await makeUser({ totp: true });
    const { body } = await login(u.user.email, u.password);
    const far = await request(app)
      .post('/api/auth/pre/verify')
      .send({ preAuthToken: body.preAuthToken, code: codeFor(u.secret, 2) });
    expect(far.status).toBe(401);
    const prev = await request(app)
      .post('/api/auth/pre/verify')
      .send({ preAuthToken: body.preAuthToken, code: codeFor(u.secret, -1) });
    expect(prev.status).toBe(200);
  });

  it('locks the account for 15 minutes after 5 wrong codes on one pre-auth token', async () => {
    const u = await makeUser({ totp: true });
    const { body } = await login(u.user.email, u.password);
    const codes = [] as number[];
    for (let i = 0; i < 5; i++)
      codes.push(
        (
          await request(app)
            .post('/api/auth/pre/verify')
            .send({ preAuthToken: body.preAuthToken, code: codeFor(u.secret, 5) })
        ).status,
      );
    expect(codes).toEqual([401, 401, 401, 401, 429]);
    // even the correct code is refused while locked
    const locked = await request(app)
      .post('/api/auth/pre/verify')
      .send({ preAuthToken: body.preAuthToken, code: codeFor(u.secret) });
    expect(locked.status).toBe(429);
    expect(hasSessionCookie(locked)).toBe(false);
    // and a fresh password login is refused too (DB-backed lock, not per-token)
    expect((await login(u.user.email, u.password)).status).toBe(429);
    const lock = await prisma.rateLimit.findUnique({ where: { key: `lock:user:${u.user.id}` } });
    expect(lock).not.toBeNull();
    expect(lock!.resetAt.getTime() - Date.now()).toBeGreaterThan(14 * 60 * 1000);
    expect(await prisma.auditLog.count({ where: { action: 'account.locked' } })).toBe(1);
  });

  it('rejects reuse of a TOTP code within its window (replay protection)', async () => {
    const u = await makeUser({ totp: true });
    const code = codeFor(u.secret);
    const r1 = await login(u.user.email, u.password);
    expect((await request(app).post('/api/auth/pre/verify').send({ preAuthToken: r1.body.preAuthToken, code })).status).toBe(200);
    const r2 = await login(u.user.email, u.password);
    const replay = await request(app).post('/api/auth/pre/verify').send({ preAuthToken: r2.body.preAuthToken, code });
    expect(replay.status).toBe(401);
    expect(hasSessionCookie(replay)).toBe(false);
  });

  it('backup codes work exactly once', async () => {
    const u = await makeUser({ totp: true });
    const codes = await replaceBackupCodes(u.user.id);
    expect(codes).toHaveLength(10);
    expect(codes[0]).toMatch(/^[a-z2-9]{5}-[a-z2-9]{5}$/);
    const stored = await prisma.backupCode.findMany({ where: { userId: u.user.id } });
    expect(stored).toHaveLength(10);
    expect(stored.every((c) => c.codeHash.startsWith('$2'))).toBe(true); // bcrypt, never plaintext

    const a = await login(u.user.email, u.password);
    const ok = await request(app).post('/api/auth/pre/verify').send({ preAuthToken: a.body.preAuthToken, backupCode: codes[0] });
    expect(ok.status).toBe(200);
    expect(hasSessionCookie(ok)).toBe(true);
    const b = await login(u.user.email, u.password);
    const again = await request(app).post('/api/auth/pre/verify').send({ preAuthToken: b.body.preAuthToken, backupCode: codes[0] });
    expect(again.status).toBe(401);
    expect(await prisma.backupCode.count({ where: { userId: u.user.id, usedAt: null } })).toBe(9);
    // a different unused code still works
    const other = await request(app).post('/api/auth/pre/verify').send({ preAuthToken: b.body.preAuthToken, backupCode: codes[1] });
    expect(other.status).toBe(200);
  });
});

describe('forced password change and 2FA setup', () => {
  it('temp password -> must change -> must set up 2FA -> backup codes shown once -> session', async () => {
    const temp = 'Temp-Password-Xk39!zQ';
    const u = await makeUser({ mustChangePassword: true, password: temp });

    const r1 = await login(u.user.email, temp);
    expect(r1.status).toBe(200);
    expect(r1.body.next).toBe('change-password');
    expect(hasSessionCookie(r1)).toBe(false);

    // wrong stage
    expect((await request(app).post('/api/auth/pre/2fa/setup').send({ preAuthToken: r1.body.preAuthToken })).status).toBe(401);

    // strength / reuse rules
    const weak = await request(app)
      .post('/api/auth/pre/change-password')
      .send({ preAuthToken: r1.body.preAuthToken, newPassword: 'short' });
    expect(weak.status).toBe(400);
    const common = await request(app)
      .post('/api/auth/pre/change-password')
      .send({ preAuthToken: r1.body.preAuthToken, newPassword: 'Password12345678' });
    expect(common.status).toBe(400);
    const same = await request(app).post('/api/auth/pre/change-password').send({ preAuthToken: r1.body.preAuthToken, newPassword: temp });
    expect(same.status).toBe(400);

    const changed = await request(app)
      .post('/api/auth/pre/change-password')
      .send({ preAuthToken: r1.body.preAuthToken, newPassword: STRONG2 });
    expect(changed.status).toBe(200);
    expect(changed.body.next).toBe('setup-2fa');
    expect(hasSessionCookie(changed)).toBe(false);

    // the temporary password is dead; the old pre-auth token (older sessionVersion) too
    expect((await login(u.user.email, temp)).status).toBe(401);
    expect(
      (await request(app).post('/api/auth/pre/change-password').send({ preAuthToken: r1.body.preAuthToken, newPassword: STRONG })).status,
    ).toBe(401);

    const setup = await request(app).post('/api/auth/pre/2fa/setup').send({ preAuthToken: changed.body.preAuthToken });
    expect(setup.status).toBe(200);
    expect(setup.body.manualKey).toMatch(/^[A-Z2-7]{16,}$/);
    expect(setup.body.otpauthUrl).toMatch(/^otpauth:\/\/totp\//);
    expect(setup.body.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    // pending secret is encrypted and 2FA is not enabled until a valid code confirms it
    const pending = await prisma.user.findUniqueOrThrow({ where: { id: u.user.id } });
    expect(pending.totpEnabled).toBe(false);
    expect(pending.totpPendingEnc).toMatch(/^v1:/);
    expect(pending.totpPendingEnc).not.toContain(setup.body.manualKey);

    const agent = newAgent();
    const wrong = await agent
      .post('/api/auth/pre/2fa/enable')
      .send({ preAuthToken: changed.body.preAuthToken, code: codeFor(setup.body.manualKey, 5) });
    expect(wrong.status).toBe(401);
    expect(hasSessionCookie(wrong)).toBe(false);
    expect((await agent.get('/api/auth/me')).status).toBe(401);

    const enabled = await agent
      .post('/api/auth/pre/2fa/enable')
      .send({ preAuthToken: changed.body.preAuthToken, code: codeFor(setup.body.manualKey) });
    expect(enabled.status).toBe(200);
    expect(hasSessionCookie(enabled)).toBe(true);
    expect(enabled.body.backupCodes).toHaveLength(10);
    expect((await agent.get('/api/auth/me')).status).toBe(200);

    // never returned again, encrypted at rest
    const after = await prisma.user.findUniqueOrThrow({ where: { id: u.user.id } });
    expect(after.totpEnabled).toBe(true);
    expect(after.totpPendingEnc).toBeNull();
    expect(after.totpSecretEnc).toMatch(/^v1:/);
    expect(after.totpSecretEnc).not.toContain(setup.body.manualKey);
    expect(decryptSecret(after.totpSecretEnc!)).toBe(setup.body.manualKey);
    const sec = await agent.get('/api/admin/security');
    expect(sec.body).toMatchObject({ totpEnabled: true, backupCodesRemaining: 10 });
    expect(JSON.stringify(sec.body)).not.toContain(setup.body.manualKey);

    // next login now asks for the code
    const next = await login(u.user.email, STRONG2);
    expect(next.body.next).toBe('verify-code');
  });
});

describe('sessions and account management', () => {
  async function adminAndEditor() {
    const admin = await makeUser({ role: 'ADMIN', totp: true });
    const editor = await makeUser({ role: 'EDITOR', totp: true });
    return { admin, editor, adminAgent: await signIn(admin), editorAgent: await signIn(editor) };
  }

  it('admin password reset invalidates the target sessions and forces a change', async () => {
    const { admin, editor, adminAgent, editorAgent } = await adminAndEditor();
    expect((await editorAgent.get('/api/auth/me')).status).toBe(200);
    const reset = await adminAgent.post(`/api/admin/users/${editor.user.id}/reset-password`);
    expect(reset.status).toBe(200);
    expect(reset.body.temporaryPassword.length).toBeGreaterThanOrEqual(16);
    expect((await editorAgent.get('/api/auth/me')).status).toBe(401);
    expect((await editorAgent.get('/api/admin/stats')).status).toBe(401);
    expect((await login(editor.user.email, editor.password)).status).toBe(401); // old password is dead
    const l = await login(editor.user.email, reset.body.temporaryPassword);
    expect(l.body.next).toBe('change-password');
    // the acting admin keeps their session
    expect((await adminAgent.get('/api/auth/me')).status).toBe(200);
    expect(await prisma.auditLog.count({ where: { action: 'user.password.reset', userId: admin.user.id } })).toBe(1);
    // only a hash is stored
    const row = await prisma.user.findUniqueOrThrow({ where: { id: editor.user.id } });
    expect(row.password).not.toContain(reset.body.temporaryPassword);
    expect(row.mustChangePassword).toBe(true);
  });

  it('admin 2FA reset invalidates sessions and forces a new setup', async () => {
    const { editor, adminAgent, editorAgent } = await adminAndEditor();
    expect((await adminAgent.post(`/api/admin/users/${editor.user.id}/reset-2fa`)).status).toBe(200);
    expect((await editorAgent.get('/api/auth/me')).status).toBe(401);
    const l = await login(editor.user.email, editor.password);
    expect(l.body.next).toBe('setup-2fa');
    const row = await prisma.user.findUniqueOrThrow({ where: { id: editor.user.id } });
    expect(row.totpEnabled).toBe(false);
    expect(row.totpSecretEnc).toBeNull();
  });

  it('deactivating blocks login and kills the session; reactivating restores access', async () => {
    const { editor, adminAgent, editorAgent } = await adminAndEditor();
    expect((await adminAgent.post(`/api/admin/users/${editor.user.id}/deactivate`)).status).toBe(200);
    expect((await editorAgent.get('/api/auth/me')).status).toBe(401);
    expect((await login(editor.user.email, editor.password)).status).toBe(401);
    expect((await adminAgent.post(`/api/admin/users/${editor.user.id}/activate`)).status).toBe(200);
    expect((await login(editor.user.email, editor.password)).status).toBe(200);
  });

  it('creating a user returns a one-time temporary password, forces change, and never lists secrets', async () => {
    const { adminAgent } = await adminAndEditor();
    const res = await adminAgent.post('/api/admin/users').send({ name: 'New Person', email: 'New.Person@Example.com', role: 'EDITOR' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'new.person@example.com', role: 'EDITOR', mustChangePassword: true, active: true });
    expect(res.body.temporaryPassword).toMatch(/^[\x21-\x7e]{16,}$/);
    expect(JSON.stringify(res.body.user)).not.toMatch(/"password"|totpSecret/);
    const dup = await adminAgent.post('/api/admin/users').send({ name: 'Dup', email: 'new.person@example.com', role: 'EDITOR' });
    expect(dup.status).toBe(409);
    const list = await adminAgent.get('/api/admin/users');
    expect(list.status).toBe(200);
    expect(JSON.stringify(list.body)).not.toMatch(/"password"|totpSecretEnc|totpPendingEnc|codeHash/);
    const l = await login('new.person@example.com', res.body.temporaryPassword);
    expect(l.body.next).toBe('change-password');
  });

  it('last-admin and self protection: nobody can delete, demote or deactivate themselves or the last admin', async () => {
    const a = await makeUser({ role: 'ADMIN', totp: true });
    const agentA = await signIn(a);
    expect((await agentA.delete(`/api/admin/users/${a.user.id}`)).status).toBe(400);
    expect((await agentA.put(`/api/admin/users/${a.user.id}`).send({ role: 'EDITOR' })).status).toBe(400);
    expect((await agentA.post(`/api/admin/users/${a.user.id}/deactivate`)).status).toBe(400);
    expect((await agentA.post(`/api/admin/users/${a.user.id}/reset-password`)).status).toBe(400);
    expect((await agentA.post(`/api/admin/users/${a.user.id}/reset-2fa`)).status).toBe(400);
    expect(await prisma.user.count({ where: { role: 'ADMIN', active: true } })).toBe(1);

    // with a second admin, the first can remove them, but then they are the last one
    const b = await makeUser({ role: 'ADMIN', totp: true });
    expect((await agentA.delete(`/api/admin/users/${b.user.id}`)).status).toBe(204);
    expect((await agentA.delete(`/api/admin/users/${a.user.id}`)).status).toBe(400);
    expect(await prisma.user.count({ where: { role: 'ADMIN', active: true } })).toBe(1);
  });

  it('only ADMIN may manage users and read the audit log; EDITOR gets 403 but keeps normal admin access', async () => {
    const { adminAgent, editorAgent } = await adminAndEditor();
    expect((await editorAgent.get('/api/admin/users')).status).toBe(403);
    expect((await editorAgent.post('/api/admin/users').send({ name: 'X', email: 'x@example.com', role: 'ADMIN' })).status).toBe(403);
    expect((await editorAgent.get('/api/admin/audit')).status).toBe(403);
    expect((await editorAgent.get('/api/admin/stats')).status).toBe(200);
    expect((await editorAgent.get('/api/admin/security')).status).toBe(200);
    const audit = await adminAgent.get('/api/admin/audit?limit=100');
    expect(audit.status).toBe(200);
    expect(audit.body.total).toBeGreaterThan(0);
    const actions = (audit.body.items as { action: string }[]).map((i) => i.action);
    expect(actions).toContain('login.2fa.ok');
    expect(actions).toContain('login.password.ok');
    expect(audit.body.items[0]).toHaveProperty('ip');
  });
});

describe('security page', () => {
  it('changing the password needs the current password and a valid code, then logs out other sessions', async () => {
    const u = await makeUser({ totp: true });
    const a1 = await signIn(u);
    const a2 = await signIn(u);

    await prisma.user.update({ where: { id: u.user.id }, data: { totpLastStep: null } });
    const badPw = await a1
      .post('/api/admin/security/change-password')
      .send({ currentPassword: 'Nope-Nope-Nope-1!', newPassword: STRONG2, code: codeFor(u.secret) });
    expect(badPw.status).toBe(401);
    const badCode = await a1
      .post('/api/admin/security/change-password')
      .send({ currentPassword: u.password, newPassword: STRONG2, code: codeFor(u.secret, 5) });
    expect(badCode.status).toBe(401);
    const weak = await a1
      .post('/api/admin/security/change-password')
      .send({ currentPassword: u.password, newPassword: 'weakpass', code: codeFor(u.secret) });
    expect(weak.status).toBe(400);

    await prisma.user.update({ where: { id: u.user.id }, data: { totpLastStep: null } });
    const ok = await a1
      .post('/api/admin/security/change-password')
      .send({ currentPassword: u.password, newPassword: STRONG2, code: codeFor(u.secret) });
    expect(ok.status).toBe(200);
    expect((await a1.get('/api/auth/me')).status).toBe(200); // re-issued cookie
    expect((await a2.get('/api/auth/me')).status).toBe(401); // other session invalidated
    expect((await login(u.user.email, u.password)).status).toBe(401);
    expect((await login(u.user.email, STRONG2)).status).toBe(200);
  });

  it('regenerating backup codes requires a code and replaces the old set', async () => {
    const u = await makeUser({ totp: true });
    const old = await replaceBackupCodes(u.user.id);
    const agent = await signIn(u);
    expect((await agent.post('/api/admin/security/backup-codes').send({ code: '000000' })).status).toBe(401);
    await prisma.user.update({ where: { id: u.user.id }, data: { totpLastStep: null } });
    const res = await agent.post('/api/admin/security/backup-codes').send({ code: codeFor(u.secret) });
    expect(res.status).toBe(200);
    expect(res.body.backupCodes).toHaveLength(10);
    const fresh = await login(u.user.email, u.password);
    const oldTry = await request(app).post('/api/auth/pre/verify').send({ preAuthToken: fresh.body.preAuthToken, backupCode: old[0] });
    expect(oldTry.status).toBe(401);
    const newTry = await request(app)
      .post('/api/auth/pre/verify')
      .send({ preAuthToken: fresh.body.preAuthToken, backupCode: res.body.backupCodes[0] });
    expect(newTry.status).toBe(200);
    expect((await agent.get('/api/admin/security')).body.backupCodesRemaining).toBe(9);
  });
});

describe('crypto and production guards', () => {
  it('AES-256-GCM round-trips and rejects tampering', () => {
    const secret = newSecret();
    const enc = encryptSecret(secret);
    expect(enc).not.toContain(secret);
    expect(decryptSecret(enc)).toBe(secret);
    const parts = enc.split(':');
    parts[3] = Buffer.from('tampered-ciphertext').toString('base64url');
    expect(() => decryptSecret(parts.join(':'))).toThrow();
  });

  it('refuses default or missing production secrets', () => {
    const good = { JWT_SECRET: 'j'.repeat(40) + 'Xy', ADMIN_PASSWORD: 'Strong-Prod-Pass-2026!', TOTP_ENCRYPTION_KEY: 'ab'.repeat(32) };
    expect(productionSecretProblems(good)).toEqual([]);
    expect(productionSecretProblems({ ...good, ADMIN_PASSWORD: 'ChangeMe123!' }).join()).toMatch(/ADMIN_PASSWORD/);
    expect(productionSecretProblems({ ...good, JWT_SECRET: 'change-me-to-a-long-random-string' }).join()).toMatch(/JWT_SECRET/);
    expect(productionSecretProblems({ ...good, TOTP_ENCRYPTION_KEY: undefined }).join()).toMatch(/TOTP_ENCRYPTION_KEY/);
    expect(productionSecretProblems({ ...good, TOTP_ENCRYPTION_KEY: 'tooshort' }).join()).toMatch(/TOTP_ENCRYPTION_KEY/);
  });
});

describe('seed and recovery CLI', () => {
  const tsx = createRequire(import.meta.url).resolve('tsx/cli');
  const run = (args: string[], env: Record<string, string>) =>
    spawnSync(process.execPath, [tsx, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, ...TEST_ENV, ...env },
      encoding: 'utf8',
      timeout: 120_000,
    });

  it('db:seed --reset refuses to run in production unless --force-production is passed', () => {
    const prod = {
      NODE_ENV: 'production',
      JWT_SECRET: 'p'.repeat(48),
      ADMIN_PASSWORD: 'Strong-Prod-Pass-2026!',
      TOTP_ENCRYPTION_KEY: 'cd'.repeat(32),
    };
    const res = run(['prisma/seed.ts', '--reset'], prod);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/Refusing to run the seed with --reset/);
    expect(res.stderr).toMatch(/--force-production/);
    const viaEnv = run(['prisma/seed.ts'], { ...prod, SEED_RESET: 'true' });
    expect(viaEnv.status).toBe(1);
  });

  it('the seed refuses default secrets in production', () => {
    const res = run(['prisma/seed.ts'], {
      NODE_ENV: 'production',
      JWT_SECRET: 'p'.repeat(48),
      ADMIN_PASSWORD: 'ChangeMe123!',
      TOTP_ENCRYPTION_KEY: 'cd'.repeat(32),
    });
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/ADMIN_PASSWORD/);
  });

  it('admin:reset prints a temp password, clears 2FA, forces a change and invalidates sessions', async () => {
    const u = await makeUser({ role: 'ADMIN', totp: true });
    await replaceBackupCodes(u.user.id);
    const agent = await signIn(u);
    const res = run(['scripts/admin-reset.ts', '--email', u.user.email], {});
    expect(res.status).toBe(0);
    const m = res.stdout.match(/Temporary password \(shown once\): (\S+)/);
    expect(m).not.toBeNull();
    const row = await prisma.user.findUniqueOrThrow({ where: { id: u.user.id } });
    expect(row.totpEnabled).toBe(false);
    expect(row.totpSecretEnc).toBeNull();
    expect(row.mustChangePassword).toBe(true);
    expect(await prisma.backupCode.count({ where: { userId: u.user.id } })).toBe(0);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
    const l = await login(u.user.email, m![1]);
    expect(l.body.next).toBe('change-password');
    expect(await prisma.auditLog.count({ where: { action: 'cli.admin.reset' } })).toBe(1);
    expect(run(['scripts/admin-reset.ts', '--email', 'missing@example.com'], {}).status).toBe(1);
  });

  it('the seed creates the first admin with mustChangePassword and never touches an existing one', async () => {
    const env = {};
    const first = run(['prisma/seed.ts'], env);
    expect(first.status, first.stderr).toBe(0);
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: TEST_ENV.ADMIN_EMAIL } });
    expect(admin).toMatchObject({ role: 'ADMIN', mustChangePassword: true, totpEnabled: false });
    await prisma.user.update({ where: { id: admin.id }, data: { mustChangePassword: false, totpEnabled: true, name: 'Kept' } });
    const second = run(['prisma/seed.ts', '--reset'], env);
    expect(second.status, second.stderr).toBe(0);
    const after = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
    expect(after).toMatchObject({ mustChangePassword: false, totpEnabled: true, name: 'Kept' });
  }, 240_000);
});
