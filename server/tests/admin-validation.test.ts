import { beforeEach, describe, expect, it } from 'vitest';
import { makeUser, prisma, resetDb, signIn } from './helpers.js';

type Agent = Awaited<ReturnType<typeof signIn>>;
let admin: Agent;

beforeEach(async () => {
  await resetDb();
  await prisma.$executeRawUnsafe('TRUNCATE "Service","SiteSettings" RESTART IDENTITY CASCADE');
  admin = await signIn(await makeUser({ role: 'ADMIN' }));
});

const settings = (patch: Record<string, unknown> = {}, footerPatch: Record<string, unknown> = {}) => ({
  siteName: 'MAOUAJ Technology',
  tagline: '',
  logoUrl: null,
  email: 'info@example.com',
  phone: '+502-51850811',
  address: 'Somewhere',
  socials: { linkedin: 'https://www.linkedin.com/company/example', x: '' },
  nav: [
    { label: 'Products', href: '/our-products' },
    { label: 'Contact', href: '#contact' },
  ],
  footer: {
    tagline: '',
    columns: [{ title: 'LEGAL', links: [{ label: 'Privacy', href: '/privacy-policy' }] }],
    copyright: '',
    offices: [{ name: 'USA', address: 'NY', phone: '+1 (716) 533-2271' }],
    ...footerPatch,
  },
  seo: { default: { title: 'T', description: 'D', ogImage: '' }, pages: {} },
  ...patch,
});

const fieldError = (res: { status: number; body: { details?: { fieldErrors?: Record<string, string[]> } } }, field: string) => {
  expect(res.status).toBe(400);
  return res.body.details?.fieldErrors?.[field]?.[0] ?? '';
};

describe('admin settings validation', () => {
  it('accepts valid settings, CMS placeholders and empty contact values', async () => {
    expect((await admin.put('/api/admin/settings').send(settings())).status).toBe(200);
    expect((await admin.put('/api/admin/settings').send(settings({ email: '[Business email]', phone: '' }))).status).toBe(200);
    expect((await admin.put('/api/admin/settings').send(settings({ email: '', phone: '[Business phone]' }))).status).toBe(200);
  });

  it('rejects an invalid email, phone, logo, social URL, link or office phone with a field error', async () => {
    expect(fieldError(await admin.put('/api/admin/settings').send(settings({ email: 'info@' })), 'email')).toMatch(/valid email/);
    expect(fieldError(await admin.put('/api/admin/settings').send(settings({ phone: 'call us' })), 'phone')).toMatch(/digits/);
    expect(fieldError(await admin.put('/api/admin/settings').send(settings({ phone: '12345' })), 'phone')).toMatch(/7 to 15/);
    expect(fieldError(await admin.put('/api/admin/settings').send(settings({ logoUrl: 'javascript:alert(1)' })), 'logoUrl')).not.toBe('');
    expect(fieldError(await admin.put('/api/admin/settings').send(settings({ socials: { x: 'twitter.com/x' } })), 'socials')).toMatch(
      /Social link/,
    );
    expect(
      fieldError(await admin.put('/api/admin/settings').send(settings({ nav: [{ label: 'Bad', href: 'javascript:alert(1)' }] })), 'nav'),
    ).toMatch(/Link URL/);
    expect(fieldError(await admin.put('/api/admin/settings').send(settings({ nav: [{ label: 'Empty', href: '' }] })), 'nav')).toMatch(
      /Link URL: required/,
    );
    expect(
      fieldError(
        await admin.put('/api/admin/settings').send(settings({}, { offices: [{ name: 'A', address: 'B', phone: 'x' }] })),
        'footer',
      ),
    ).toMatch(/Office phone/);
    expect(await prisma.siteSettings.count()).toBe(0);
  });
});

describe('admin services validation', () => {
  const service = (patch: Record<string, unknown> = {}) => ({
    slug: 'svc',
    title: 'Service',
    category: 'product',
    status: 'In development',
    summary: 'Summary',
    image: '/uploads/seed/x.webp',
    ctaLabel: 'Learn more',
    ctaHref: '/our-products',
    ...patch,
  });

  it('accepts site paths, https links and empty optional links', async () => {
    expect((await admin.post('/api/admin/services').send(service())).status).toBe(201);
    expect((await admin.post('/api/admin/services').send(service({ slug: 'b', ctaHref: 'https://example.com/', image: '' }))).status).toBe(
      201,
    );
    const rows = await prisma.service.findMany({ orderBy: { slug: 'asc' } });
    expect(rows.map((r) => [r.ctaHref, r.image])).toEqual([
      ['https://example.com/', null],
      ['/our-products', '/uploads/seed/x.webp'],
    ]);
  });

  it('rejects unsafe or malformed links/images and missing required fields', async () => {
    expect(fieldError(await admin.post('/api/admin/services').send(service({ ctaHref: 'javascript:alert(1)' })), 'ctaHref')).not.toBe('');
    expect(fieldError(await admin.post('/api/admin/services').send(service({ ctaHref: '//evil.example' })), 'ctaHref')).not.toBe('');
    expect(fieldError(await admin.post('/api/admin/services').send(service({ image: 'data:image/png;base64,AAAA' })), 'image')).not.toBe(
      '',
    );
    expect(fieldError(await admin.post('/api/admin/services').send(service({ summary: '  ' })), 'summary')).toBe('Required');
    expect(await prisma.service.count()).toBe(0);
  });
});

describe('admin users validation', () => {
  it('rejects an invalid email for a new user', async () => {
    const res = await admin.post('/api/admin/users').send({ name: 'New', email: 'not-an-email', role: 'EDITOR' });
    expect(fieldError(res, 'email')).toMatch(/valid email/);
  });
});
