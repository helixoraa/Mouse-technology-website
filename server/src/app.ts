import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './env.js';
import { authRouter } from './routes/auth.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { errorHandler } from './middleware/common.js';
import { uploadRoot } from './lib/storage.js';

/** The Express app (no listen): imported by src/index.ts (local/docker) and by the serverless entry (api/index.ts). */
export const app = express();
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Local driver only: with STORAGE_DRIVER=blob files live on Vercel Blob (serverless functions have no persistent disk).
if (env.STORAGE_DRIVER === 'local') app.use('/uploads', express.static(uploadRoot, { maxAge: '7d', fallthrough: true }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', publicRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

export default app;
