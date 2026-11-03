import request from 'supertest';
import { authenticator } from 'otplib';
import type { Role } from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/db.js';
import { encryptSecret } from '../src/lib/crypto.js';
import { hashPassword } from '../src/lib/password.js';

export { app, prisma };

export const STRONG = 'Correct-Horse-Battery-9!';
export const STRONG2 = 'Another-Strong-Pass-7#';

export async function resetDb() {
  await prisma.$executeRawUnsafe('TRUNCATE "User","BackupCode","AuditLog","RateLimit" RESTART IDENTITY CASCADE');
}

/** TOTP code for the time step `offset` steps from now (window accepts -1..+1). */
export const codeFor = (secret: string, offset = 0) => authenticator.clone({ epoch: Date.now() + offset * 30_000 }).generate(secret);

export const newSecret = () => authenticator.generateSecret();

let n = 0;
export async function makeUser(opts: {
  role?: Role;
  password?: string;
  email?: string;
  name?: string;
  mustChangePassword?: boolean;
  totp?: boolean;
  active?: boolean;
}) {
  n += 1;
  const password = opts.password ?? STRONG;
  const secret = newSecret();
  const user = await prisma.user.create({
    data: {
      email: opts.email ?? `user${n}@example.com`,
      name: opts.name ?? `Test User ${n}`,
      role: opts.role ?? 'EDITOR',
      password: await hashPassword(password),
      mustChangePassword: opts.mustChangePassword ?? false,
      active: opts.active ?? true,
      totpEnabled: opts.totp ?? false,
      totpSecretEnc: opts.totp ? encryptSecret(secret) : null,
    },
  });
  return { user, password, secret };
}

type Agent = ReturnType<typeof request.agent>;
export const newAgent = (): Agent => request.agent(app);

/** Password step only. */
export const loginStep = (email: string, password: string, agent: Agent | typeof request = request(app) as never) =>
  (agent as Agent).post('/api/auth/login').send({ email, password });

/** Full sign-in (password + TOTP) for a user created with totp:true; returns an authenticated agent. */
export async function signIn(u: { user: { id: string; email: string }; password: string; secret: string }) {
  const agent = newAgent();
  const r1 = await agent.post('/api/auth/login').send({ email: u.user.email, password: u.password });
  if (r1.status !== 200 || r1.body.next !== 'verify-code')
    throw new Error(`unexpected login step: ${r1.status} ${JSON.stringify(r1.body)}`);
  await prisma.user.update({ where: { id: u.user.id }, data: { totpLastStep: null } }); // allow the current step again
  const r2 = await agent.post('/api/auth/pre/verify').send({ preAuthToken: r1.body.preAuthToken, code: codeFor(u.secret) });
  if (r2.status !== 200) throw new Error(`verify failed: ${r2.status} ${JSON.stringify(r2.body)}`);
  return agent;
}

export const hasSessionCookie = (res: request.Response) => {
  const raw = res.headers['set-cookie'] as unknown as string[] | string | undefined;
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return cookies.some((c) => c.startsWith('token=') && !c.startsWith('token=;'));
};
