import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app, prisma, resetDb } from './helpers.js';
import { countLinks, leadSchema, stripHtml } from '../src/shared/validation.js';

const HOME_OPTIONS = ['Cashless Bus Fare Platform', 'Partnership', 'Other'];
const CONTACT_OPTIONS = ['Product questions', 'Business inquiries'];

beforeEach(async () => {
  await resetDb();
  await prisma.$executeRawUnsafe('TRUNCATE "Lead","PageSection" RESTART IDENTITY CASCADE');
  await prisma.pageSection.createMany({
    data: [
      { page: 'home', key: 'contact', order: 0, content: { form: { fields: { interest: { options: HOME_OPTIONS } } } } },
      { page: 'contact', key: 'form', order: 0, content: { fields: { interest: { options: CONTACT_OPTIONS } } } },
    ],
  });
});

const valid = () => ({
  firstName: 'José',
  lastName: "Ñúñez O'Brien-Smith",
  email: 'jose@example.com',
  phone: '+502 5185 0811',
  organisation: 'Acme Ltd',
  interest: 'Partnership',
  message: 'Hello, we would like to talk about a partnership.',
  consent: true,
  elapsedMs: 5000,
  website: '',
});

// Every request gets its own client IP (the app trusts one proxy hop) so the 5/hour limiter only bites where a test wants it.
let ipSeq = 0;
const post = (body: Record<string, unknown>, ip = `10.1.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`) =>
  request(app).post('/api/leads').set('X-Forwarded-For', ip).send(body);

const expectFieldError = async (patch: Record<string, unknown>, field: string) => {
  const res = await post({ ...valid(), ...patch });
  expect(res.status, `${field} ${JSON.stringify(patch)}`).toBe(400);
  expect(res.body.details?.fieldErrors?.[field]?.length, `${field} ${JSON.stringify(res.body)}`).toBeGreaterThan(0);
};

describe('POST /api/leads', () => {
  it('stores a valid inquiry with name "First Last" and trimmed fields', async () => {
    const res = await post({ ...valid(), firstName: '  José ', lastName: ' Ñúñez ', email: ' jose@example.com ' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
    const leads = await prisma.lead.findMany();
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      name: 'José Ñúñez',
      email: 'jose@example.com',
      phone: '+502 5185 0811',
      organisation: 'Acme Ltd',
      interest: 'Partnership',
      consent: true,
    });
  });

  it('accepts interests from either page and leaves optional fields empty as null', async () => {
    const res = await post({ ...valid(), interest: 'Business inquiries', phone: '', organisation: '' });
    expect(res.status).toBe(201);
    const noInterest = await post({ ...valid(), interest: '' });
    expect(noInterest.status).toBe(201);
    const rows = await prisma.lead.findMany({ orderBy: { createdAt: 'asc' } });
    expect(rows.map((r) => r.interest)).toEqual(['Business inquiries', null]);
    expect(rows[0]).toMatchObject({ phone: null, organisation: null });
  });

  it('rejects each invalid field with 400 and a field error, storing nothing', async () => {
    await expectFieldError({ firstName: '' }, 'firstName');
    await expectFieldError({ firstName: '   ' }, 'firstName');
    await expectFieldError({ firstName: 'J0hn' }, 'firstName');
    await expectFieldError({ firstName: 'a'.repeat(51) }, 'firstName');
    await expectFieldError({ lastName: undefined }, 'lastName');
    await expectFieldError({ lastName: 'Smith!' }, 'lastName');
    await expectFieldError({ lastName: "'-" }, 'lastName');
    await expectFieldError({ email: 'not-an-email' }, 'email');
    await expectFieldError({ email: 'a@b' }, 'email');
    await expectFieldError({ email: `${'a'.repeat(250)}@example.com` }, 'email');
    await expectFieldError({ phone: '123-456-7890' }, 'phone');
    await expectFieldError({ phone: '++12345678' }, 'phone');
    await expectFieldError({ phone: '12 34 5' }, 'phone');
    await expectFieldError({ phone: '+1234567890123456' }, 'phone');
    await expectFieldError({ organisation: 'x'.repeat(121) }, 'organisation');
    await expectFieldError({ interest: 'Something else' }, 'interest');
    await expectFieldError({ message: '' }, 'message');
    await expectFieldError({ message: 'Too short' }, 'message');
    await expectFieldError({ message: 'x'.repeat(2001) }, 'message');
    await expectFieldError({ consent: false }, 'consent');
    expect(await prisma.lead.count()).toBe(0);
  });

  it('accepts 7 and 15 digit phone numbers and Unicode names', async () => {
    expect((await post({ ...valid(), phone: '1234567' })).status).toBe(201);
    expect((await post({ ...valid(), phone: '+123 456 789 012 345' })).status).toBe(201);
    expect((await post({ ...valid(), firstName: 'Zoë', lastName: 'Lefèvre’s' })).status).toBe(201);
    expect(await prisma.lead.count()).toBe(3);
  });

  it('silently accepts but does not store a submission with the honeypot filled', async () => {
    const res = await post({ ...valid(), website: 'https://spam.example' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
    // Even an otherwise invalid bot submission gets the normal success shape.
    expect((await post({ website: 'x' })).status).toBe(201);
    expect(await prisma.lead.count()).toBe(0);
  });

  it('rejects submissions sent less than 3 seconds after the form loaded (or without timing) and stores nothing', async () => {
    for (const elapsedMs of [0, 2999, -1, 'abc', undefined]) {
      const res = await post({ ...valid(), elapsedMs });
      expect(res.status, String(elapsedMs)).toBe(400);
      expect(res.body.error).toMatch(/wait a moment and try again/i);
    }
    expect(await prisma.lead.count()).toBe(0);
    expect((await post({ ...valid(), elapsedMs: 3000 })).status).toBe(201);
  });

  it('rate limits to 5 submissions per IP per hour (6th is 429)', async () => {
    const ip = '203.0.113.7';
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await post(valid(), ip)).status);
    expect(statuses).toEqual([201, 201, 201, 201, 201, 429]);
    const blocked = await post(valid(), ip);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(3500);
    expect(await prisma.lead.count()).toBe(5);
    // Another client is unaffected.
    expect((await post(valid(), '203.0.113.8')).status).toBe(201);
  });

  it('rejects messages with more than 2 links', async () => {
    const two = 'See https://example.com/a and www.example.org for details.';
    expect((await post({ ...valid(), message: two })).status).toBe(201);
    await expectFieldError({ message: 'Links: http://a.com https://b.com www.c.com' }, 'message');
    await expectFieldError({ message: 'Visit example.com/x, shop.example.net and another.io today' }, 'message');
    expect(await prisma.lead.count()).toBe(1);
  });

  it('strips HTML tags from every text field before validating and storing', async () => {
    const res = await post({
      ...valid(),
      firstName: '<b>Ana</b>',
      lastName: 'Pérez<script>alert(1)</script>',
      organisation: '<a href="https://x.example">Acme</a> <i>Ltd</i>',
      interest: '<span>Other</span>',
      message: '<p>Hello <strong>team</strong>,</p><img src=x onerror=alert(1)> we have 3 < 5 questions.',
    });
    expect(res.status).toBe(201);
    const lead = await prisma.lead.findFirstOrThrow();
    expect(lead).toMatchObject({
      name: 'Ana Pérez',
      organisation: 'Acme Ltd',
      interest: 'Other',
      message: 'Hello team, we have 3 < 5 questions.',
    });
    // A field that is only markup is empty after stripping, so the required rule applies.
    await expectFieldError({ firstName: '<b></b>' }, 'firstName');
  });

  it('falls back to any interest (length-capped) when no options are configured', async () => {
    await prisma.$executeRawUnsafe('TRUNCATE "PageSection" RESTART IDENTITY CASCADE');
    expect((await post({ ...valid(), interest: 'Anything' })).status).toBe(201);
    await expectFieldError({ interest: 'x'.repeat(121) }, 'interest');
  });
});

describe('shared lead schema (used by the browser form too)', () => {
  const schema = leadSchema(['Partnership']);
  const base = { firstName: 'Ana', lastName: 'Lee', email: 'ana@example.com', message: 'Hello there team!', consent: true };

  it('parses valid input and defaults optional fields to ""', () => {
    expect(schema.parse(base)).toEqual({ ...base, phone: '', organisation: '', interest: '' });
  });

  it('reports the first problem per field with a readable message', () => {
    const r = schema.safeParse({ ...base, firstName: '', email: 'x', interest: 'Nope' });
    expect(r.success).toBe(false);
    const fe = r.success ? {} : r.error.flatten().fieldErrors;
    expect(fe.firstName?.[0]).toBe('Please enter your first name');
    expect(fe.email?.[0]).toBe('Please enter a valid email address');
    expect(fe.interest?.[0]).toBe('Please choose an area from the list');
  });

  it('counts links reasonably', () => {
    expect(countLinks('no links here, e.g. Node.js or v1.2.3')).toBe(0);
    expect(countLinks('mail me at someone@example.com')).toBe(0);
    expect(countLinks('https://www.example.com/x')).toBe(1);
    expect(countLinks('example.com and example.foo/path and example.foo')).toBe(2);
    expect(countLinks('http://a.co www.b.co c.co')).toBe(3);
  });

  it('strips tags, comments and script/style content but keeps comparisons', () => {
    expect(stripHtml('<div>a</div><!-- c --><style>p{}</style>b')).toBe('ab');
    expect(stripHtml('1 < 2 and 3 > 2')).toBe('1 < 2 and 3 > 2');
    expect(stripHtml('x <img src=y onerror=z')).toBe('x ');
  });
});
