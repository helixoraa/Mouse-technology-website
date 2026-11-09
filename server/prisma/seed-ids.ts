/**
 * Seed services and posts are identified by a fixed id (see seed-data/collections.ts), never by slug, so renaming a
 * slug (in the admin or in the seed) can't make the seed create a second copy.
 *
 * Rows created before the ids existed carry a random cuid. adoptSeedIds() finds each one by its current or a former
 * slug and re-keys it to the fixed id (Service and Post have no foreign keys pointing at them). The seed runs it
 * before upserting; `npm run content:fix -- --step=seed-ids` runs it on its own.
 */
import type { PrismaClient } from '@prisma/client';
import { formerSlugs, posts, services } from './seed-data/collections.js';

interface Row {
  id: string;
  slug: string;
}
interface Ops {
  byId: (id: string) => Promise<Row | null>;
  bySlugs: (slugs: string[]) => Promise<Row[]>;
  rekey: (from: string, to: string) => Promise<unknown>;
}

const select = { id: true, slug: true } as const;
const models = (prisma: PrismaClient): [string, { id: string; slug: string }[], Ops][] => [
  [
    'Service',
    services,
    {
      byId: (id) => prisma.service.findUnique({ where: { id }, select }),
      bySlugs: (slugs) => prisma.service.findMany({ where: { slug: { in: slugs } }, select }),
      rekey: (from, to) => prisma.service.update({ where: { id: from }, data: { id: to } }),
    },
  ],
  [
    'Post',
    posts,
    {
      byId: (id) => prisma.post.findUnique({ where: { id }, select }),
      bySlugs: (slugs) => prisma.post.findMany({ where: { slug: { in: slugs } }, select }),
      rekey: (from, to) => prisma.post.update({ where: { id: from }, data: { id: to } }),
    },
  ],
];

/** Re-keys pre-existing seed rows to their fixed ids. Returns how many rows were (or, with apply=false, would be) re-keyed. */
export async function adoptSeedIds(
  prisma: PrismaClient,
  { apply = true, log = () => {} }: { apply?: boolean; log?: (line: string) => void } = {},
): Promise<number> {
  const seedIds = new Set([...services, ...posts].map((r) => r.id));
  let n = 0;
  for (const [model, records, ops] of models(prisma)) {
    for (const r of records) {
      if (await ops.byId(r.id)) continue;
      const slugs = [r.slug, ...(formerSlugs[r.id] ?? [])];
      const found = (await ops.bySlugs(slugs)).filter((row) => !seedIds.has(row.id));
      if (!found.length) continue;
      // Prefer the row on the current slug; a leftover on a former slug would be an earlier duplicate.
      const row = found.find((x) => x.slug === r.slug) ?? found[0];
      if (found.length > 1) log(`  ${model} ${r.id}: several rows match ${slugs.join(' / ')}; re-keying "${row.slug}" only`);
      log(`  ${model} "${row.slug}": id ${row.id} -> ${r.id}`);
      if (apply) await ops.rekey(row.id, r.id);
      n++;
    }
  }
  return n;
}
