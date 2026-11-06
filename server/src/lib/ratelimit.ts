import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';

export interface HitResult {
  count: number;
  resetAt: Date;
}

/**
 * Atomically increments the counter for `key` (starting a new window when the previous one expired).
 * One SQL statement, so it is safe across concurrent serverless invocations.
 */
export async function hit(key: string, windowMs: number): Promise<HitResult> {
  const resetAt = new Date(Date.now() + windowMs);
  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>(Prisma.sql`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`);
  if (Math.random() < 0.01) void purgeExpired();
  return rows[0];
}

/** Current state without incrementing (null when absent/expired). */
export async function peek(key: string): Promise<HitResult | null> {
  const row = await prisma.rateLimit.findUnique({ where: { key } });
  if (!row || row.resetAt.getTime() <= Date.now()) return null;
  return { count: row.count, resetAt: row.resetAt };
}

export async function clear(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

export async function purgeExpired(): Promise<void> {
  try {
    await prisma.rateLimit.deleteMany({ where: { resetAt: { lte: new Date() } } });
  } catch {
    /* best effort */
  }
}

export const LOCK_MS = 15 * 60 * 1000;
const lockKey = (userId: string) => `lock:user:${userId}`;

/** Locks an account for 15 minutes (no password login). */
export async function lockAccount(userId: string): Promise<void> {
  const resetAt = new Date(Date.now() + LOCK_MS);
  await prisma.rateLimit.upsert({
    where: { key: lockKey(userId) },
    create: { key: lockKey(userId), count: 1, resetAt },
    update: { count: 1, resetAt },
  });
}
export async function lockedUntil(userId: string): Promise<Date | null> {
  return (await peek(lockKey(userId)))?.resetAt ?? null;
}
export async function unlockAccount(userId: string): Promise<void> {
  await clear(lockKey(userId));
}

export const clientIp = (req: Request): string => req.ip || req.socket.remoteAddress || 'unknown';

/** Express middleware: at most `limit` requests per `windowMs` for the derived key (default: per client IP). */
export function rateLimit(opts: { name: string; limit: number; windowMs: number; message: string; key?: (req: Request) => string }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const k = `${opts.name}:${opts.key ? opts.key(req) : clientIp(req)}`;
      const { count, resetAt } = await hit(k, opts.windowMs);
      res.setHeader('RateLimit-Limit', String(opts.limit));
      res.setHeader('RateLimit-Remaining', String(Math.max(0, opts.limit - count)));
      if (count > opts.limit) {
        res.setHeader('Retry-After', String(Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))));
        return res.status(429).json({ error: opts.message });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
