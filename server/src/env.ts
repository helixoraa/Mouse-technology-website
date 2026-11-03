import 'dotenv/config';
import { z } from 'zod';
import { assertProductionSecrets } from './secrets.js';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  /** Neon direct connection used by migrations. Defaults to DATABASE_URL (scripts/prisma.mjs) for local development. */
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  /** 32-byte AES-256-GCM key (64 hex chars or base64) encrypting TOTP secrets. Required in production. */
  TOTP_ENCRYPTION_KEY: z.string().optional(),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  /** "local" writes to UPLOAD_DIR (dev/docker). "blob" uses Vercel Blob (serverless: no persistent disk). */
  STORAGE_DRIVER: z.enum(['local', 'blob']).default('local'),
  /** Required when STORAGE_DRIVER=blob (Vercel Storage tab creates it). */
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  UPLOAD_DIR: z.string().default('uploads'),
  /** Set to "false" when serving over plain http in production (e.g. local docker compose). Defaults to true in production. */
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.STORAGE_DRIVER === 'blob' && !parsed.data.BLOB_READ_WRITE_TOKEN?.trim()) {
  console.error('STORAGE_DRIVER=blob requires BLOB_READ_WRITE_TOKEN (create a Blob store in the Vercel Storage tab, then pull the env).');
  process.exit(1);
}

assertProductionSecrets(parsed.data);

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
