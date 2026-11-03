import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { HttpError, idParams, validate, wrap } from '../middleware/common.js';
import { audit } from '../lib/audit.js';
import { generateTempPassword, hashPassword } from '../lib/password.js';
import { unlockAccount } from '../lib/ratelimit.js';

/** Mounted at /api/admin/users (ADMIN only). */
export const usersRouter = Router();
usersRouter.use(requireRole('ADMIN'));

const publicUser = {
  id: true,
  email: true,
  name: true,
  role: true,
  active: true,
  mustChangePassword: true,
  totpEnabled: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const createBody = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  name: z.string().trim().min(1).max(120),
  role: z.enum(['ADMIN', 'EDITOR']),
});
const updateBody = z.object({ name: z.string().trim().min(1).max(120).optional(), role: z.enum(['ADMIN', 'EDITOR']).optional() });

const activeAdminsExcluding = (id: string) => prisma.user.count({ where: { role: 'ADMIN', active: true, id: { not: id } } });

/** The last active ADMIN can never be deleted, demoted or deactivated. */
async function assertNotLastAdmin(target: { id: string; role: string; active: boolean }, action: string) {
  if (target.role === 'ADMIN' && target.active && (await activeAdminsExcluding(target.id)) === 0)
    throw new HttpError(400, `You cannot ${action} the last active administrator.`);
}

async function loadTarget(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'User not found');
  return user;
}

usersRouter.get(
  '/',
  wrap(async (_req, res) => res.json(await prisma.user.findMany({ select: publicUser, orderBy: { createdAt: 'asc' } }))),
);

usersRouter.post(
  '/',
  validate({ body: createBody }),
  wrap(async (req, res) => {
    const b = req.body as z.infer<typeof createBody>;
    const temporaryPassword = generateTempPassword();
    const user = await prisma.user.create({
      data: { email: b.email, name: b.name, role: b.role, password: await hashPassword(temporaryPassword), mustChangePassword: true },
      select: publicUser,
    });
    await audit(req, {
      userId: req.user!.id,
      email: req.user!.email,
      action: 'user.created',
      meta: { targetId: user.id, targetEmail: user.email, role: user.role },
    });
    res.status(201).json({ user, temporaryPassword }); // shown once; only the hash is stored
  }),
);

usersRouter.put(
  '/:id',
  validate({ params: idParams(z), body: updateBody }),
  wrap(async (req, res) => {
    const b = req.body as z.infer<typeof updateBody>;
    const target = await loadTarget(req.params.id);
    if (b.role && b.role !== target.role) {
      if (target.id === req.user!.id) throw new HttpError(400, 'You cannot change your own role.');
      if (b.role !== 'ADMIN') await assertNotLastAdmin(target, 'demote');
    }
    const roleChanged = !!b.role && b.role !== target.role;
    const user = await prisma.user.update({
      where: { id: target.id },
      data: { ...b, ...(roleChanged ? { sessionVersion: { increment: 1 } } : {}) },
      select: publicUser,
    });
    await audit(req, {
      userId: req.user!.id,
      email: req.user!.email,
      action: 'user.updated',
      meta: { targetId: target.id, targetEmail: target.email, ...b },
    });
    res.json(user);
  }),
);

usersRouter.post(
  '/:id/reset-password',
  validate({ params: idParams(z) }),
  wrap(async (req, res) => {
    const target = await loadTarget(req.params.id);
    if (target.id === req.user!.id) throw new HttpError(400, 'Use the Security page to change your own password.');
    const temporaryPassword = generateTempPassword();
    await prisma.user.update({
      where: { id: target.id },
      data: { password: await hashPassword(temporaryPassword), mustChangePassword: true, sessionVersion: { increment: 1 } },
    });
    await unlockAccount(target.id);
    await audit(req, {
      userId: req.user!.id,
      email: req.user!.email,
      action: 'user.password.reset',
      meta: { targetId: target.id, targetEmail: target.email },
    });
    res.json({ temporaryPassword });
  }),
);

usersRouter.post(
  '/:id/reset-2fa',
  validate({ params: idParams(z) }),
  wrap(async (req, res) => {
    const target = await loadTarget(req.params.id);
    if (target.id === req.user!.id) throw new HttpError(400, 'You cannot reset your own two-factor authentication.');
    await prisma.$transaction([
      prisma.backupCode.deleteMany({ where: { userId: target.id } }),
      prisma.user.update({
        where: { id: target.id },
        data: { totpSecretEnc: null, totpPendingEnc: null, totpEnabled: false, totpLastStep: null, sessionVersion: { increment: 1 } },
      }),
    ]);
    await unlockAccount(target.id);
    await audit(req, {
      userId: req.user!.id,
      email: req.user!.email,
      action: 'user.2fa.reset',
      meta: { targetId: target.id, targetEmail: target.email },
    });
    res.json({ ok: true });
  }),
);

usersRouter.post(
  '/:id/deactivate',
  validate({ params: idParams(z) }),
  wrap(async (req, res) => {
    const target = await loadTarget(req.params.id);
    if (target.id === req.user!.id) throw new HttpError(400, 'You cannot deactivate your own account.');
    await assertNotLastAdmin(target, 'deactivate');
    const user = await prisma.user.update({
      where: { id: target.id },
      data: { active: false, sessionVersion: { increment: 1 } },
      select: publicUser,
    });
    await audit(req, {
      userId: req.user!.id,
      email: req.user!.email,
      action: 'user.deactivated',
      meta: { targetId: target.id, targetEmail: target.email },
    });
    res.json(user);
  }),
);

usersRouter.post(
  '/:id/activate',
  validate({ params: idParams(z) }),
  wrap(async (req, res) => {
    const target = await loadTarget(req.params.id);
    const user = await prisma.user.update({ where: { id: target.id }, data: { active: true }, select: publicUser });
    await audit(req, {
      userId: req.user!.id,
      email: req.user!.email,
      action: 'user.activated',
      meta: { targetId: target.id, targetEmail: target.email },
    });
    res.json(user);
  }),
);

usersRouter.delete(
  '/:id',
  validate({ params: idParams(z) }),
  wrap(async (req, res) => {
    const target = await loadTarget(req.params.id);
    if (target.id === req.user!.id) throw new HttpError(400, 'You cannot delete your own account.');
    await assertNotLastAdmin(target, 'delete');
    await prisma.user.delete({ where: { id: target.id } });
    await audit(req, {
      userId: req.user!.id,
      email: req.user!.email,
      action: 'user.deleted',
      meta: { targetId: target.id, targetEmail: target.email },
    });
    res.status(204).end();
  }),
);

/** Mounted at /api/admin/audit (ADMIN only). */
export const auditRouter = Router();
auditRouter.use(requireRole('ADMIN'));
const auditQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  action: z.string().trim().max(60).optional(),
});
auditRouter.get(
  '/',
  validate({ query: auditQuery }),
  wrap(async (req, res) => {
    const { page, limit, action } = req.query as unknown as z.infer<typeof auditQuery>;
    const where = action ? { action } : {};
    const [total, rows] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    ]);
    res.json({ items: rows, total });
  }),
);
