import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { beforeEach, describe, expect, it } from 'vitest';
import { dbHost, productionDbHosts, productionTargets } from '../src/lib/production-guard.js';
import { adoptSeedIds } from '../prisma/seed-ids.js';
import { posts, services } from '../prisma/seed-data/collections.js';
import { prisma } from './helpers.js';
import { TEST_ENV } from './test-env.js';

const NEON = 'postgresql://u:p@ep-calm-sun-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const NEON_POOLED = 'postgresql://u:p@ep-calm-sun-123456-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';

describe('production guard', () => {
  it('folds the Neon pooler endpoint into the direct host', () => {
    expect(dbHost(NEON_POOLED)).toBe(dbHost(NEON));
    expect(dbHost('not a url')).toBeNull();
  });

  it('reads production hosts from .env.production.local and PRODUCTION_DB_HOSTS', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'guard-')), '.env.production.local');
    fs.writeFileSync(file, `DATABASE_URL="${NEON_POOLED}"\n`);
    expect([...productionDbHosts({}, file)]).toEqual(['ep-calm-sun-123456.eu-central-1.aws.neon.tech']);
    expect([...productionDbHosts({ PRODUCTION_DB_HOSTS: 'db.example.com, other.example.com' }, null)]).toEqual([
      'db.example.com',
      'other.example.com',
    ]);
    expect(productionDbHosts({}, path.join(os.tmpdir(), 'missing.env')).size).toBe(0);
  });

  it('flags NODE_ENV=production or a database URL on a production host, and nothing else', () => {
    const prod = new Set([dbHost(NEON)!]);
    expect(productionTargets({ NODE_ENV: 'production' }, new Set())).toEqual(['NODE_ENV=production']);
    expect(productionTargets({ NODE_ENV: 'development', DATABASE_URL: NEON_POOLED }, prod).join()).toMatch(
      /DATABASE_URL points at the production/,
    );
    expect(productionTargets({ NODE_ENV: 'development', DIRECT_URL: NEON }, prod).join()).toMatch(/DIRECT_URL/);
    expect(productionTargets({ NODE_ENV: 'development', DATABASE_URL: TEST_ENV.DATABASE_URL }, prod)).toEqual([]);
  });
});

describe('seed identity', () => {
  const tsx = createRequire(import.meta.url).resolve('tsx/cli');
  const seed = (args: string[] = [], env: Record<string, string> = {}) =>
    spawnSync(process.execPath, [tsx, 'prisma/seed.ts', ...args], {
      cwd: process.cwd(),
      env: { ...process.env, ...TEST_ENV, ...env },
      encoding: 'utf8',
      timeout: 180_000,
    });
  const business = services.find((s) => s.id === 'seed-service-hossainandmoallema')!;

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE "Service","Post" RESTART IDENTITY CASCADE');
  });

  it('every seed service and post has a unique fixed id', () => {
    const ids = [...services, ...posts].map((r) => r.id);
    expect(ids.every((id) => id.startsWith('seed-'))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('re-keys a row created before fixed ids, found by its current or former slug', async () => {
    const { id: _id, ...data } = business;
    const legacy = await prisma.service.create({ data: { ...data, slug: 'hussainandmuallima-com' } });
    expect(await adoptSeedIds(prisma, { apply: false })).toBe(1);
    expect(await prisma.service.findUnique({ where: { id: legacy.id } })).not.toBeNull(); // dry run wrote nothing
    expect(await adoptSeedIds(prisma)).toBe(1);
    expect((await prisma.service.findUniqueOrThrow({ where: { id: business.id } })).slug).toBe('hussainandmuallima-com');
    expect(await adoptSeedIds(prisma)).toBe(0); // idempotent
  });

  it('refuses a database host listed as production, even outside NODE_ENV=production', () => {
    const res = seed([], { PRODUCTION_DB_HOSTS: 'localhost' });
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/Refusing to seed: .*DATABASE_URL points at the production database host \(localhost\)/);
  });

  it('never duplicates a service or post whose slug was renamed, including legacy rows', async () => {
    const { id: _id, ...data } = business;
    await prisma.service.create({ data: { ...data, slug: 'hussainandmuallima-com' } }); // pre-fixed-id production row
    const first = seed();
    expect(first.status, first.stderr).toBe(0);
    expect(await prisma.service.count()).toBe(services.length);
    await prisma.service.update({ where: { id: 'seed-service-bus-fare' }, data: { slug: 'bus-fare-renamed' } });
    await prisma.post.update({ where: { id: posts[0].id }, data: { slug: 'renamed-post' } });
    const second = seed();
    expect(second.status, second.stderr).toBe(0);
    expect(await prisma.service.count()).toBe(services.length);
    expect(await prisma.post.count()).toBe(posts.length);
    expect((await prisma.service.findUniqueOrThrow({ where: { id: 'seed-service-bus-fare' } })).slug).toBe('bus-fare-renamed');
  }, 360_000);
});
