// Runs the Prisma CLI with DIRECT_URL defaulting to DATABASE_URL (the schema declares directUrl for Neon;
// locally both are the same database). Usage: node scripts/prisma.mjs db push --skip-generate
import 'dotenv/config';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

// Neon (Vercel integration) exposes the direct connection as DATABASE_URL_UNPOOLED; locally both URLs are the same database.
if (!process.env.DIRECT_URL) process.env.DIRECT_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

const require = createRequire(import.meta.url);
const bin = require.resolve('prisma/build/index.js');
const res = spawnSync(process.execPath, [bin, ...process.argv.slice(2)], { stdio: 'inherit', env: process.env });
process.exit(res.status ?? 1);
