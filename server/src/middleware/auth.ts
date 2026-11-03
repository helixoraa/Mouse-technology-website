import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env, isProd } from '../env.js';
import { prisma } from '../db.js';
import { HttpError } from './common.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR';
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export const COOKIE_NAME = 'token';
const MAX_AGE_MS = 1000 * 60 * 60 * 8;
const ISSUER = 'maouaj';
const SESSION_AUD = 'maouaj:session';
const PREAUTH_AUD = 'maouaj:preauth';

/** Pre-auth tokens use a different secret (derived) and audience, so they can never be used as a session. */
const preAuthSecret = () => crypto.createHmac('sha256', env.JWT_SECRET).update('maouaj:preauth:v1').digest('hex');

export type PreAuthStage = 'change-password' | 'setup-2fa' | 'verify-code';
export interface PreAuthPayload {
  sub: string;
  stage: PreAuthStage;
  sv: number;
  jti: string;
}

export function signPreAuth(user: { id: string; sessionVersion: number }, stage: PreAuthStage): string {
  return jwt.sign({ stage, sv: user.sessionVersion }, preAuthSecret(), {
    subject: user.id,
    audience: PREAUTH_AUD,
    issuer: ISSUER,
    expiresIn: '5m',
    jwtid: crypto.randomUUID(),
  });
}

export function verifyPreAuth(token: string, stage: PreAuthStage): PreAuthPayload {
  let payload: PreAuthPayload;
  try {
    payload = jwt.verify(token, preAuthSecret(), { audience: PREAUTH_AUD, issuer: ISSUER }) as unknown as PreAuthPayload;
  } catch {
    throw new HttpError(401, 'Your sign-in expired. Please sign in again.');
  }
  if (payload.stage !== stage) throw new HttpError(401, 'That step is not available right now. Please sign in again.');
  return payload;
}

export function signSession(user: { id: string; sessionVersion: number }): string {
  return jwt.sign({ sv: user.sessionVersion }, env.JWT_SECRET, {
    subject: user.id,
    audience: SESSION_AUD,
    issuer: ISSUER,
    expiresIn: '8h',
  });
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProd,
  maxAge: MAX_AGE_MS,
  path: '/',
};

export function setSessionCookie(res: Response, user: { id: string; sessionVersion: number }) {
  res.cookie(COOKIE_NAME, signSession(user), cookieOptions);
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
}

/** Full session required: valid cookie, user still exists + active, sessionVersion unchanged. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME] as string | undefined;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    let payload: { sub: string; sv: number };
    try {
      payload = jwt.verify(token, env.JWT_SECRET, { audience: SESSION_AUD, issuer: ISSUER }) as unknown as { sub: string; sv: number };
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active || user.sessionVersion !== payload.sv) return res.status(401).json({ error: 'Invalid or expired session' });
    req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

export const requireRole =
  (...roles: Array<'ADMIN' | 'EDITOR'>) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
