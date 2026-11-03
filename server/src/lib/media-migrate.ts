/**
 * Rewrites local "/uploads/..." media references stored in the database to public Vercel Blob URLs.
 * Used by `npm run prod:migrate-media` and by the seed (STORAGE_DRIVER=blob), so references can never stay local.
 *
 * Scans: Media rows, Post (image, body), TeamMember.photo, Service (image, extra), Testimonial.avatar,
 * SiteSettings (logoUrl + every JSON column) and every string inside PageSection.content.
 * Only strings that contain a "/uploads/<file>" path are touched; everything else is left exactly as it is.
 * A file is looked up in Blob first (Media row, then Blob listing) and uploaded only when missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import type { Prisma, PrismaClient } from '@prisma/client';

const here = path.dirname(fileURLToPath(import.meta.url));
const seedMediaDir = path.resolve(here, '../../seed-media');
const TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};
/** A relative /uploads/ path that is not already part of a longer URL or path. */
const PATH_RE = /(?<![\w/.:%-])\/uploads\/[\w.%/-]+/g;

export interface MigrateOptions {
  dryRun?: boolean;
  log?: (line: string) => void;
}
export interface MigrateResult {
  uploaded: string[];
  reused: string[];
  unresolved: string[];
  rewrites: Record<string, number>;
}

export async function migrateLocalMedia(prisma: PrismaClient, opts: MigrateOptions = {}): Promise<MigrateResult> {
  const log = opts.log ?? (() => {});
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is required to migrate media to Vercel Blob');
  const blob = await import('@vercel/blob');
  const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');

  const result: MigrateResult = { uploaded: [], reused: [], unresolved: [], rewrites: {} };
  const resolved = new Map<string, string | null>(); // local path -> blob url (null = could not resolve)
  const count = (label: string, n = 1) => (result.rewrites[label] = (result.rewrites[label] ?? 0) + n);

  /** Finds the local source file for "/uploads/..." and the Blob key it maps to. */
  function locate(localPath: string): { key: string; file: string; convert: boolean; contentType: string } | null {
    const rel = decodeURIComponent(localPath.replace(/^\/uploads\//, ''));
    if (rel.includes('..')) return null;
    const ext = path.extname(rel).toLowerCase();
    const stem = rel.slice(0, rel.length - ext.length);
    if (rel.startsWith('seed/')) {
      // seed images: committed originals in server/seed-media (png/jpg were converted to webp by the seed)
      const name = path.basename(stem);
      for (const cand of [`${name}${ext}`, `${name}.png`, `${name}.jpg`, `${name}.jpeg`]) {
        const file = path.join(seedMediaDir, cand);
        if (fs.existsSync(file)) {
          const convert = /\.(png|jpe?g)$/i.test(cand) && ext === '.webp';
          return { key: `seed/${path.basename(rel)}`, file, convert, contentType: TYPES[ext] ?? 'application/octet-stream' };
        }
      }
    }
    const file = path.join(uploadRoot, rel);
    if (fs.existsSync(file)) {
      return { key: `uploads/${rel}`, file, convert: false, contentType: TYPES[ext] ?? 'application/octet-stream' };
    }
    return null;
  }

  async function toBlobUrl(localPath: string): Promise<string | null> {
    if (resolved.has(localPath)) return resolved.get(localPath) ?? null;
    const src = locate(localPath);
    if (!src) {
      resolved.set(localPath, null);
      result.unresolved.push(localPath);
      return null;
    }
    // 1) already known in the Media table, 2) already in the store
    let url: string | undefined = (await prisma.media.findFirst({ where: { filename: src.key, url: { startsWith: 'https://' } } }))?.url;
    if (!url) {
      const listed = await blob.list({ prefix: src.key, limit: 10, token });
      url = listed.blobs.find((b) => b.pathname === src.key)?.url;
    }
    if (url) {
      result.reused.push(localPath);
    } else if (opts.dryRun) {
      url = `https://<store>.public.blob.vercel-storage.com/${src.key}`;
      result.uploaded.push(localPath);
    } else {
      const buffer = src.convert ? await sharp(src.file).webp({ quality: 86 }).toBuffer() : fs.readFileSync(src.file);
      const put = await blob.put(src.key, buffer, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: src.contentType,
        token,
      });
      url = put.url;
      result.uploaded.push(localPath);
      log(`  uploaded ${src.key}`);
    }
    if (!opts.dryRun) {
      const exists = await prisma.media.findFirst({ where: { url } });
      if (!exists)
        await prisma.media.create({ data: { url, filename: src.key, mimeType: src.contentType, size: fs.statSync(src.file).size } });
    }
    resolved.set(localPath, url);
    return url;
  }

  /** Collects every /uploads path in a string/JSON value. */
  function collect(node: unknown, into: Set<string>): void {
    if (typeof node === 'string') for (const m of node.matchAll(PATH_RE)) into.add(m[0]);
    else if (Array.isArray(node)) node.forEach((v) => collect(v, into));
    else if (node && typeof node === 'object') Object.values(node).forEach((v) => collect(v, into));
  }
  /** Returns a copy with local paths replaced (only those that resolved). */
  function rewrite<T>(node: T): T {
    if (typeof node === 'string') {
      return node.replace(PATH_RE, (m) => resolved.get(m) ?? m) as T;
    }
    if (Array.isArray(node)) return node.map((v) => rewrite(v)) as T;
    if (node && typeof node === 'object') {
      return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, rewrite(v)])) as T;
    }
    return node;
  }

  // ---- 1) gather every local reference ----
  const [medias, posts, team, services, testimonials, settings, sections] = await Promise.all([
    prisma.media.findMany(),
    prisma.post.findMany(),
    prisma.teamMember.findMany(),
    prisma.service.findMany(),
    prisma.testimonial.findMany(),
    prisma.siteSettings.findMany(),
    prisma.pageSection.findMany(),
  ]);
  const paths = new Set<string>();
  medias.forEach((m) => collect(m.url, paths));
  posts.forEach((p) => collect([p.image, p.body], paths));
  team.forEach((t) => collect(t.photo, paths));
  services.forEach((s) => collect([s.image, s.extra], paths));
  testimonials.forEach((t) => collect(t.avatar, paths));
  settings.forEach((s) => collect([s.logoUrl, s.socials, s.nav, s.footer, s.seo], paths));
  sections.forEach((s) => collect(s.content, paths));
  log(`Found ${paths.size} distinct local media path(s) in the database`);

  // ---- 2) resolve each to a Blob URL (uploading only when missing) ----
  for (const p of [...paths].sort()) await toBlobUrl(p);

  // ---- 3) rewrite references ----
  const changed = <T>(a: T, b: T) => JSON.stringify(a) !== JSON.stringify(b);
  const json = (v: unknown) => v as Prisma.InputJsonValue;
  const write = !opts.dryRun;

  for (const m of medias) {
    const url = rewrite(m.url);
    if (url === m.url) continue;
    count('Media.url');
    if (!write) continue;
    const dup = await prisma.media.findFirst({ where: { url, NOT: { id: m.id } } });
    if (dup)
      await prisma.media.delete({ where: { id: m.id } }); // the Blob URL is already registered
    else await prisma.media.update({ where: { id: m.id }, data: { url } });
  }
  for (const p of posts) {
    const data: Prisma.PostUpdateInput = {};
    if (p.image && rewrite(p.image) !== p.image) {
      data.image = rewrite(p.image);
      count('Post.image');
    }
    if (p.body && rewrite(p.body) !== p.body) {
      data.body = rewrite(p.body);
      count('Post.body');
    }
    if (write && Object.keys(data).length) await prisma.post.update({ where: { id: p.id }, data });
  }
  for (const t of team) {
    if (t.photo && rewrite(t.photo) !== t.photo) {
      count('TeamMember.photo');
      if (write) await prisma.teamMember.update({ where: { id: t.id }, data: { photo: rewrite(t.photo) } });
    }
  }
  for (const s of services) {
    const data: Prisma.ServiceUpdateInput = {};
    if (s.image && rewrite(s.image) !== s.image) {
      data.image = rewrite(s.image);
      count('Service.image');
    }
    if (s.extra && changed(s.extra, rewrite(s.extra))) {
      data.extra = json(rewrite(s.extra));
      count('Service.extra');
    }
    if (write && Object.keys(data).length) await prisma.service.update({ where: { id: s.id }, data });
  }
  for (const t of testimonials) {
    if (t.avatar && rewrite(t.avatar) !== t.avatar) {
      count('Testimonial.avatar');
      if (write) await prisma.testimonial.update({ where: { id: t.id }, data: { avatar: rewrite(t.avatar) } });
    }
  }
  for (const s of settings) {
    const data: Prisma.SiteSettingsUpdateInput = {};
    if (s.logoUrl && rewrite(s.logoUrl) !== s.logoUrl) {
      data.logoUrl = rewrite(s.logoUrl);
      count('SiteSettings.logoUrl');
    }
    for (const col of ['socials', 'nav', 'footer', 'seo'] as const) {
      if (changed(s[col], rewrite(s[col]))) {
        data[col] = json(rewrite(s[col]));
        count(`SiteSettings.${col}`);
      }
    }
    if (write && Object.keys(data).length) await prisma.siteSettings.update({ where: { id: s.id }, data });
  }
  for (const s of sections) {
    const next = rewrite(s.content);
    if (!changed(s.content, next)) continue;
    count('PageSection.content');
    log(`  section ${s.page}/${s.key}`);
    if (write) await prisma.pageSection.update({ where: { id: s.id }, data: { content: json(next) } });
  }
  return result;
}

export function printMigrateSummary(r: MigrateResult, dryRun: boolean, log: (l: string) => void = console.log) {
  const total = Object.values(r.rewrites).reduce((a, b) => a + b, 0);
  log(`\nMedia migration ${dryRun ? '(DRY RUN, nothing written) ' : ''}summary`);
  log(`  Blob files uploaded:   ${r.uploaded.length}`);
  log(`  Blob files reused:     ${r.reused.length}`);
  log(`  References rewritten:  ${total}`);
  for (const [k, v] of Object.entries(r.rewrites)) log(`    ${k}: ${v}`);
  if (r.unresolved.length) {
    log(`  NOT FOUND locally or in Blob (left unchanged): ${r.unresolved.length}`);
    r.unresolved.forEach((p) => log(`    ${p}`));
  }
}
