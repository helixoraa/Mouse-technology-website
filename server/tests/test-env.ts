import 'dotenv/config';
import os from 'node:os';
import path from 'node:path';

/** Dev database URL (server/.env) with the database name replaced by maouaj_test. Tests never touch the dev data. */
const dev = process.env.DATABASE_URL ?? 'postgresql://maouaj:maouaj@localhost:5432/maouaj?schema=public';

function withDb(url: string, db: string): string {
  const u = new URL(url);
  u.pathname = `/${db}`;
  return u.toString();
}

export const ADMIN_DB_URL = withDb(dev, 'postgres');
export const TEST_DB_URL = withDb(dev, 'maouaj_test');

/** Environment injected into the test workers (and used by CLI/seed child processes). */
export const TEST_ENV = {
  NODE_ENV: 'test',
  DATABASE_URL: TEST_DB_URL,
  DIRECT_URL: TEST_DB_URL,
  JWT_SECRET: 'test-jwt-secret-0123456789abcdef0123456789abcdef',
  CLIENT_URL: 'http://localhost:5173',
  BCRYPT_ROUNDS: '4',
  ADMIN_EMAIL: 'seed-admin@example.com',
  ADMIN_PASSWORD: 'Seed-Admin-Pass-2026!',
  UPLOAD_DIR: path.join(os.tmpdir(), 'maouaj-uploads-test'),
};
