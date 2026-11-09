/**
 * One-off content corrections for data that already lives in the database (the seed only creates missing rows,
 * so editing seed files never changes an existing site). Safe to run more than once.
 *
 *   npm run content:fix -w server                 dry run against DATABASE_URL (prints what would change)
 *   npm run content:fix -w server -- --apply      write the changes
 *   npm run prod:content:fix -w server [-- --apply]   same, against production (.env.production.local)
 *
 * Fixes:
 *  - business name "HussainandMuallima.com" (any spacing/case variant) -> "HossainandMoallema.com" in every page
 *    section and service, and the business card's link -> https://hossainandmoallema.com/
 */
import 'dotenv/config';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/db.js';

const apply = process.argv.includes('--apply');

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

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  console.log(apply ? 'Applying content fixes…' : 'Dry run (nothing is written; pass --apply to write):');
  console.log('Business name / link:');
  const n = await businessName();
  console.log(n ? `${n} row(s) ${apply ? 'updated' : 'would change'}.` : 'Nothing to change.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
