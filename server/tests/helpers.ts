import request from 'supertest';
import type { Role } from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/db.js';
import { hashPassword } from '../src/lib/password.js';

export { app, prisma };

export const STRONG = 'Correct-Horse-Battery-9!';
export const STRONG2 = 'Another-Strong-Pass-7#';

export async function resetDb() {
  await prisma.$executeRawUnsafe('TRUNCATE "User","BackupCode","AuditLog","RateLimit" RESTART IDENTITY CASCADE');
}

let n = 0;
export async function makeUser(opts: {
  role?: Role;
  password?: string;
  email?: string;
  name?: string;
  mustChangePassword?: boolean;
  active?: boolean;
}) {
  n += 1;
  const password = opts.password ?? STRONG;
  const user = await prisma.user.create({
    data: {
      email: opts.email ?? `user${n}@example.com`,
      name: opts.name ?? `Test User ${n}`,
      role: opts.role ?? 'EDITOR',
      password: await hashPassword(password),
      mustChangePassword: opts.mustChangePassword ?? false,
      active: opts.active ?? true,
    },
  });
  return { user, password };
}

type Agent = ReturnType<typeof request.agent>;
export const newAgent = (): Agent => request.agent(app);

/** Full sign-in with email and password; returns an authenticated agent. */
export async function signIn(u: { user: { email: string }; password: string }) {
  const agent = newAgent();
  const res = await agent.post('/api/auth/login').send({ email: u.user.email, password: u.password });
  if (res.status !== 200 || !hasSessionCookie(res)) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

export const hasSessionCookie = (res: request.Response) => {
  const raw = res.headers['set-cookie'] as unknown as string[] | string | undefined;
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return cookies.some((c) => c.startsWith('token=') && !c.startsWith('token=;'));
};
