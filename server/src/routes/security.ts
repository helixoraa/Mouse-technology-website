import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { setSessionCookie } from '../middleware/auth.js';
import { HttpError, validate, wrap } from '../middleware/common.js';
import { audit } from '../lib/audit.js';
import { comparePassword, hashPassword, passwordProblems } from '../lib/password.js';
import { hit } from '../lib/ratelimit.js';
import { consumeBackupCode, replaceBackupCodes, verifyTotpAndConsume } from '../lib/totp.js';

/** Mounted at /api/admin/security (after requireAuth: any signed-in role). */
export const securityRouter = Router();

const FIFTEEN_MIN = 15 * 60 * 1000;

/** Second factor for sensitive actions: a TOTP code, or a backup code. Rate limited per user. */
async function requireSecondFactor(userId: string, code: string): Promise<'totp' | 'backup'> {
  const { count } = await hit(`sec2fa:${userId}`, FIFTEEN_MIN);
  if (count > 5) throw new HttpError(429, 'Too many incorrect codes. Try again in 15 minutes.');
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (await verifyTotpAndConsume(user, code)) return 'totp';
  if (await consumeBackupCode(userId, code)) return 'backup';
  throw new HttpError(401, 'That code is not valid.');
}

securityRouter.get(
  '/',
  wrap(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, select: { totpEnabled: true, lastLoginAt: true } });
    const backupCodesRemaining = await prisma.backupCode.count({ where: { userId: req.user!.id, usedAt: null } });
    res.json({ totpEnabled: user.totpEnabled, backupCodesRemaining, lastLoginAt: user.lastLoginAt });
  }),
);

securityRouter.post(
  '/backup-codes',
  validate({ body: z.object({ code: z.string().trim().min(1).max(30) }) }),
  wrap(async (req, res) => {
    await requireSecondFactor(req.user!.id, (req.body as { code: string }).code);
    const backupCodes = await replaceBackupCodes(req.user!.id);
    await audit(req, { userId: req.user!.id, email: req.user!.email, action: '2fa.backup.regenerated' });
    res.json({ backupCodes });
  }),
);

securityRouter.post(
  '/change-password',
  validate({
    body: z.object({
      currentPassword: z.string().min(1).max(200),
      newPassword: z.string().min(1).max(200),
      code: z.string().trim().min(1).max(30),
    }),
  }),
  wrap(async (req, res) => {
    const { currentPassword, newPassword, code } = req.body as { currentPassword: string; newPassword: string; code: string };
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    if (!(await comparePassword(currentPassword, user.password))) {
      await audit(req, {
        userId: user.id,
        email: user.email,
        action: 'password.changed',
        success: false,
        meta: { reason: 'bad-current-password' },
      });
      throw new HttpError(401, 'Your current password is not correct.');
    }
    try {
      await requireSecondFactor(user.id, code);
    } catch (err) {
      await audit(req, { userId: user.id, email: user.email, action: 'password.changed', success: false, meta: { reason: 'bad-code' } });
      throw err;
    }
    const problems = passwordProblems(newPassword, { email: user.email, name: user.name });
    if (problems.length) return res.status(400).json({ error: problems[0], details: { problems } });
    if (await comparePassword(newPassword, user.password))
      throw new HttpError(400, 'Choose a new password different from the current one.');
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword), mustChangePassword: false, sessionVersion: { increment: 1 } },
    });
    await audit(req, { userId: user.id, email: user.email, action: 'password.changed' });
    setSessionCookie(res, updated); // keep this browser signed in; every other session is now invalid
    res.json({ ok: true });
  }),
);
