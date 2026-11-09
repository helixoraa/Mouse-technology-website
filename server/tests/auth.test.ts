import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { STRONG, STRONG2, app, hasSessionCookie, makeUser, newAgent, prisma, resetDb, signIn } from './helpers.js';
import { TEST_ENV } from './test-env.js';
import { lockAccount } from '../src/lib/ratelimit.js';
import { productionSecretProblems } from '../src/secrets.js';

beforeEach(resetDb);

const login = (email: string, password: string) => request(app).post('/api/auth/login').send({ email, password });

describe('password step', () => {
  it('rejects a wrong password with a generic 401 and no cookie, and audits it', async () => {
    const u = await makeUser({});
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
    const u = await makeUser({});
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push((await login(u.user.email, 'Wrong-Password-1234!')).status);
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
    expect(await prisma.rateLimit.count()).toBeGreaterThan(0);
  });
});

describe('password-only sign in', () => {
  it('a correct password issues the httpOnly session straight away, with no code step', async () => {
    const u = await makeUser({ role: 'ADMIN' });
    const agent = newAgent();
    const res = await agent.post('/api/auth/login').send({ email: u.user.email, password: u.password });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: u.user.email, role: 'ADMIN' });
    expect(res.body.preAuthToken).toBeUndefined();
    expect(res.body.next).toBeUndefined();
    expect(hasSessionCookie(res)).toBe(true);
    expect((res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('token='))).toMatch(/HttpOnly/i);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
    expect((await agent.get('/api/admin/stats')).status).toBe(200);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: u.user.id } });
    expect(row.lastLoginAt).not.toBeNull();
  });

  it('ignores 2FA data left on the user row by accounts enrolled before 2FA was removed', async () => {
    const u = await makeUser({ role: 'ADMIN' });
    await prisma.user.update({ where: { id: u.user.id }, data: { totpEnabled: true, totpSecretEnc: 'v1:old:enrolled:secret' } });
    const agent = await signIn(u);
    expect((await agent.get('/api/admin/stats')).status).toBe(200);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: u.user.id } });
    expect(row).toMatchObject({ totpEnabled: true, totpSecretEnc: 'v1:old:enrolled:secret' }); // data left in place
  });

  it('the 2FA endpoints are gone', async () => {
    const u = await makeUser({ role: 'ADMIN' });
    const other = await makeUser({});
    const agent = await signIn(u);
    for (const path of ['/api/auth/pre/2fa/setup', '/api/auth/pre/2fa/enable', '/api/auth/pre/verify'])
      expect(
        (
          await request(app)
            .post(path)
            .send({ preAuthToken: 'x'.repeat(40), code: '123456' })
        ).status,
      ).toBe(404);
    expect((await agent.post('/api/admin/security/backup-codes').send({ code: '123456' })).status).toBe(404);
    expect((await agent.post(`/api/admin/users/${other.user.id}/reset-2fa`)).status).toBe(404);
  });

  it('an account lock still blocks a correct password', async () => {
    const u = await makeUser({});
    await lockAccount(u.user.id);
    const res = await login(u.user.email, u.password);
    expect(res.status).toBe(429);
    expect(hasSessionCookie(res)).toBe(false);
  });
});

describe('temporary password', () => {
  it('returns only a pre-auth token: no cookie, no access to /me or admin data', async () => {
    const u = await makeUser({ role: 'ADMIN', mustChangePassword: true });
    const res = await login(u.user.email, u.password);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ next: 'change-password' });
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
    const garbage = await request(app)
      .post('/api/auth/pre/change-password')
      .send({ preAuthToken: 'x'.repeat(40), newPassword: STRONG2 });
    expect(garbage.status).toBe(401);
  });

  it('temp password -> must change -> session; the next login needs only the new password', async () => {
    const temp = 'Temp-Password-Xk39!zQ';
    const u = await makeUser({ mustChangePassword: true, password: temp });

    const r1 = await login(u.user.email, temp);
    expect(r1.status).toBe(200);
    expect(r1.body.next).toBe('change-password');

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

    const agent = newAgent();
    const changed = await agent.post('/api/auth/pre/change-password').send({ preAuthToken: r1.body.preAuthToken, newPassword: STRONG2 });
    expect(changed.status).toBe(200);
    expect(changed.body.user.email).toBe(u.user.email);
    expect(hasSessionCookie(changed)).toBe(true);
    expect((await agent.get('/api/auth/me')).status).toBe(200);

    // the temporary password is dead; the old pre-auth token (older sessionVersion) too
    expect((await login(u.user.email, temp)).status).toBe(401);
    expect(
      (await request(app).post('/api/auth/pre/change-password').send({ preAuthToken: r1.body.preAuthToken, newPassword: STRONG })).status,
    ).toBe(401);

    const next = await login(u.user.email, STRONG2);
    expect(next.status).toBe(200);
    expect(hasSessionCookie(next)).toBe(true);
  });
});

describe('sessions and account management', () => {
  async function adminAndEditor() {
    const admin = await makeUser({ role: 'ADMIN' });
    const editor = await makeUser({ role: 'EDITOR' });
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
    const a = await makeUser({ role: 'ADMIN' });
    const agentA = await signIn(a);
    expect((await agentA.delete(`/api/admin/users/${a.user.id}`)).status).toBe(400);
    expect((await agentA.put(`/api/admin/users/${a.user.id}`).send({ role: 'EDITOR' })).status).toBe(400);
    expect((await agentA.post(`/api/admin/users/${a.user.id}/deactivate`)).status).toBe(400);
    expect((await agentA.post(`/api/admin/users/${a.user.id}/reset-password`)).status).toBe(400);
    expect(await prisma.user.count({ where: { role: 'ADMIN', active: true } })).toBe(1);

    // with a second admin, the first can remove them, but then they are the last one
    const b = await makeUser({ role: 'ADMIN' });
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
    const audit = await adminAgent.get('/api/admin/audit?limit=100');
    expect(audit.status).toBe(200);
    expect(audit.body.total).toBeGreaterThan(0);
    const actions = (audit.body.items as { action: string }[]).map((i) => i.action);
    expect(actions).toContain('login.password.ok');
    expect(audit.body.items[0]).toHaveProperty('ip');
  });
});

describe('security page', () => {
  it('changing the password needs the current password, then logs out other sessions', async () => {
    const u = await makeUser({});
    const a1 = await signIn(u);
    const a2 = await signIn(u);

    const badPw = await a1.post('/api/admin/security/change-password').send({ currentPassword: 'Nope-Nope-Nope-1!', newPassword: STRONG2 });
    expect(badPw.status).toBe(401);
    const weak = await a1.post('/api/admin/security/change-password').send({ currentPassword: u.password, newPassword: 'weakpass' });
    expect(weak.status).toBe(400);

    const ok = await a1.post('/api/admin/security/change-password').send({ currentPassword: u.password, newPassword: STRONG2 });
    expect(ok.status).toBe(200);
    expect((await a1.get('/api/auth/me')).status).toBe(200); // re-issued cookie
    expect((await a2.get('/api/auth/me')).status).toBe(401); // other session invalidated
    expect((await login(u.user.email, u.password)).status).toBe(401);
    expect((await login(u.user.email, STRONG2)).status).toBe(200);
  });
});

describe('production guards', () => {
  it('refuses default or missing production secrets', () => {
    const good = { JWT_SECRET: 'j'.repeat(40) + 'Xy', ADMIN_PASSWORD: 'Strong-Prod-Pass-2026!' };
    expect(productionSecretProblems(good)).toEqual([]);
    expect(productionSecretProblems({ ...good, ADMIN_PASSWORD: 'ChangeMe123!' }).join()).toMatch(/ADMIN_PASSWORD/);
    expect(productionSecretProblems({ ...good, JWT_SECRET: 'change-me-to-a-long-random-string' }).join()).toMatch(/JWT_SECRET/);
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

  it('db:seed refuses to run in production (with or without --reset) unless --force-production is passed', () => {
    const prod = {
      NODE_ENV: 'production',
      JWT_SECRET: 'p'.repeat(48),
      ADMIN_PASSWORD: 'Strong-Prod-Pass-2026!',
    };
    for (const res of [
      run(['prisma/seed.ts'], prod),
      run(['prisma/seed.ts', '--reset'], prod),
      run(['prisma/seed.ts'], { ...prod, SEED_RESET: 'true' }),
    ]) {
      expect(res.status).toBe(1);
      expect(res.stderr).toMatch(/Refusing to seed: .*NODE_ENV=production/);
      expect(res.stderr).toMatch(/--force-production/);
    }
  });

  it('the seed refuses default secrets in production even with --force-production', () => {
    const res = run(['prisma/seed.ts', '--force-production'], {
      NODE_ENV: 'production',
      JWT_SECRET: 'p'.repeat(48),
      ADMIN_PASSWORD: 'ChangeMe123!',
    });
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/ADMIN_PASSWORD/);
  });

  it('admin:reset prints a temp password, forces a change and invalidates sessions', async () => {
    const u = await makeUser({ role: 'ADMIN' });
    const agent = await signIn(u);
    const res = run(['scripts/admin-reset.ts', '--email', u.user.email], {});
    expect(res.status).toBe(0);
    const m = res.stdout.match(/Temporary password \(shown once\): (\S+)/);
    expect(m).not.toBeNull();
    const row = await prisma.user.findUniqueOrThrow({ where: { id: u.user.id } });
    expect(row.mustChangePassword).toBe(true);
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
    expect(admin).toMatchObject({ role: 'ADMIN', mustChangePassword: true });
    await prisma.user.update({ where: { id: admin.id }, data: { mustChangePassword: false, name: 'Kept' } });
    const second = run(['prisma/seed.ts', '--reset'], env);
    expect(second.status, second.stderr).toBe(0);
    const after = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
    expect(after).toMatchObject({ mustChangePassword: false, name: 'Kept' });
  }, 240_000);
});
