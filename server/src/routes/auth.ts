import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
import { COOKIE_NAME, clearSessionCookie, requireAuth, setSessionCookie, signPreAuth, verifyPreAuth } from '../middleware/auth.js';
import { HttpError, validate, wrap } from '../middleware/common.js';
import { audit } from '../lib/audit.js';
import { BCRYPT_ROUNDS, comparePassword, hashPassword, passwordProblems } from '../lib/password.js';
import { clientIp, lockedUntil, rateLimit } from '../lib/ratelimit.js';

export const authRouter = Router();

const FIFTEEN_MIN = 15 * 60 * 1000;
const loginIpLimiter = rateLimit({
  name: 'login:ip',
  limit: 30,
  windowMs: FIFTEEN_MIN,
  message: 'Too many login attempts. Try again in 15 minutes.',
});
const loginEmailLimiter = rateLimit({
  name: 'login:email',
  limit: 10,
  windowMs: FIFTEEN_MIN,
  message: 'Too many login attempts. Try again in 15 minutes.',
  key: (req) => `${String(req.body?.email ?? '').toLowerCase()}|${clientIp(req)}`,
});
const preLimiter = rateLimit({ name: 'pre:ip', limit: 60, windowMs: FIFTEEN_MIN, message: 'Too many attempts. Try again later.' });

// Dummy hash so timing is similar whether or not the user exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const publicUser = (u: { id: string; email: string; name: string; role: 'ADMIN' | 'EDITOR' }) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
});

const lockedError = (until: Date) => {
  const mins = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60000));
  return new HttpError(429, `Too many failed attempts. This account is locked for about ${mins} more minute${mins === 1 ? '' : 's'}.`);
};

/** Loads the user for a pre-auth token and checks it is still valid. */
async function loadPreAuth(token: string) {
  const payload = verifyPreAuth(token, 'change-password');
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active || user.sessionVersion !== payload.sv) throw new HttpError(401, 'Your sign-in expired. Please sign in again.');
  return user;
}

async function completeLogin(res: Response, user: { id: string; sessionVersion: number }) {
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  setSessionCookie(res, user);
}

authRouter.post(
  '/login',
  loginIpLimiter,
  validate({ body: z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(200) }) }),
  loginEmailLimiter,
  wrap(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const ok = await comparePassword(password, user?.password ?? DUMMY_HASH);
    if (!user || !ok || !user.active) {
      await audit(req, {
        userId: user?.id,
        email,
        action: 'login.password.fail',
        success: false,
        meta: user && ok && !user.active ? { reason: 'inactive' } : undefined,
      });
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const until = await lockedUntil(user.id);
    if (until) throw lockedError(until);
    await audit(req, { userId: user.id, email: user.email, action: 'login.password.ok' });
    // A temporary password grants no session: it must be replaced first.
    if (user.mustChangePassword) return res.json({ preAuthToken: signPreAuth(user, 'change-password'), next: 'change-password' });
    await completeLogin(res, user);
    res.json({ user: publicUser(user) });
  }),
);

authRouter.post(
  '/pre/change-password',
  preLimiter,
  validate({ body: z.object({ preAuthToken: z.string().min(10).max(2000), newPassword: z.string().min(1).max(200) }) }),
  wrap(async (req, res) => {
    const { preAuthToken, newPassword } = req.body as { preAuthToken: string; newPassword: string };
    const user = await loadPreAuth(preAuthToken);
    const problems = passwordProblems(newPassword, { email: user.email, name: user.name });
    if (problems.length) return res.status(400).json({ error: problems[0], details: { problems } });
    if (await comparePassword(newPassword, user.password))
      return res.status(400).json({ error: 'Choose a new password different from the temporary one.' });
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword), mustChangePassword: false, sessionVersion: { increment: 1 } },
    });
    await audit(req, { userId: user.id, email: user.email, action: 'password.changed', meta: { forced: true } });
    await completeLogin(res, updated);
    res.json({ user: publicUser(updated) });
  }),
);

authRouter.post('/logout', (req, res, next) => {
  (async () => {
    const token = req.cookies?.[COOKIE_NAME] as string | undefined;
    if (token) {
      const decoded = jwt.decode(token) as { sub?: string } | null;
      if (decoded?.sub) {
        const u = await prisma.user.findUnique({ where: { id: decoded.sub }, select: { id: true, email: true } });
        if (u) await audit(req, { userId: u.id, email: u.email, action: 'session.logout' });
      }
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  })().catch(next);
});

authRouter.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));
