import { Router, type Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
import {
  COOKIE_NAME,
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
  signPreAuth,
  verifyPreAuth,
  type PreAuthPayload,
  type PreAuthStage,
} from '../middleware/auth.js';
import { HttpError, validate, wrap } from '../middleware/common.js';
import { audit } from '../lib/audit.js';
import { decryptSecret, encryptSecret } from '../lib/crypto.js';
import { BCRYPT_ROUNDS, comparePassword, hashPassword, passwordProblems } from '../lib/password.js';
import { LOCK_MS, clientIp, hit, lockAccount, lockedUntil, rateLimit } from '../lib/ratelimit.js';
import {
  consumeBackupCode,
  consumeStep,
  generateSecret,
  keyUri,
  matchStep,
  qrDataUrl,
  replaceBackupCodes,
  verifyTotpAndConsume,
} from '../lib/totp.js';

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

const nextStep = (u: { mustChangePassword: boolean; totpEnabled: boolean }): PreAuthStage =>
  u.mustChangePassword ? 'change-password' : u.totpEnabled ? 'verify-code' : 'setup-2fa';

const lockedError = (until: Date) => {
  const mins = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60000));
  return new HttpError(429, `Too many incorrect codes. This account is locked for about ${mins} more minute${mins === 1 ? '' : 's'}.`);
};

/** Loads the user for a pre-auth token of the expected stage and checks it is still valid. */
async function loadPreAuth(token: string, stage: PreAuthStage) {
  const payload = verifyPreAuth(token, stage);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active || user.sessionVersion !== payload.sv) throw new HttpError(401, 'Your sign-in expired. Please sign in again.');
  return { payload, user };
}

/** Counts a failed second-factor attempt; locks the account after 5 per token (or 10 per 15 min per user). */
async function recordCodeFailure(req: Request, user: { id: string; email: string }, payload: PreAuthPayload) {
  const perToken = await hit(`2fa:tok:${payload.jti}`, 5 * 60 * 1000);
  const perUser = await hit(`2fa:user:${user.id}`, FIFTEEN_MIN);
  await audit(req, { userId: user.id, email: user.email, action: 'login.2fa.fail' });
  if (perToken.count >= 5 || perUser.count >= 10) {
    await lockAccount(user.id);
    await audit(req, { userId: user.id, email: user.email, action: 'account.locked', meta: { minutes: LOCK_MS / 60000 } });
    throw lockedError(new Date(Date.now() + LOCK_MS));
  }
  throw new HttpError(401, 'That code is not valid. Check the code in your authenticator app and try again.');
}

async function completeLogin(
  req: Request,
  res: import('express').Response,
  user: { id: string; email: string; name: string; role: 'ADMIN' | 'EDITOR'; sessionVersion: number },
  via: string,
) {
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  setSessionCookie(res, user);
  await audit(req, { userId: user.id, email: user.email, action: 'login.2fa.ok', meta: { via } });
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
    const next = nextStep(user);
    // No session cookie and no admin data until the second factor is verified.
    res.json({ preAuthToken: signPreAuth(user, next), next });
  }),
);

const tokenOnly = z.object({ preAuthToken: z.string().min(10).max(2000) });

authRouter.post(
  '/pre/change-password',
  preLimiter,
  validate({ body: tokenOnly.extend({ newPassword: z.string().min(1).max(200) }) }),
  wrap(async (req, res) => {
    const { preAuthToken, newPassword } = req.body as { preAuthToken: string; newPassword: string };
    const { user } = await loadPreAuth(preAuthToken, 'change-password');
    const problems = passwordProblems(newPassword, { email: user.email, name: user.name });
    if (problems.length) return res.status(400).json({ error: problems[0], details: { problems } });
    if (await comparePassword(newPassword, user.password))
      return res.status(400).json({ error: 'Choose a new password different from the temporary one.' });
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword), mustChangePassword: false, sessionVersion: { increment: 1 } },
    });
    await audit(req, { userId: user.id, email: user.email, action: 'password.changed', meta: { forced: true } });
    const next = nextStep(updated);
    res.json({ preAuthToken: signPreAuth(updated, next), next });
  }),
);

authRouter.post(
  '/pre/2fa/setup',
  preLimiter,
  validate({ body: tokenOnly }),
  wrap(async (req, res) => {
    const { user } = await loadPreAuth((req.body as { preAuthToken: string }).preAuthToken, 'setup-2fa');
    const secret = generateSecret();
    await prisma.user.update({ where: { id: user.id }, data: { totpPendingEnc: encryptSecret(secret) } });
    const otpauthUrl = keyUri(user.email, secret);
    res.json({ manualKey: secret, otpauthUrl, qrDataUrl: await qrDataUrl(otpauthUrl) });
  }),
);

const codeBody = tokenOnly.extend({ code: z.string().trim().min(1).max(20) });

authRouter.post(
  '/pre/2fa/enable',
  preLimiter,
  validate({ body: codeBody }),
  wrap(async (req, res) => {
    const { preAuthToken, code } = req.body as { preAuthToken: string; code: string };
    const { payload, user } = await loadPreAuth(preAuthToken, 'setup-2fa');
    const until = await lockedUntil(user.id);
    if (until) throw lockedError(until);
    if (!user.totpPendingEnc) throw new HttpError(400, 'Start the setup first to get your QR code.');
    const step = matchStep(decryptSecret(user.totpPendingEnc), code);
    if (step === null || !(await consumeStep(user.id, step))) return recordCodeFailure(req, user, payload);
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecretEnc: user.totpPendingEnc, totpPendingEnc: null, totpEnabled: true },
    });
    const backupCodes = await replaceBackupCodes(user.id);
    await audit(req, { userId: user.id, email: user.email, action: '2fa.enabled' });
    await completeLogin(req, res, user, 'setup');
    res.json({ user: publicUser(user), backupCodes });
  }),
);

authRouter.post(
  '/pre/verify',
  preLimiter,
  validate({
    body: tokenOnly
      .extend({ code: z.string().trim().min(1).max(20).optional(), backupCode: z.string().trim().min(1).max(30).optional() })
      .refine((b) => b.code || b.backupCode, { message: 'Enter your 6-digit code or a backup code' }),
  }),
  wrap(async (req, res) => {
    const { preAuthToken, code, backupCode } = req.body as { preAuthToken: string; code?: string; backupCode?: string };
    const { payload, user } = await loadPreAuth(preAuthToken, 'verify-code');
    const until = await lockedUntil(user.id);
    if (until) throw lockedError(until);
    let via: 'totp' | 'backup' | null = null;
    if (code && (await verifyTotpAndConsume(user, code))) via = 'totp';
    else if (backupCode && (await consumeBackupCode(user.id, backupCode))) {
      via = 'backup';
      await audit(req, { userId: user.id, email: user.email, action: '2fa.backup.used' });
    }
    if (!via) return recordCodeFailure(req, user, payload);
    await completeLogin(req, res, user, via);
    res.json({ user: publicUser(user) });
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
