/**
 * Validation rules shared by the browser and the API (one module, two consumers):
 *  - server: imported as '../shared/validation.js' (compiled by tsc into dist/shared, bundled by Vercel via api/index.ts);
 *  - client: imported as '@shared/validation' (tsconfig "paths" + Vite alias to ../server/src/shared).
 * It must only import `zod` (resolved from the root node_modules by both builds) and must not use Node or DOM APIs.
 */
import { z } from 'zod';

/* ---------- Limits ---------- */
export const NAME_MAX = 50;
export const EMAIL_MAX = 254;
export const PHONE_MIN_DIGITS = 7;
export const PHONE_MAX_DIGITS = 15;
export const ORGANISATION_MAX = 120;
export const INTEREST_MAX = 120;
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;
export const MAX_LINKS = 2;

/* ---------- Bot protection (no third-party keys) ---------- */
/** Name of the hidden honeypot input. People never see it; bots that fill every field do. */
export const HONEYPOT_FIELD = 'website';
/** Submissions sent sooner than this after the form appeared are treated as automated. */
export const MIN_FILL_MS = 3000;
export const TOO_FAST_MESSAGE = 'That was quick! Please wait a moment and try again.';

/** True when the honeypot carries any non-whitespace value. */
export const honeypotFilled = (v: unknown): boolean => typeof v === 'string' && v.trim() !== '';

/** True unless `elapsedMs` (time from form load to submit, measured by the browser) is a number of at least MIN_FILL_MS. */
export function submittedTooFast(elapsedMs: unknown): boolean {
  const n = typeof elapsedMs === 'string' && elapsedMs.trim() !== '' ? Number(elapsedMs) : elapsedMs;
  return typeof n !== 'number' || !Number.isFinite(n) || n < MIN_FILL_MS;
}

/* ---------- Text helpers ---------- */
/** Longer input is not stripped or scanned for links (every field's own maximum rejects it anyway): keeps the regexes cheap. */
const SCAN_CAP = 10_000;

/** Removes HTML comments, <script>/<style> blocks (with their content) and every tag. "3 < 5" is left alone. */
export function stripHtml(s: string): string {
  return s
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, '')
    .replace(/<\/?[a-z][^>]*(?:>|$)/gi, '')
    .replace(/<!?[a-z][^>]*>/gi, '');
}

/** Top-level domains that count as a link even without a path ("example.com"); others need one ("example.xyz/page"). */
const COMMON_TLDS = new Set(
  (
    'com net org info biz io co me ai app dev xyz top site online shop store club live pro vip win link click page ' +
    'us uk ca au de fr es it nl pl ru ua cn jp kr in pk bd br mx ar gt sv hn ni cr pa co cl pe eu tk ml ga cf gq ly to cc tv ws gov edu'
  ).split(' '),
);
const EMAIL_IN_TEXT = /[^\s@<>()"',;]+@[^\s@<>()"',;]+\.[a-z]{2,}/gi;
const LINK_IN_TEXT = /\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+([a-z]{2,24})\b(\/[^\s<>"']*)?/gi;

/**
 * Counts links in free text: http(s)://…, www.…, and bare domains ("example.com", "example.com/path", "shop.example.xyz/x").
 * Email addresses are not links. "Node.js" or "e.g." are not counted (unknown TLD without a path / no TLD).
 */
export function countLinks(text: string): number {
  if (text.length > SCAN_CAP) return Infinity;
  let n = 0;
  for (const m of text.replace(EMAIL_IN_TEXT, ' ').matchAll(LINK_IN_TEXT)) {
    const [, tld, path] = m;
    if (tld === undefined || path !== undefined || COMMON_TLDS.has(tld.toLowerCase())) n += 1;
  }
  return n;
}

/** A string field whose HTML is stripped before it is trimmed and checked; missing values become "". */
const text = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess((v) => {
    if (v === undefined || v === null) return '';
    return typeof v === 'string' && v.length <= SCAN_CAP ? stripHtml(v) : v;
  }, inner);

/* ---------- Shared field rules ---------- */
const NAME_CHARS = /^[\p{L}\p{M}' ’-]+$/u;
const HAS_LETTER = /\p{L}/u;
const PHONE_CHARS = /^\+?[0-9 ]+$/;
const digitCount = (v: string) => v.replace(/\D/g, '').length;

const personName = (which: 'first' | 'last') =>
  text(
    z
      .string()
      .trim()
      .min(1, `Please enter your ${which} name`)
      .max(NAME_MAX, `Your ${which} name can be at most ${NAME_MAX} characters`)
      .refine((v) => !v || (NAME_CHARS.test(v) && HAS_LETTER.test(v)), 'Use letters, spaces, hyphens and apostrophes only'),
  );

/** Required email: real address format, at most 254 characters. */
export const emailField = (required = 'Please enter your email address') =>
  text(
    z
      .string()
      .trim()
      .min(1, required)
      .max(EMAIL_MAX, `The email address can be at most ${EMAIL_MAX} characters`)
      .email('Please enter a valid email address'),
  );

/** Optional phone: digits and spaces with one optional leading "+", 7–15 digits. "" when left empty. */
export const phoneField = () =>
  text(
    z
      .string()
      .trim()
      .max(PHONE_MAX_DIGITS * 2, 'Please enter a shorter phone number')
      .superRefine((v, ctx) => {
        if (!v) return;
        if (!PHONE_CHARS.test(v)) ctx.addIssue({ code: 'custom', message: 'Use digits and spaces only, with an optional + at the start' });
        else if (digitCount(v) < PHONE_MIN_DIGITS || digitCount(v) > PHONE_MAX_DIGITS)
          ctx.addIssue({ code: 'custom', message: `Phone numbers have ${PHONE_MIN_DIGITS} to ${PHONE_MAX_DIGITS} digits` });
      }),
  );

/* ---------- Contact / inquiry form ---------- */
/**
 * The inquiry form (Home + Contact Us). `interestOptions` is the list shown in the "Area of interest" dropdown
 * (CMS content); when it is empty no list is enforced beyond the length cap. Interest itself stays optional.
 */
export function leadSchema(interestOptions: readonly string[] = []) {
  const options = new Set(interestOptions.map((o) => o.trim()).filter(Boolean));
  return z.object({
    firstName: personName('first'),
    lastName: personName('last'),
    email: emailField(),
    phone: phoneField(),
    organisation: text(z.string().trim().max(ORGANISATION_MAX, `Please keep this under ${ORGANISATION_MAX} characters`)),
    interest: text(
      z
        .string()
        .trim()
        .max(INTEREST_MAX)
        .refine((v) => !v || options.size === 0 || options.has(v), 'Please choose an area from the list'),
    ),
    message: text(
      z
        .string()
        .trim()
        .min(1, 'Please tell us how we can help')
        .min(MESSAGE_MIN, `Please tell us a little more (at least ${MESSAGE_MIN} characters)`)
        .max(MESSAGE_MAX, `Please keep your message under ${MESSAGE_MAX} characters`)
        .refine((v) => v.length > MESSAGE_MAX || countLinks(v) <= MAX_LINKS, `Please include no more than ${MAX_LINKS} links`),
    ),
    consent: z.literal(true, { errorMap: () => ({ message: 'Please agree to continue' }) }),
  });
}

export type LeadInput = z.infer<ReturnType<typeof leadSchema>>;
export type LeadField = keyof LeadInput;
/** Form fields in visual order (focus moves to the first invalid one). */
export const LEAD_FIELDS: readonly LeadField[] = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'organisation',
  'interest',
  'message',
  'consent',
];

/** First + last name as stored in Lead.name. */
export const fullName = (v: Pick<LeadInput, 'firstName' | 'lastName'>) => `${v.firstName} ${v.lastName}`;
