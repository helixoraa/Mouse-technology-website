/**
 * Spelling guard (Round 6). The business is "Hossain and Moallema"; domains and emails are always lower case.
 * Fails if a wrong spelling or a capitalised domain appears in any tracked file (code, seed, docs), in a file name,
 * in the seed's data, or in the built HTML (client/dist, checked when a build exists), and runs cspell with the
 * project dictionary (cspell.json).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as collections from '../prisma/seed-data/collections.js';
import about from '../prisma/seed-data/about.js';
import blog from '../prisma/seed-data/blog.js';
import contact from '../prisma/seed-data/contact.js';
import home from '../prisma/seed-data/home.js';
import privacy from '../prisma/seed-data/privacy.js';
import products from '../prisma/seed-data/products.js';
import projects from '../prisma/seed-data/projects.js';
import team from '../prisma/seed-data/team.js';
import terms from '../prisma/seed-data/terms.js';
import vision from '../prisma/seed-data/vision.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Wrong spellings that must never appear (any case). */
export const WRONG_SPELLING = /hussain|muallima|muallema|moallima|hosain/i;
/** Our domains: any occurrence must be all lower case. */
const OUR_DOMAINS = /hossainandmoallema\.com|maouajtechnology\.com|maouaj-technology-website\.vercel\.app/gi;
/** Any other capitalised .com domain ("SomeName.com"). */
const CAPITALISED_DOMAIN = /\b[A-Za-z0-9-]*[A-Z][A-Za-z0-9-]*\.com\b/g;

/** Problems in one piece of text: wrong spellings and capitalised domains. */
export function spellingProblems(text: string): string[] {
  const found: string[] = [];
  const wrong = text.match(new RegExp(WRONG_SPELLING.source, 'gi'));
  if (wrong) found.push(...wrong.map((w) => `wrong spelling "${w}"`));
  for (const m of text.matchAll(OUR_DOMAINS)) if (m[0] !== m[0].toLowerCase()) found.push(`capitalised domain "${m[0]}"`);
  for (const m of text.matchAll(CAPITALISED_DOMAIN)) found.push(`capitalised domain "${m[0]}"`);
  return [...new Set(found)];
}

/**
 * Deliberate occurrences of an old spelling, by file: the correction script's match patterns, the pre-Round-1 slug
 * that lets the seed recognise (and fix) an old row, the tests for that, and this guard itself.
 */
const ALLOWED: Record<string, RegExp> = {
  'server/scripts/content-fixes.ts': /.*/,
  'server/prisma/seed-data/collections.ts': /^hussainandmuallima$/i,
  'server/tests/seed-safety.test.ts': /^hussainandmuallima$/i,
  'server/tests/spelling.test.ts': /.*/,
  // cspell's flagWords: the list of spellings it must reject.
  'cspell.json': /.*/,
  // Email normalisation test: a mixed-case address must be stored lower case.
  'server/tests/auth.test.ts': /^Example\.com$/,
};
/**
 * Old image files kept on purpose until the production database no longer points at them (the client will confirm;
 * they are then deleted). Nothing in the code or seed references them.
 */
const KEPT_OLD_FILES = new Set(['server/seed-media/project-hussain.webp', 'server/seed-media/project-hussain.png']);

const TEXT_FILE =
  /\.(?:ts|tsx|js|mjs|cjs|json|md|html|css|sql|ya?ml|toml|txt|xml|svg|conf|sh|example|prisma)$|(?:^|\/)(?:Dockerfile|\.[\w.-]*ignore)$/;

const trackedFiles = () =>
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter((f) => f && fs.existsSync(path.join(root, f)));

describe('spelling guard', () => {
  it('flags the wrong spellings and capitalised domains (self-test)', () => {
    expect(spellingProblems('Visit HussainandMuallima.com')).not.toEqual([]);
    expect(spellingProblems('Visit HossainandMoallema.com')).toEqual(['capitalised domain "HossainandMoallema.com"']);
    expect(spellingProblems('Mail Info@MaouajTechnology.com')).not.toEqual([]);
    for (const w of ['Hussain', 'Muallima', 'Muallema', 'Moallima', 'Hosain']) expect(spellingProblems(`${w} and Co`)).not.toEqual([]);
    expect(spellingProblems('Hossain and Moallema, hossainandmoallema.com, info@maouajtechnology.com')).toEqual([]);
    expect(spellingProblems('https://maouaj-technology-website.vercel.app/')).toEqual([]);
  });

  it('no tracked file (code, seed, docs) or file name has a wrong spelling or a capitalised domain', () => {
    const problems: string[] = [];
    for (const file of trackedFiles()) {
      if (WRONG_SPELLING.test(file) && !KEPT_OLD_FILES.has(file)) problems.push(`${file}: file name`);
      if (!TEXT_FILE.test(file) || file === 'package-lock.json') continue;
      const allowed = ALLOWED[file];
      fs.readFileSync(path.join(root, file), 'utf8')
        .split('\n')
        .forEach((line, i) => {
          const words = line.match(/[A-Za-z0-9-]+(?:\.[A-Za-z]+)*/g) ?? [];
          for (const p of spellingProblems(line)) {
            const word = p.match(/"(.+)"/)![1];
            const whole = words.find((w) => w.toLowerCase().includes(word.toLowerCase())) ?? word;
            if (allowed && (allowed.test(word) || allowed.test(whole.replace(/-com$/, '')))) continue;
            problems.push(`${file}:${i + 1}: ${p}`);
          }
        });
    }
    expect(problems).toEqual([]);
  });

  it('no seed text has a wrong spelling or a capitalised domain', () => {
    const seed = {
      ...collections,
      formerSlugs: undefined,
      pages: [about, blog, contact, home, privacy, products, projects, team, terms, vision],
    };
    const problems: string[] = [];
    const walk = (v: unknown, at: string) => {
      if (typeof v === 'string') problems.push(...spellingProblems(v).map((p) => `${at}: ${p}`));
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`));
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${at}.${k}`);
    };
    walk(seed, 'seed');
    expect(problems).toEqual([]);
  });

  const dist = path.join(root, 'client/dist');
  it.skipIf(!fs.existsSync(dist))('the built HTML has no wrong spelling or capitalised domain', () => {
    const problems: string[] = [];
    const scan = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) scan(p);
        else if (e.name.endsWith('.html'))
          problems.push(...spellingProblems(fs.readFileSync(p, 'utf8')).map((x) => `${path.relative(root, p)}: ${x}`));
      }
    };
    scan(dist);
    expect(problems).toEqual([]);
  });

  it('cspell (project dictionary in cspell.json) finds no unknown or flagged words', () => {
    const bin = path.join(root, 'node_modules/.bin/cspell');
    const r = spawnSync(bin, ['--no-progress', '--no-summary', '--config', path.join(root, 'cspell.json')], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(`${r.stdout}${r.stderr}`.trim()).toBe('');
    expect(r.status).toBe(0);
  }, 120_000);
});
