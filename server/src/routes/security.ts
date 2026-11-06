import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { setSessionCookie } from '../middleware/auth.js';
import { HttpError, validate, wrap } from '../middleware/common.js';
import { audit } from '../lib/audit.js';
import { comparePassword, hashPassword, passwordProblems } from '../lib/password.js';

/** Mounted at /api/admin/security (after requireAuth: any signed-in role). */
export const securityRouter = Router();

securityRouter.post(
  '/change-password',
  validate({
    body: z.object({
      currentPassword: z.string().min(1).max(200),
      newPassword: z.string().min(1).max(200),
    }),
  }),
  wrap(async (req, res) => {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
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
