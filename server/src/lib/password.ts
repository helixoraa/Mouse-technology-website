import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

/** bcrypt cost. Tests may lower it; production never goes below 10. */
const requested = Number(process.env.BCRYPT_ROUNDS ?? 12);
export const BCRYPT_ROUNDS = process.env.NODE_ENV === 'test' ? Math.max(4, requested || 4) : Math.max(10, requested || 12);
export const hashPassword = (pw: string) => bcrypt.hash(pw, BCRYPT_ROUNDS);
export const comparePassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGIT = '23456789';
const SYMBOL = '!@#$%^&*-_=+?';
const pick = (set: string) => set[crypto.randomInt(set.length)];

/** Strong random temporary password (20 chars, all four character classes, no ambiguous characters). */
export function generateTempPassword(length = 20): string {
  const all = UPPER + LOWER + DIGIT + SYMBOL;
  const chars = [pick(UPPER), pick(LOWER), pick(DIGIT), pick(SYMBOL)];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

const COMMON = [
  'password',
  'passw0rd',
  'qwerty',
  'letmein',
  'welcome',
  'administrator',
  'changeme',
  'iloveyou',
  'monkey',
  'dragon',
  'football',
  'baseball',
  'abc123',
  'maouaj',
  'trustno1',
  'sunshine',
  'princess',
  'starwars',
  'whatever',
  'freedom',
];

/** Returns a list of problems (empty = acceptable). */
export function passwordProblems(pw: string, ctx: { email?: string; name?: string } = {}): string[] {
  const p: string[] = [];
  if (pw.length < 12) p.push('Use at least 12 characters.');
  if (pw.length > 128) p.push('Use at most 128 characters.');
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (classes < 3) p.push('Mix at least 3 of: lowercase, uppercase, digits, symbols.');
  const lower = pw.toLowerCase();
  const local = (ctx.email ?? '').split('@')[0].toLowerCase();
  if (local.length >= 4 && lower.includes(local)) p.push('Do not include your email name.');
  for (const part of (ctx.name ?? '').toLowerCase().split(/\s+/)) {
    if (part.length >= 4 && lower.includes(part)) p.push('Do not include your name.');
  }
  if (COMMON.some((c) => lower.includes(c))) p.push('Avoid common words and passwords.');
  if (/(.)\1{3,}/.test(pw)) p.push('Avoid long runs of the same character.');
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwer|asdf|zxcv)/i.test(pw)) p.push('Avoid simple sequences.');
  return [...new Set(p)];
}
