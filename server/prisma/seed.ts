/**
 * Seeds the database with the admin user and all Figma content.
 *   npm run db:seed            -> creates anything missing, never overwrites admin edits
 *   npm run db:seed -- --reset -> also resets sections/services/settings back to the Figma content (never touches users)
 * Refuses to run against production (NODE_ENV=production, or a database host listed in .env.production.local or
 * PRODUCTION_DB_HOSTS) unless --force-production is passed. --allow-production-env is narrower: it accepts
 * NODE_ENV=production (a self-hosted container seeding its own database) but still refuses a production database host,
 * and still refuses --reset under NODE_ENV=production. Services and posts are matched by their fixed seed id, so a
 * renamed slug never produces a duplicate.
 * Images: every file in server/seed-media is copied to uploads/seed (png/jpg -> webp, svg/webp copied as-is).
 *   With STORAGE_DRIVER=blob they are uploaded to Vercel Blob once instead (idempotent, tracked in the Media table) and every
 *   /uploads/seed/<file> reference in the seed content is rewritten to the Blob URL before it is saved.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PrismaClient, type Prisma } from '@prisma/client';
import { assertProductionSecrets } from '../src/secrets.js';
import { hashPassword } from '../src/lib/password.js';
import { migrateLocalMedia, printMigrateSummary } from '../src/lib/media-migrate.js';
import { productionDbHosts, productionTargets } from '../src/lib/production-guard.js';
import { adoptSeedIds } from './seed-ids.js';
import type { PageSeed } from './seed-data/types.js';
import { faqs, posts, services, settings, team, testimonials } from './seed-data/collections.js';

const force = process.argv.includes('--force-production');
const allowProductionEnv = process.argv.includes('--allow-production-env');
const reset = process.argv.includes('--reset') || process.env.SEED_RESET === 'true';
const productionReasons = productionTargets(process.env, productionDbHosts(process.env), { allowProductionEnv });
if (productionReasons.length && !force) {
  console.error(
    `Refusing to seed: this looks like the production database (${productionReasons.join('; ')}).\n` +
      'The seed is for new and development databases. If you really mean to seed production, pass --force-production\n' +
      '(npm run prod:seed -- --force-production).',
  );
  process.exit(1);
}
if (reset && process.env.NODE_ENV === 'production' && !force) {
  console.error(
    'Refusing to seed with --reset (or SEED_RESET=true) when NODE_ENV=production: it overwrites content edited in the admin.\n' +
      '--allow-production-env does not cover this; pass --force-production if you really mean it.',
  );
  process.exit(1);
}
assertProductionSecrets(process.env); // never seed a production database with default secrets

const prisma = new PrismaClient();
const here = path.dirname(fileURLToPath(import.meta.url));
if (productionReasons.length) console.warn(`--force-production: seeding production${reset ? ' WITH --reset' : ''}.`);
const json = (v: unknown) => v as Prisma.InputJsonValue;
const useBlob = process.env.STORAGE_DRIVER === 'blob';
/** '/uploads/seed/<file>' -> public Blob URL (filled by seedMediaToBlob). */
const seedUrlMap = new Map<string, string>();

/** Replaces /uploads/seed/<file> inside every string of a plain JSON-like value, in place. */
function rewriteSeedUrls(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach((v, i) => {
      if (typeof v === 'string') node[i] = replaceSeedUrls(v);
      else rewriteSeedUrls(v);
    });
  } else if (node && typeof node === 'object' && Object.getPrototypeOf(node) === Object.prototype) {
    const o = node as Record<string, unknown>;
    for (const k of Object.keys(o)) {
      if (typeof o[k] === 'string') o[k] = replaceSeedUrls(o[k] as string);
      else rewriteSeedUrls(o[k]);
    }
  }
}
const replaceSeedUrls = (str: string) => str.replace(/\/uploads\/seed\/[\w.-]+/g, (m) => seedUrlMap.get(m) ?? m);

/** Production/blob mode: upload server/seed-media to Vercel Blob once; Media rows (filename "seed/<file>") make re-runs idempotent. */
async function seedMediaToBlob(src: string) {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error('STORAGE_DRIVER=blob requires BLOB_READ_WRITE_TOKEN');
  const { put } = await import('@vercel/blob');
  const types: Record<string, string> = { '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif' };
  let uploaded = 0;
  let reused = 0;
  for (const file of fs.readdirSync(src)) {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file, ext);
    const convert = ['.png', '.jpg', '.jpeg'].includes(ext);
    if (!convert && !types[ext]) continue;
    const outName = convert ? `${base}.webp` : file;
    const key = `seed/${outName}`;
    const existing = await prisma.media.findFirst({ where: { filename: key, url: { startsWith: 'https://' } } });
    if (existing) {
      seedUrlMap.set(`/uploads/seed/${outName}`, existing.url);
      reused++;
      continue;
    }
    const from = path.join(src, file);
    const buffer = convert ? await sharp(from).webp({ quality: 86 }).toBuffer() : fs.readFileSync(from);
    const contentType = convert ? 'image/webp' : types[ext];
    const blob = await put(key, buffer, { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType, token });
    await prisma.media.create({ data: { url: blob.url, filename: key, mimeType: contentType, size: buffer.length } });
    seedUrlMap.set(`/uploads/seed/${outName}`, blob.url);
    uploaded++;
  }
  console.log(`Media -> Vercel Blob: ${uploaded} uploaded, ${reused} already there`);
}

async function seedMedia() {
  const src = path.resolve(here, '../seed-media');
  if (useBlob) {
    if (fs.existsSync(src)) await seedMediaToBlob(src);
    return;
  }
  const dest = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads', 'seed');
  fs.mkdirSync(dest, { recursive: true });
  if (!fs.existsSync(src)) return;
  let n = 0;
  for (const file of fs.readdirSync(src)) {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file, ext);
    const from = path.join(src, file);
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      await sharp(from)
        .webp({ quality: 86 })
        .toFile(path.join(dest, `${base}.webp`));
    } else if (['.svg', '.webp', '.gif'].includes(ext)) {
      fs.copyFileSync(from, path.join(dest, file));
    } else continue;
    n++;
  }
  console.log(`Media: ${n} files -> ${dest}`);
}

/** Client-bundled animations (client/public/animations) are registered in the Media library so admins can see and reuse them. */
async function seedBundledMedia() {
  const dir = path.resolve(here, '../../client/public/animations');
  if (!fs.existsSync(dir)) return;
  const types: Record<string, string> = { '.svg': 'image/svg+xml', '.webp': 'image/webp' };
  let n = 0;
  for (const file of fs.readdirSync(dir)) {
    const mimeType = types[path.extname(file).toLowerCase()];
    if (!mimeType) continue;
    const url = `/animations/${file}`;
    const size = fs.statSync(path.join(dir, file)).size;
    const existing = await prisma.media.findFirst({ where: { url } });
    if (existing) await prisma.media.update({ where: { id: existing.id }, data: { filename: file, mimeType, size } });
    else await prisma.media.create({ data: { url, filename: file, mimeType, size } });
    n++;
  }
  console.log(`Bundled media registered: ${n}`);
}

/** Creates the first admin only when missing. Never changes an existing account (password, role), even with --reset. */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed the admin user');
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user exists, left unchanged: ${email}`);
    return;
  }
  await prisma.user.create({
    data: { email, name: 'Administrator', password: await hashPassword(password), role: 'ADMIN', mustChangePassword: true },
  });
  console.log(`Admin user created: ${email} (must change password on first login)`);
}

async function loadPageSeeds(): Promise<PageSeed[]> {
  const dir = path.join(here, 'seed-data');
  const skip = new Set(['types', 'collections', 'index', 'shared-inner']);
  const out: PageSeed[] = [];
  for (const file of fs.readdirSync(dir).sort()) {
    const ext = path.extname(file);
    const name = path.basename(file, ext);
    if (!['.ts', '.js'].includes(ext) || file.endsWith('.d.ts') || skip.has(name)) continue;
    const mod = (await import(pathToFileURL(path.join(dir, file)).href)) as { default?: PageSeed };
    if (mod.default?.page && Array.isArray(mod.default.sections)) out.push(mod.default);
    else console.warn(`Skipping ${file}: no valid default PageSeed export`);
  }
  return out;
}

async function seedPages(pages: PageSeed[]) {
  for (const p of pages) {
    for (const s of p.sections) {
      await prisma.pageSection.upsert({
        where: { page_key: { page: p.page, key: s.key } },
        update: reset ? { content: json(s.content), order: s.order } : {},
        create: { page: p.page, key: s.key, content: json(s.content), order: s.order, visible: true },
      });
    }
    console.log(`Page ${p.page}: ${p.sections.length} sections`);
  }
}

async function seedSettings(pages: PageSeed[]) {
  const existing = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const pageSeo = Object.fromEntries(pages.map((p) => [p.page, p.seo]));
  const seo = { ...settings.seo, pages: { ...(((existing?.seo ?? {}) as { pages?: object }).pages ?? {}), ...pageSeo } };
  const data = {
    siteName: settings.siteName,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    socials: json(settings.socials),
    nav: json(settings.nav),
    footer: json(settings.footer),
    seo: json(seo),
  };
  if (!existing) await prisma.siteSettings.create({ data: { id: 1, ...data } });
  else if (reset) await prisma.siteSettings.update({ where: { id: 1 }, data });
  else await prisma.siteSettings.update({ where: { id: 1 }, data: { seo: json(seo) } });
  console.log('Site settings ready');
}

async function seedCollections() {
  const adopted = await adoptSeedIds(prisma, { log: console.log });
  if (adopted) console.log(`Seed ids: ${adopted} existing row(s) re-keyed to their fixed id`);
  for (const s of services) {
    await prisma.service.upsert({ where: { id: s.id }, update: reset ? s : {}, create: s });
  }
  for (const p of posts) {
    await prisma.post.upsert({ where: { id: p.id }, update: reset ? p : {}, create: p });
  }
  if (reset || (await prisma.teamMember.count()) === 0) {
    await prisma.teamMember.deleteMany();
    await prisma.teamMember.createMany({ data: team });
  }
  if (reset || (await prisma.faq.count()) === 0) {
    await prisma.faq.deleteMany();
    await prisma.faq.createMany({ data: faqs });
  }
  if (testimonials.length && (reset || (await prisma.testimonial.count()) === 0)) {
    await prisma.testimonial.deleteMany();
    await prisma.testimonial.createMany({ data: testimonials });
  }
  console.log(`Collections: ${services.length} services, ${team.length} team, ${faqs.length} faqs, ${posts.length} posts`);
}

async function main() {
  await seedMedia();
  await seedBundledMedia();
  await seedAdmin();
  const pages = await loadPageSeeds();
  if (useBlob) for (const data of [pages, services, posts, team, faqs, testimonials, settings]) rewriteSeedUrls(data);
  await seedPages(pages);
  await seedSettings(pages);
  await seedCollections();
  if (useBlob) {
    // Safety net: seeding never overwrites existing rows, so records created by an earlier local-storage seed (or edited
    // in the admin) may still hold /uploads/... paths. Rewrite every one of them to its Blob URL.
    const r = await migrateLocalMedia(prisma, { log: console.log });
    printMigrateSummary(r, false);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
