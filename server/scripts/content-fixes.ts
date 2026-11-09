/**
 * One-off content corrections for data that already lives in the database (the seed only creates missing rows,
 * so editing seed files never changes an existing site). Safe to run more than once.
 *
 *   npm run content:fix -w server [-- --step=<step>]            dry run against DATABASE_URL (prints what would change)
 *   npm run content:fix -w server -- [--step=<step>] --apply    write the changes
 *   npm run prod:content-fix [-- --step=<step>] [--apply]       same, against production (.env.production.local)
 * Each step is separate; without --step the "names" step runs.
 *
 * --step=names (Round 1)
 *  - business name "HussainandMuallima.com" (any spacing/case variant) -> "HossainandMoallema.com" in every page
 *    section and service, and the business card's link -> https://hossainandmoallema.com/
 *  - blog posts: clear the old hard-coded "dateLabel" (e.g. "18/24/2026"). The site no longer reads it and always
 *    shows the real publishedAt as "18 Nov 2026", so this is housekeeping only.
 * --step=image
 *  - points every reference to the business card image seed/project-hussain.webp (local /uploads path or its Vercel
 *    Blob URL) at seed/project-hossain-moallema.webp. With STORAGE_DRIVER=blob the new file is uploaded from
 *    server/seed-media first (once); locally it is copied into UPLOAD_DIR/seed. The old file is left in place.
 * --step=seed-ids
 *  - re-keys the seed's services and posts to their fixed ids (prisma/seed-ids.ts), so a later seed run matches them by
 *    id and can never duplicate a row whose slug was renamed. The seed does this itself too; this step just does it now.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/db.js';
import { adoptSeedIds } from '../prisma/seed-ids.js';

const apply = process.argv.includes('--apply');
const step = process.argv.find((a) => a.startsWith('--step='))?.slice('--step='.length) ?? 'names';

const OLD_NAME = /hussain\s*(?:and|&)?\s*muallima/gi;
const HAS_OLD_NAME = /hussain\s*(?:and|&)?\s*muallima/i;
const fixName = (s: string) => s.replace(OLD_NAME, (m) => (m[0] === m[0].toUpperCase() ? 'HossainandMoallema' : 'hossainandmoallema'));
const BUSINESS_URL = 'https://hossainandmoallema.com/';

/** Applies `fn` to every string inside a JSON value; returns the new value and how many strings changed. */
function mapStrings(value: unknown, fn: (s: string) => string): { value: unknown; changed: number } {
  if (typeof value === 'string') {
    const next = fn(value);
    return { value: next, changed: next === value ? 0 : 1 };
  }
  if (Array.isArray(value)) {
    let changed = 0;
    const out = value.map((v) => {
      const r = mapStrings(v, fn);
      changed += r.changed;
      return r.value;
    });
    return { value: out, changed };
  }
  if (value && typeof value === 'object') {
    let changed = 0;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const r = mapStrings(v, fn);
      changed += r.changed;
      out[k] = r.value;
    }
    return { value: out, changed };
  }
  return { value, changed: 0 };
}

async function businessName() {
  let rows = 0;
  for (const s of await prisma.pageSection.findMany()) {
    const r = mapStrings(s.content, fixName);
    if (!r.changed) continue;
    rows++;
    console.log(`  PageSection ${s.page}/${s.key} (${s.id}): ${r.changed} text value(s)`);
    if (apply) await prisma.pageSection.update({ where: { id: s.id }, data: { content: r.value as Prisma.InputJsonValue } });
  }
  for (const s of await prisma.service.findMany()) {
    const isBusiness = HAS_OLD_NAME.test(`${s.slug} ${s.title}`) || /hossainandmoallema/i.test(s.slug);
    const data: Prisma.ServiceUpdateInput = {};
    for (const field of ['slug', 'title', 'summary', 'description', 'ctaLabel'] as const) {
      const v = s[field];
      if (typeof v === 'string' && fixName(v) !== v) data[field] = fixName(v);
    }
    const extra = mapStrings(s.extra, fixName);
    if (extra.changed) data.extra = extra.value as Prisma.InputJsonValue;
    if (isBusiness && s.ctaHref !== BUSINESS_URL) data.ctaHref = BUSINESS_URL;
    if (!Object.keys(data).length) continue;
    rows++;
    console.log(`  Service ${s.slug} (${s.id}): ${JSON.stringify(data)}`);
    if (apply) await prisma.service.update({ where: { id: s.id }, data });
  }
  return rows;
}

const NEW_IMAGE = 'project-hossain-moallema.webp';
/** The old image as a local path (/uploads/seed/…) or as its Blob URL (https://<store>.public.blob.vercel-storage.com/seed/…). */
const OLD_IMAGE_REF = /(?:https:\/\/[^\s"'()]+\/|\/uploads\/)seed\/project-hussain\.webp/g;
const seedMediaFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../seed-media', NEW_IMAGE);

/** URL the new image is served from, uploading (Blob) or copying (local) it when --apply is set and it is missing. */
async function newImageUrl(): Promise<string> {
  if (!fs.existsSync(seedMediaFile)) throw new Error(`Missing ${seedMediaFile}`);
  const key = `seed/${NEW_IMAGE}`;
  if (process.env.STORAGE_DRIVER !== 'blob') {
    const dest = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads', key);
    if (!fs.existsSync(dest)) {
      console.log(`  ${apply ? 'copied' : 'would copy'} ${NEW_IMAGE} -> ${dest}`);
      if (apply) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(seedMediaFile, dest);
      }
    }
    return `/uploads/${key}`;
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error('STORAGE_DRIVER=blob requires BLOB_READ_WRITE_TOKEN');
  const blob = await import('@vercel/blob');
  const known = await prisma.media.findFirst({ where: { filename: key, url: { startsWith: 'https://' } } });
  const url = known?.url ?? (await blob.list({ prefix: key, limit: 10, token })).blobs.find((b) => b.pathname === key)?.url;
  if (url) {
    console.log(`  ${key} is already in Blob: ${url}`);
    if (!known && apply)
      await prisma.media.create({ data: { url, filename: key, mimeType: 'image/webp', size: fs.statSync(seedMediaFile).size } });
    return url;
  }
  if (!apply) {
    console.log(`  would upload ${key} to Blob`);
    return `https://<store>.public.blob.vercel-storage.com/${key}`;
  }
  const put = await blob.put(key, fs.readFileSync(seedMediaFile), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: 'image/webp',
    token,
  });
  await prisma.media.create({ data: { url: put.url, filename: key, mimeType: 'image/webp', size: fs.statSync(seedMediaFile).size } });
  console.log(`  uploaded ${key}: ${put.url}`);
  return put.url;
}

async function renameImage() {
  const url = await newImageUrl();
  const fix = (s: string) => s.replace(OLD_IMAGE_REF, url);
  let rows = 0;
  for (const s of await prisma.pageSection.findMany()) {
    const r = mapStrings(s.content, fix);
    if (!r.changed) continue;
    rows++;
    console.log(`  PageSection ${s.page}/${s.key}: ${r.changed} reference(s)`);
    if (apply) await prisma.pageSection.update({ where: { id: s.id }, data: { content: r.value as Prisma.InputJsonValue } });
  }
  for (const s of await prisma.service.findMany()) {
    const data: Prisma.ServiceUpdateInput = {};
    if (s.image && fix(s.image) !== s.image) data.image = fix(s.image);
    const extra = mapStrings(s.extra, fix);
    if (extra.changed) data.extra = extra.value as Prisma.InputJsonValue;
    if (!Object.keys(data).length) continue;
    rows++;
    console.log(`  Service ${s.slug}: ${s.image} -> ${data.image ?? '(unchanged)'}${extra.changed ? ' (+extra)' : ''}`);
    if (apply) await prisma.service.update({ where: { id: s.id }, data });
  }
  for (const p of await prisma.post.findMany()) {
    const data: Prisma.PostUpdateInput = {};
    if (p.image && fix(p.image) !== p.image) data.image = fix(p.image);
    if (p.body && fix(p.body) !== p.body) data.body = fix(p.body);
    if (!Object.keys(data).length) continue;
    rows++;
    console.log(`  Post ${p.slug}: image reference(s)`);
    if (apply) await prisma.post.update({ where: { id: p.id }, data });
  }
  return rows;
}

async function dateLabels() {
  const posts = await prisma.post.findMany({ where: { dateLabel: { not: null } }, select: { id: true, slug: true, dateLabel: true } });
  for (const p of posts) console.log(`  Post ${p.slug}: dateLabel ${JSON.stringify(p.dateLabel)} -> null`);
  if (apply && posts.length) await prisma.post.updateMany({ where: { id: { in: posts.map((p) => p.id) } }, data: { dateLabel: null } });
  return posts.length;
}

const report = (n: number, what: string) => console.log(n ? `${n} ${what} ${apply ? 'updated' : 'would change'}.` : 'Nothing to change.');

const steps: Record<string, () => Promise<void>> = {
  names: async () => {
    console.log('Business name / link:');
    report(await businessName(), 'row(s)');
    console.log('Blog date labels:');
    report(await dateLabels(), 'post(s)');
  },
  image: async () => {
    console.log(`Business image -> ${NEW_IMAGE}:`);
    report(await renameImage(), 'row(s)');
  },
  'seed-ids': async () => {
    console.log('Seed services/posts -> fixed ids:');
    report(await adoptSeedIds(prisma, { apply, log: console.log }), 'row(s)');
  },
};

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const run = steps[step];
  if (!run) throw new Error(`Unknown --step=${step}. Steps: ${Object.keys(steps).join(', ')}`);
  console.log(`Step "${step}": ${apply ? 'applying…' : 'dry run (nothing is written; pass --apply to write)'}`);
  await run();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
