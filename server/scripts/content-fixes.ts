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
 * --step=r3-contact (Round 3)
 *  - site settings: email -> info@maouajtechnology.com; footer.offices -> the two MAOUAJ offices (Grupo Maouaj S.A.,
 *    Guatemala; Maouaj Technology Corporation, USA: name, address, phone); phone/address (legacy single fields) ->
 *    the Guatemala office. Other footer keys are kept. Remaining "[Business …]"/"[Address …]" text is listed only.
 * --step=r3-card (Round 3)
 *  - HossainandMoallema.com card (found by fixed id, current or pre-Round-1 slug): new description, image
 *    seed/project-hossain-moallema-warehouse.webp + extra.image2x (the -2x file), link https://hossainandmoallema.com/.
 *    Images are uploaded to Blob (STORAGE_DRIVER=blob) or copied into UPLOAD_DIR/seed, only with --apply.
 *    The status label ("Existing business") is kept. Old image files are left in place.
 * --step=r3-wording (Round 3)
 *  - page sections: HossainandMoallema.com is a wholesale spice and agricultural export business, not "online retail"
 *    or an "e-commerce business" (exact phrase replacements below). The planned "E-commerce Platform" product and the
 *    card summary (--step=r3-card) are not touched, nor is the Our Team page (out of scope for Round 3, reported only).
 *    Any other remaining match is listed, not changed.
 * --step=r5-wording (Round 5; run after the steps above)
 *  - Our Team page: the r3-wording replacements (HossainandMoallema.com is a wholesale export business), "Meet  people"
 *    -> "Meet the people".
 *  - Home: E-commerce portfolio text ("A  service" -> "A future service"); the inquiry form no longer lists the Textile
 *    business or HossainandMoallema.com as topics (other businesses appear only on their own cards).
 *  - Home and Contact forms: phone placeholder "+92 …" -> "Your phone number"; Contact label spacing and the
 *    organisation placeholder (was an email address).
 *  - Products: payment animation alt text without cities or currencies (the animation itself was changed in code).
 *  - E-commerce Platform card: "separate from our existing retail business" -> "separate from our existing businesses".
 *  - Status labels set to the content brief wherever a product or business title has one (none differ today).
 *    Only exact old values are replaced. FAQs, site settings, team members and blog posts are checked against the
 *    brief and listed only; the legal pages are skipped.
 * --step=r5-seo (Round 5)
 *  - SEO titles over 60 characters (home page, site default) -> "MAOUAJ Technology | For the way people move, pay and
 *    trade" (the seed's home title). Other pages' titles and descriptions are only checked.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/db.js';
import { adoptSeedIds } from '../prisma/seed-ids.js';
import { BUSINESS_SUMMARY, OFFICES } from '../prisma/seed-data/collections.js';
import homeSeed from '../prisma/seed-data/home.js';

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
const seedMediaDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../seed-media');

/** URL a server/seed-media file is served from, uploading (Blob) or copying (local) it when --apply is set and it is missing. */
async function newImageUrl(name = NEW_IMAGE): Promise<string> {
  const seedMediaFile = path.join(seedMediaDir, name);
  if (!fs.existsSync(seedMediaFile)) throw new Error(`Missing ${seedMediaFile}`);
  const key = `seed/${name}`;
  if (process.env.STORAGE_DRIVER !== 'blob') {
    const dest = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads', key);
    if (!fs.existsSync(dest)) {
      console.log(`  ${apply ? 'copied' : 'would copy'} ${name} -> ${dest}`);
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

const CARD_IMAGE = 'project-hossain-moallema-warehouse.webp';
const CARD_IMAGE_2X = 'project-hossain-moallema-warehouse-2x.webp';

/** The HossainandMoallema.com business card, under its fixed seed id, current slug, or pre-Round-1 slug/title. */
async function findBusinessCard() {
  const all = await prisma.service.findMany();
  return (
    all.find((s) => s.id === 'seed-service-hossainandmoallema') ??
    all.find((s) => s.slug === 'hossainandmoallema-com' || s.slug === 'hussainandmuallima-com') ??
    all.find((s) => s.category === 'business' && (HAS_OLD_NAME.test(s.title) || /hossain\s*(?:and|&)?\s*moallema/i.test(s.title)))
  );
}

async function businessCard() {
  const card = await findBusinessCard();
  if (!card) {
    console.log('  HossainandMoallema.com card not found.');
    return 0;
  }
  const data: Prisma.ServiceUpdateInput = {};
  if (card.summary !== BUSINESS_SUMMARY) {
    console.log(`  Service ${card.slug}.summary: ${JSON.stringify(card.summary)} -> ${JSON.stringify(BUSINESS_SUMMARY)}`);
    data.summary = BUSINESS_SUMMARY;
  }
  const url = await newImageUrl(CARD_IMAGE);
  const url2x = await newImageUrl(CARD_IMAGE_2X);
  if (card.image !== url) {
    console.log(`  Service ${card.slug}.image: ${JSON.stringify(card.image)} -> ${JSON.stringify(url)}`);
    data.image = url;
  }
  const extra = (card.extra && typeof card.extra === 'object' && !Array.isArray(card.extra) ? card.extra : {}) as Record<string, unknown>;
  if (extra.image2x !== url2x) {
    console.log(`  Service ${card.slug}.extra.image2x: ${JSON.stringify(extra.image2x ?? null)} -> ${JSON.stringify(url2x)}`);
    data.extra = { ...extra, image2x: url2x } as Prisma.InputJsonValue;
  }
  if (card.status !== 'Existing business') console.log(`  note: status label is ${JSON.stringify(card.status)} (left unchanged)`);
  if (card.ctaHref !== BUSINESS_URL) {
    console.log(`  Service ${card.slug}.ctaHref: ${JSON.stringify(card.ctaHref)} -> ${JSON.stringify(BUSINESS_URL)}`);
    data.ctaHref = BUSINESS_URL;
  }
  if (HAS_OLD_NAME.test(`${card.slug} ${card.title}`))
    console.log(`  note: title/slug still use the old spelling (${card.title}); --step=names fixes them`);
  if (!Object.keys(data).length) return 0;
  if (apply) await prisma.service.update({ where: { id: card.id }, data });
  return 1;
}

const BUSINESS_NAME = String.raw`H(?:o|u)ssain\s*(?:and|&)?\s*M(?:oallema|uallima)\.com`;
const WORDING: [RegExp, string][] = [
  [
    new RegExp(String.raw`textiles and online retail, including ${BUSINESS_NAME}`, 'gi'),
    'textiles and HossainandMoallema.com, a wholesale spice and agricultural export business',
  ],
  [/alongside business interests in textiles and online retail/gi, 'alongside business interests in textiles and wholesale spice export'],
  [
    /An existing e-commerce business and part of our online retail interests\./g,
    'An existing wholesale spice and agricultural export business.',
  ],
  [/Future e-commerce and an existing online retail business\./g, 'Future e-commerce and an existing wholesale spice export business.'],
  [/Our existing online retail business and what it offers customers\./g, 'Our existing wholesale spice and agricultural export business.'],
];
/** The Our Team page belongs to another round of changes; its matches are reported only. */
const OUT_OF_SCOPE_PAGES = ['team'];
const RETAIL_WORDING = /online\s+retail|e-?commerce\s+business|existing\s+e-?commerce/i;

async function businessWording() {
  const fix = (v: string) => WORDING.reduce((acc, [re, to]) => acc.replace(re, to), v);
  let rows = 0;
  for (const sec of await prisma.pageSection.findMany({ orderBy: [{ page: 'asc' }, { order: 'asc' }] })) {
    if (OUT_OF_SCOPE_PAGES.includes(sec.page)) {
      mapStrings(sec.content, (v) => {
        if (RETAIL_WORDING.test(v))
          console.log(`  note: skipped (team page is out of scope for Round 3) ${sec.page}/${sec.key}: ${JSON.stringify(v)}`);
        return v;
      });
      continue;
    }
    const changes: string[] = [];
    const r = mapStrings(sec.content, (v) => {
      const next = fix(v);
      if (next !== v) changes.push(`    ${JSON.stringify(v)}\n      -> ${JSON.stringify(next)}`);
      return next;
    });
    mapStrings(r.value, (v) => {
      if (RETAIL_WORDING.test(v)) console.log(`  note: left unchanged in PageSection ${sec.page}/${sec.key}: ${JSON.stringify(v)}`);
      return v;
    });
    if (!r.changed) continue;
    rows++;
    console.log(`  PageSection ${sec.page}/${sec.key}${sec.visible ? '' : ' (hidden)'}:\n${changes.join('\n')}`);
    if (apply) await prisma.pageSection.update({ where: { id: sec.id }, data: { content: r.value as Prisma.InputJsonValue } });
  }
  return rows;
}

/** Like mapStrings, but `fn` also gets the dotted path of each string ("form.fields.phone.placeholder"). */
function mapStringsAt(value: unknown, fn: (s: string, path: string) => string, path = ''): { value: unknown; changed: number } {
  if (typeof value === 'string') {
    const next = fn(value, path);
    return { value: next, changed: next === value ? 0 : 1 };
  }
  const at = (k: string | number) => (path ? `${path}.${k}` : String(k));
  if (Array.isArray(value)) {
    let changed = 0;
    const out = value.map((v, i) => {
      const r = mapStringsAt(v, fn, at(i));
      changed += r.changed;
      return r.value;
    });
    return { value: out, changed };
  }
  if (value && typeof value === 'object') {
    let changed = 0;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const r = mapStringsAt(v, fn, at(k));
      changed += r.changed;
      out[k] = r.value;
    }
    return { value: out, changed };
  }
  return { value, changed: 0 };
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Round 5 text fixes: only an exact old value at the given page/path is replaced, so admin edits are never overwritten. */
const R5_TEXT: { pages: string[]; path: RegExp; from: RegExp; to: string; why: string }[] = [
  // Team page: the Round 3 wording (R3-3), which skipped this page.
  ...WORDING.map(([from, to]) => ({ pages: ['team'], path: /./, from, to, why: 'wholesale export, not online retail' })),
  { pages: ['team'], path: /^title\.0\.text$/, from: /^Meet\s{2,}$/, to: 'Meet the ', why: 'missing word' },
  {
    pages: ['home'],
    path: /^items\.\d+\.text$/,
    from: /^A\s{2,}service connecting customers with products and sellers\.$/,
    to: 'A future service connecting customers with products and sellers.',
    why: 'missing word; the E-commerce Platform is planned',
  },
  // Placeholder pointed at one country (+92); MAOUAJ's offices are in Guatemala and the USA.
  {
    pages: ['home', 'contact'],
    path: /fields\.phone\.placeholder$/,
    from: /^\+92\s*(?:…|\.\.\.)$/,
    to: 'Your phone number',
    why: 'country-specific placeholder',
  },
  { pages: ['contact'], path: /fields\.phone\.label$/, from: /^Phone\(Optional\)$/, to: 'Phone (optional)', why: 'spacing' },
  {
    pages: ['contact'],
    path: /fields\.organisation\.label$/,
    from: /^Organization\(Optional\)$/,
    to: 'Organization (optional)',
    why: 'spacing',
  },
  {
    pages: ['contact'],
    path: /fields\.organisation\.placeholder$/,
    from: /^xyz@example\.com$/,
    to: 'Company or organization',
    why: 'an email address as the organisation placeholder',
  },
  {
    pages: ['products'],
    path: /animation\.alt$/,
    from: /^Globe showing live transfers, including \$2,300\.00 to New York and R12,800 to Johannesburg, both delivered$/,
    to: 'Animation: money transfers delivered on a dotted globe, each shown with its amount and a delivered status',
    why: 'named cities and currencies for the payment platform (the animation no longer shows them)',
  },
];
/** Home inquiry form: other businesses only appear on their own cards, not as MAOUAJ inquiry topics. */
const NOT_A_MAOUAJ_TOPIC = new RegExp(String.raw`^(?:textile business|${BUSINESS_NAME})$`, 'i');
const R5_SERVICE_TEXT: [RegExp, string][] = [
  [/ This is separate from our existing retail business\./g, ' This is separate from our existing businesses.'],
];

/** Content brief (29 Oct 2026): the status label each product or business must show. */
const BRIEF_STATUS: [RegExp, string][] = [
  [/cashless bus fare/i, 'In development'],
  [/payment\s*(?:\/|&|and)?\s*money[- ]transfer/i, 'In development'],
  [/ride[- ]hailing/i, 'Planned'],
  [/e-?commerce platform/i, 'Planned'],
  [/^textile/i, 'Existing business'],
  [new RegExp(BUSINESS_NAME, 'i'), 'Existing business'],
];
const briefStatus = (title: unknown) => (typeof title === 'string' ? BRIEF_STATUS.find(([re]) => re.test(title))?.[1] : undefined);

/** Sets `status` on every {title, status} object whose title the brief covers. Returns the corrected labels. */
function fixStatuses(value: unknown, log: string[]): unknown {
  if (Array.isArray(value)) return value.map((v) => fixStatuses(v, log));
  if (!isObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) out[k] = fixStatuses(v, log);
  const want = briefStatus(out.title);
  if (want && typeof out.status === 'string' && out.status !== want) {
    log.push(`status of ${JSON.stringify(out.title)}: ${JSON.stringify(out.status)} -> ${JSON.stringify(want)}`);
    out.status = want;
  }
  return out;
}

/** Report-only checks against the content brief. Blog posts and the legal pages are listed but never changed here. */
const BRIEF_CHECKS: [string, RegExp][] = [
  ['old business-name spelling', /hussain|muallima/i],
  ['"online retail" wording', /online\s+retail|e-?commerce\s+business|existing\s+(?:online\s+)?retail/i],
  [
    'bank-card claim (bus platform uses supported transit cards only)',
    /bank\s*cards?|debit|credit\s*cards?|\bvisa\b|mastercard|any\s+card|all\s+cards/i,
  ],
  [
    'market, currency or payment method named (the brief rules these out for the payment platform)',
    /\b(?:USD|EUR|GBP|PKR|GTQ|MXN|COP|AED|CLP|KSh|countries)\b|[$€£₦¥₱]\s?\d|\bR\$?\d|new york|johannesburg|lagos|são paulo|bogotá|toronto|mobile money|bank transfer|wallet/i,
  ],
  ['placeholder text', /\[(?:add|business|address)[^\]]*\]/i],
];
const LEGAL_PAGES = ['terms', 'privacy'];

function briefNotes(where: string, value: unknown, skip: (path: string) => boolean = () => false) {
  mapStringsAt(value, (v, p) => {
    if (skip(p)) return v;
    for (const [label, re] of BRIEF_CHECKS)
      if (re.test(v)) console.log(`  note (${label}): ${where}${p ? ` ${p}` : ''}: ${JSON.stringify(v)}`);
    return v;
  });
}

async function r5Wording() {
  let rows = 0;
  for (const sec of await prisma.pageSection.findMany({ orderBy: [{ page: 'asc' }, { order: 'asc' }] })) {
    if (LEGAL_PAGES.includes(sec.page)) continue;
    const changes: string[] = [];
    const r = mapStringsAt(sec.content, (v, p) => {
      let next = v;
      for (const rule of R5_TEXT)
        if (rule.pages.includes(sec.page) && rule.path.test(p) && rule.from.test(next)) next = next.replace(rule.from, rule.to);
      if (next !== v) changes.push(`    ${p}: ${JSON.stringify(v)}\n      -> ${JSON.stringify(next)}`);
      return next;
    });
    let content = r.value;
    // Home inquiry form topics.
    if (sec.page === 'home' && isObject(content) && isObject(content.form) && isObject(content.form.fields)) {
      const interest = content.form.fields.interest;
      if (isObject(interest) && Array.isArray(interest.options)) {
        const options = interest.options.filter((o) => !(typeof o === 'string' && NOT_A_MAOUAJ_TOPIC.test(o.trim())));
        if (options.length !== interest.options.length) {
          changes.push(`    form.fields.interest.options: ${JSON.stringify(interest.options)}\n      -> ${JSON.stringify(options)}`);
          content = { ...content, form: { ...content.form, fields: { ...content.form.fields, interest: { ...interest, options } } } };
        }
      }
    }
    const statusLog: string[] = [];
    content = fixStatuses(content, statusLog);
    changes.push(...statusLog.map((s) => `    ${s}`));
    briefNotes(`PageSection ${sec.page}/${sec.key}${sec.visible ? '' : ' (hidden)'}`, content);
    if (!changes.length) continue;
    rows++;
    console.log(`  PageSection ${sec.page}/${sec.key}${sec.visible ? '' : ' (hidden)'}:\n${changes.join('\n')}`);
    if (apply) await prisma.pageSection.update({ where: { id: sec.id }, data: { content: content as Prisma.InputJsonValue } });
  }
  for (const s of await prisma.service.findMany({ orderBy: { order: 'asc' } })) {
    const data: Prisma.ServiceUpdateInput = {};
    const summary = R5_SERVICE_TEXT.reduce((acc, [re, to]) => acc.replace(re, to), s.summary);
    if (summary !== s.summary) data.summary = summary;
    const want = briefStatus(s.title);
    if (want && s.status !== want) data.status = want;
    briefNotes(`Service ${s.slug}${s.visible ? '' : ' (hidden)'}`, {
      title: s.title,
      summary,
      description: s.description,
      ctaLabel: s.ctaLabel,
    });
    if (!Object.keys(data).length) continue;
    rows++;
    for (const [k, v] of Object.entries(data))
      console.log(`  Service ${s.slug}.${k}: ${JSON.stringify(s[k as keyof typeof s])} -> ${JSON.stringify(v)}`);
    if (apply) await prisma.service.update({ where: { id: s.id }, data });
  }
  // Report only: FAQs, site settings, team members and blog posts.
  for (const f of await prisma.faq.findMany()) briefNotes(`Faq ${JSON.stringify(f.question)}`, { question: f.question, answer: f.answer });
  const site = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (site)
    briefNotes('SiteSettings', { tagline: site.tagline, nav: site.nav, footer: site.footer, seo: site.seo }, (p) =>
      p.startsWith('footer.offices'),
    );
  for (const t of await prisma.teamMember.findMany()) briefNotes(`TeamMember ${t.id}`, { name: t.name, role: t.role, bio: t.bio });
  for (const p of await prisma.post.findMany())
    briefNotes(`Post ${p.slug} (blog posts are not changed here)`, { title: p.title, excerpt: p.excerpt, body: p.body });
  return rows;
}

/** 58 characters; the same title as the seed (seed-data/home.ts) and the build default (client/src/lib/seo-defaults.ts). */
const R5_HOME_TITLE = homeSeed.seo.title;
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

async function r5Seo() {
  if (R5_HOME_TITLE.length > TITLE_MAX) throw new Error(`Home title is ${R5_HOME_TITLE.length} characters`);
  const s = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error('Site settings row (id 1) not found');
  const seo = (isObject(s.seo) ? s.seo : {}) as { default?: Record<string, unknown>; pages?: Record<string, Record<string, unknown>> };
  const next = { ...seo, default: { ...(seo.default ?? {}) }, pages: { ...(seo.pages ?? {}) } };
  let changed = false;
  const shorten = (where: string, obj: Record<string, unknown>) => {
    const title = obj.title;
    if (typeof title !== 'string' || title.length <= TITLE_MAX) return;
    console.log(
      `  SiteSettings.seo.${where}.title (${title.length} chars): ${JSON.stringify(title)}\n    -> ${JSON.stringify(R5_HOME_TITLE)} (${R5_HOME_TITLE.length} chars)`,
    );
    obj.title = R5_HOME_TITLE;
    changed = true;
  };
  if (next.pages.home) {
    next.pages.home = { ...next.pages.home };
    shorten('pages.home', next.pages.home);
  }
  // The default applies to any page without its own title (the home page included).
  shorten('default', next.default);
  for (const [page, v] of Object.entries(next.pages)) {
    const merged = { ...next.default, ...v };
    if (typeof merged.title === 'string' && merged.title.length > TITLE_MAX)
      console.log(`  note: ${page} title is ${merged.title.length} characters: ${JSON.stringify(merged.title)}`);
    if (typeof merged.description === 'string' && merged.description.length > DESCRIPTION_MAX)
      console.log(`  note: ${page} description is ${merged.description.length} characters`);
  }
  if (!changed) return 0;
  if (apply) await prisma.siteSettings.update({ where: { id: 1 }, data: { seo: next as Prisma.InputJsonValue } });
  return 1;
}

/** JSON equality that ignores object key order (Postgres jsonb stores keys in its own order). */
const sortKeys = (_k: string, v: unknown) => (isObject(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1))) : v);
const sameJson = (a: unknown, b: unknown) => JSON.stringify(a, sortKeys) === JSON.stringify(b, sortKeys);

const CONTACT_EMAIL = 'info@maouajtechnology.com';
const PLACEHOLDER = /\[(?:business|address)[^\]]*\]/i;

async function contactDetails() {
  const s = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error('Site settings row (id 1) not found');
  const footer = (s.footer && typeof s.footer === 'object' && !Array.isArray(s.footer) ? s.footer : {}) as Record<string, unknown>;
  const want = { email: CONTACT_EMAIL, phone: OFFICES[0].phone, address: OFFICES[0].address };
  const data: Prisma.SiteSettingsUpdateInput = {};
  for (const k of ['email', 'phone', 'address'] as const) {
    if (s[k] === want[k]) continue;
    const note = s[k] && !PLACEHOLDER.test(s[k]) ? '  (replaces a non-placeholder value)' : '';
    console.log(`  SiteSettings.${k}: ${JSON.stringify(s[k])} -> ${JSON.stringify(want[k])}${note}`);
    data[k] = want[k];
  }
  if (!sameJson(footer.offices ?? null, OFFICES)) {
    console.log(`  SiteSettings.footer.offices: ${JSON.stringify(footer.offices ?? null)} -> ${JSON.stringify(OFFICES)}`);
    data.footer = { ...footer, offices: OFFICES } as Prisma.InputJsonValue;
  }
  for (const sec of await prisma.pageSection.findMany()) {
    const found: string[] = [];
    mapStrings(sec.content, (v) => (PLACEHOLDER.test(v) && found.push(v), v));
    for (const v of found) console.log(`  note: placeholder left in PageSection ${sec.page}/${sec.key}: ${JSON.stringify(v)}`);
  }
  if (!Object.keys(data).length) return 0;
  if (apply) await prisma.siteSettings.update({ where: { id: 1 }, data });
  return 1;
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
  'r3-card': async () => {
    console.log('HossainandMoallema.com card (description, image):');
    report(await businessCard(), 'row(s)');
  },
  'r3-wording': async () => {
    console.log('HossainandMoallema.com wording (wholesale export, not online retail):');
    report(await businessWording(), 'section(s)');
  },
  'r3-contact': async () => {
    console.log('Contact details (email, MAOUAJ offices):');
    report(await contactDetails(), 'row(s)');
  },
  'r5-wording': async () => {
    console.log('Round 5 wording and content-brief check (team page, home form, contact form, payment animation, status labels):');
    report(await r5Wording(), 'row(s)');
  },
  'r5-seo': async () => {
    console.log(`SEO titles (${TITLE_MAX} characters or less):`);
    report(await r5Seo(), 'row(s)');
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
