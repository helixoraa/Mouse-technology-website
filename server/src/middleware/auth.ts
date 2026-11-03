import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env, isProd } from '../env.js';
import { prisma } from '../db.js';

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

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '8h' });
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProd,
  maxAge: MAX_AGE_MS,
  path: '/',
};

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME] as string | undefined;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

export const requireRole =
  (...roles: Array<'ADMIN' | 'EDITOR'>) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
