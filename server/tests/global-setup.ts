import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { ADMIN_DB_URL, TEST_DB_URL, TEST_ENV } from './test-env.js';

/** Recreates the maouaj_test database on the dev Postgres and applies the real migrations to it (so they are tested too). */
export default async function setup() {
  const admin = new PrismaClient({ datasources: { db: { url: ADMIN_DB_URL } } });
  try {
    await admin.$executeRawUnsafe('DROP DATABASE IF EXISTS maouaj_test WITH (FORCE)');
    await admin.$executeRawUnsafe('CREATE DATABASE maouaj_test');
  } finally {
    await admin.$disconnect();
  }
  const res = spawnSync(process.execPath, ['scripts/prisma.mjs', 'migrate', 'deploy'], {
    cwd: process.cwd(),
    env: { ...process.env, ...TEST_ENV, DATABASE_URL: TEST_DB_URL, DIRECT_URL: TEST_DB_URL },
    encoding: 'utf8',
  });
  if (res.status !== 0) throw new Error(`prisma migrate deploy failed for the test database:\n${res.stdout}\n${res.stderr}`);
}
