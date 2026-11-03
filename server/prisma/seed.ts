/**
 * Seeds the database with the admin user and all Figma content.
 *   npm run db:seed            -> creates anything missing, never overwrites admin edits
 *   npm run db:seed -- --reset -> also resets sections/services/settings back to the Figma content
 * Images: every file in server/seed-media is copied to uploads/seed (png/jpg -> webp, svg/webp copied as-is).
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { PrismaClient, type Prisma } from '@prisma/client';
import type { PageSeed } from './seed-data/types.js';
import { faqs, posts, services, settings, team, testimonials } from './seed-data/collections.js';

const prisma = new PrismaClient();
const here = path.dirname(fileURLToPath(import.meta.url));
const reset = process.argv.includes('--reset') || process.env.SEED_RESET === 'true';
const json = (v: unknown) => v as Prisma.InputJsonValue;

async function seedMedia() {
  const src = path.resolve(here, '../seed-media');
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

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed the admin user');
  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: reset ? { password: hash, role: 'ADMIN' } : {},
    create: { email, name: 'Administrator', password: hash, role: 'ADMIN' },
  });
  console.log(`Admin user: ${email}`);
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
  for (const s of services) {
    await prisma.service.upsert({ where: { slug: s.slug }, update: reset ? s : {}, create: s });
  }
  for (const p of posts) {
    await prisma.post.upsert({ where: { slug: p.slug }, update: reset ? p : {}, create: p });
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
  await seedAdmin();
  const pages = await loadPageSeeds();
  await seedPages(pages);
  await seedSettings(pages);
  await seedCollections();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
