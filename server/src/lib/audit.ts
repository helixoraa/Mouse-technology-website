import type { Request } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';

export type AuditAction =
  | 'login.password.ok'
  | 'login.password.fail'
  | 'password.changed'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.deactivated'
  | 'user.activated'
  | 'user.password.reset'
  | 'session.logout'
  | 'account.locked'
  | 'cli.admin.reset';

/** Records a security-relevant event. Never throws (auditing must not break the request). */
export async function audit(
  req: Request | { ip?: string } | null,
  entry: { userId?: string | null; email?: string; action: AuditAction; success?: boolean; meta?: Record<string, unknown> },
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        email: (entry.email ?? '').toLowerCase(),
        action: entry.action,
        success: entry.success ?? true,
        ip: (req && 'ip' in req ? req.ip : undefined) ?? null,
        meta: entry.meta ? (entry.meta as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (err) {
    console.error('audit log failed', err);
  }
}
