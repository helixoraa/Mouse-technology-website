import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../db.js';
import { COOKIE_NAME, cookieOptions, requireAuth, signToken } from '../middleware/auth.js';
import { validate, wrap } from '../middleware/common.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

// Dummy hash so timing is similar whether or not the user exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

authRouter.post(
  '/login',
  loginLimiter,
  validate({ body: z.object({ email: z.string().trim().email(), password: z.string().min(1).max(200) }) }),
  wrap(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
    if (!user || !ok) return res.status(401).json({ error: 'Invalid email or password' });
    res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions);
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }),
);

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));
