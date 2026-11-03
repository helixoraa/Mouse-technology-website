import { Router, type RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError, validate, wrap } from '../middleware/common.js';
import { storage } from '../lib/storage.js';
import { PAGE_KEYS } from './public.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN', 'EDITOR'));

const idParams = z.object({ id: z.string().min(1) });
const reorderBody = z.object({ ids: z.array(z.string().min(1)).min(1) });
const optStr = z
  .string()
  .trim()
  .max(2000)
  .nullish()
  .transform((v) => (v === '' ? null : (v ?? null)));
const jsonValue = z.custom<Prisma.InputJsonValue>((v) => v !== undefined, 'Required');
const nullableJson = z.custom<Prisma.InputJsonValue | null>(() => true).nullish();

/* ---------- Stats ---------- */
adminRouter.get(
  '/stats',
  wrap(async (_req, res) => {
    const [total, newLeads, contacted, recentLeads, sections, services, team, faqs, posts, testimonials, media, users] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'NEW' } }),
      prisma.lead.count({ where: { status: 'CONTACTED' } }),
      prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.pageSection.count(),
      prisma.service.count(),
      prisma.teamMember.count(),
      prisma.faq.count(),
      prisma.post.count(),
      prisma.testimonial.count(),
      prisma.media.count(),
      prisma.user.count(),
    ]);
    res.json({
      leads: { total, new: newLeads, contacted },
      recentLeads,
      content: { sections, services, team, faqs, posts, testimonials, media, users },
    });
  }),
);

/* ---------- Page sections ---------- */
adminRouter.get(
  '/pages',
  wrap(async (_req, res) => {
    const groups = await prisma.pageSection.groupBy({ by: ['page'], _count: { _all: true } });
    const counts = new Map(groups.map((g) => [g.page, g._count._all]));
    res.json(PAGE_KEYS.map((page) => ({ page, count: counts.get(page) ?? 0 })));
  }),
);

adminRouter.get(
  '/sections',
  validate({ query: z.object({ page: z.enum(PAGE_KEYS).optional() }) }),
  wrap(async (req, res) => {
    const page = (req.query as { page?: string }).page;
    res.json(await prisma.pageSection.findMany({ where: page ? { page } : {}, orderBy: [{ page: 'asc' }, { order: 'asc' }] }));
  }),
);

adminRouter.put(
  '/sections/reorder',
  validate({ body: z.object({ page: z.enum(PAGE_KEYS), ids: z.array(z.string().min(1)).min(1) }) }),
  wrap(async (req, res) => {
    const { page, ids } = req.body as { page: string; ids: string[] };
    await prisma.$transaction(ids.map((id, i) => prisma.pageSection.updateMany({ where: { id, page }, data: { order: i } })));
    res.json(await prisma.pageSection.findMany({ where: { page }, orderBy: { order: 'asc' } }));
  }),
);

adminRouter.post(
  '/sections',
  validate({
    body: z.object({
      page: z.enum(PAGE_KEYS),
      key: z.string().trim().min(1).max(80),
      content: jsonValue,
      order: z.number().int().optional(),
      visible: z.boolean().optional(),
    }),
  }),
  wrap(async (req, res) => {
    const b = req.body as { page: string; key: string; content: Prisma.InputJsonValue; order?: number; visible?: boolean };
    const max = await prisma.pageSection.aggregate({ where: { page: b.page }, _max: { order: true } });
    const created = await prisma.pageSection.create({
      data: { page: b.page, key: b.key, content: b.content, order: b.order ?? (max._max.order ?? -1) + 1, visible: b.visible ?? true },
    });
    res.status(201).json(created);
  }),
);

adminRouter.put(
  '/sections/:id',
  validate({
    params: idParams,
    body: z.object({ content: jsonValue.optional(), visible: z.boolean().optional(), key: z.string().trim().min(1).max(80).optional() }),
  }),
  wrap(async (req, res) => {
    const b = req.body as { content?: Prisma.InputJsonValue; visible?: boolean; key?: string };
    res.json(await prisma.pageSection.update({ where: { id: req.params.id }, data: b }));
  }),
);

adminRouter.delete(
  '/sections/:id',
  validate({ params: idParams }),
  wrap(async (req, res) => {
    await prisma.pageSection.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

/* ---------- Generic CRUD for ordered/visible resources ---------- */
interface Delegate {
  findMany(args?: unknown): Promise<unknown[]>;
  create(args: { data: unknown }): Promise<unknown>;
  update(args: { where: { id: string }; data: unknown }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;
  aggregate(args: unknown): Promise<{ _max: { order: number | null } }>;
}

function crud(
  name: string,
  delegate: Delegate,
  createSchema: z.ZodObject<z.ZodRawShape>,
  opts: { ordered: boolean; defaultOrder?: unknown },
) {
  const r = Router();
  const updateSchema = createSchema.partial();
  r.get(
    '/',
    wrap(async (_req, res) => {
      res.json(await delegate.findMany({ orderBy: opts.defaultOrder ?? { order: 'asc' } }));
    }),
  );
  if (opts.ordered) {
    r.put(
      '/reorder',
      validate({ body: reorderBody }),
      wrap(async (req, res) => {
        const { ids } = req.body as { ids: string[] };
        await prisma.$transaction(
          ids.map((id, i) => delegate.update({ where: { id }, data: { order: i } }) as unknown as Prisma.PrismaPromise<unknown>),
        );
        res.json(await delegate.findMany({ orderBy: { order: 'asc' } }));
      }),
    );
  }
  r.post(
    '/',
    validate({ body: createSchema }),
    wrap(async (req, res) => {
      const data = { ...(req.body as Record<string, unknown>) };
      if (opts.ordered && data.order === undefined) {
        const max = await delegate.aggregate({ _max: { order: true } });
        data.order = (max._max.order ?? -1) + 1;
      }
      res.status(201).json(await delegate.create({ data }));
    }),
  );
  r.put(
    '/:id',
    validate({ params: idParams, body: updateSchema }),
    wrap(async (req, res) => {
      res.json(await delegate.update({ where: { id: req.params.id }, data: req.body }));
    }),
  );
  r.delete(
    '/:id',
    validate({ params: idParams }),
    wrap(async (req, res) => {
      await delegate.delete({ where: { id: req.params.id } });
      res.status(204).end();
    }),
  );
  adminRouter.use(`/${name}`, r);
}

const base = { order: z.number().int().optional(), visible: z.boolean().optional() };

crud(
  'services',
  prisma.service as unknown as Delegate,
  z.object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes'),
    title: z.string().trim().min(1).max(200),
    category: z.enum(['product', 'planned', 'business']),
    status: z.string().trim().max(80).default(''),
    summary: z.string().trim().max(2000).default(''),
    description: optStr,
    image: optStr,
    gradient: optStr,
    ctaLabel: optStr,
    ctaHref: optStr,
    extra: nullableJson,
    ...base,
  }),
  { ordered: true },
);

crud(
  'testimonials',
  prisma.testimonial as unknown as Delegate,
  z.object({
    name: z.string().trim().min(1).max(160),
    role: z.string().trim().max(160).default(''),
    company: optStr,
    quote: z.string().trim().min(1).max(3000),
    avatar: optStr,
    ...base,
  }),
  { ordered: true },
);

crud(
  'team',
  prisma.teamMember as unknown as Delegate,
  z.object({
    name: z.string().trim().min(1).max(160),
    role: z.string().trim().max(160).default(''),
    bio: z.string().trim().max(3000).default(''),
    photo: optStr,
    ...base,
  }),
  { ordered: true },
);

crud(
  'faqs',
  prisma.faq as unknown as Delegate,
  z.object({ question: z.string().trim().min(1).max(400), answer: z.string().trim().min(1).max(4000), ...base }),
  { ordered: true },
);

crud(
  'posts',
  prisma.post as unknown as Delegate,
  z.object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes'),
    title: z.string().trim().min(1).max(240),
    category: z.string().trim().max(120).default(''),
    excerpt: z.string().trim().max(2000).default(''),
    body: optStr,
    image: optStr,
    author: z.string().trim().max(160).default('MAOUAJ Team'),
    publishedAt: z.coerce.date().optional(),
    visible: z.boolean().optional(),
  }),
  { ordered: false, defaultOrder: { publishedAt: 'desc' } },
);

/* ---------- Users (ADMIN only) ---------- */
const users = Router();
users.use(requireRole('ADMIN'));
const safeUser = { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true } as const;
const userBody = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1).max(120),
  role: z.enum(['ADMIN', 'EDITOR']),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

users.get(
  '/',
  wrap(async (_req, res) => res.json(await prisma.user.findMany({ select: safeUser, orderBy: { createdAt: 'asc' } }))),
);
users.post(
  '/',
  validate({ body: userBody }),
  wrap(async (req, res) => {
    const b = req.body as z.infer<typeof userBody>;
    const created = await prisma.user.create({
      data: { email: b.email, name: b.name, role: b.role, password: await bcrypt.hash(b.password, 12) },
      select: safeUser,
    });
    res.status(201).json(created);
  }),
);
users.put(
  '/:id',
  validate({ params: idParams, body: userBody.partial() }),
  wrap(async (req, res) => {
    const { password, ...rest } = req.body as Partial<z.infer<typeof userBody>>;
    if (req.params.id === req.user!.id && rest.role && rest.role !== 'ADMIN')
      throw new HttpError(400, 'You cannot remove your own admin role');
    res.json(
      await prisma.user.update({
        where: { id: req.params.id },
        data: { ...rest, ...(password ? { password: await bcrypt.hash(password, 12) } : {}) },
        select: safeUser,
      }),
    );
  }),
);
users.delete(
  '/:id',
  validate({ params: idParams }),
  wrap(async (req, res) => {
    if (req.params.id === req.user!.id) throw new HttpError(400, 'You cannot delete your own account');
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
adminRouter.use('/users', users);

/* ---------- Leads ---------- */
const csvCell = (v: unknown) => {
  let s = v instanceof Date ? v.toISOString() : String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

adminRouter.get(
  '/leads/export.csv',
  wrap(async (_req, res) => {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
    const head = ['id', 'createdAt', 'status', 'name', 'email', 'phone', 'organisation', 'interest', 'message', 'consent'];
    const rows = leads.map((l) =>
      [l.id, l.createdAt, l.status, l.name, l.email, l.phone, l.organisation, l.interest, l.message, l.consent].map(csvCell).join(','),
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.send([head.join(','), ...rows].join('\r\n'));
  }),
);

adminRouter.get(
  '/leads',
  validate({ query: z.object({ status: z.enum(['NEW', 'CONTACTED']).optional() }) }),
  wrap(async (req, res) => {
    const status = (req.query as { status?: 'NEW' | 'CONTACTED' }).status;
    res.json(await prisma.lead.findMany({ where: status ? { status } : {}, orderBy: { createdAt: 'desc' } }));
  }),
);
adminRouter.patch(
  '/leads/:id',
  validate({ params: idParams, body: z.object({ status: z.enum(['NEW', 'CONTACTED']) }) }),
  wrap(async (req, res) => {
    res.json(await prisma.lead.update({ where: { id: req.params.id }, data: { status: req.body.status } }));
  }),
);
adminRouter.delete(
  '/leads/:id',
  validate({ params: idParams }),
  wrap(async (req, res) => {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

/* ---------- Settings ---------- */
const linkSchema = z.object({ label: z.string().trim().min(1).max(120), href: z.string().trim().min(1).max(500) });
const seoMeta = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  ogImage: z.string().max(500).optional(),
});
const settingsBody = z.object({
  siteName: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(300).default(''),
  logoUrl: optStr,
  email: z.string().trim().max(200).default(''),
  phone: z.string().trim().max(60).default(''),
  address: z.string().trim().max(400).default(''),
  socials: z.record(z.string().max(500)).default({}),
  nav: z.array(linkSchema).default([]),
  footer: z.object({
    tagline: z.string().max(400).default(''),
    columns: z.array(z.object({ title: z.string().max(120), links: z.array(linkSchema) })).default([]),
    copyright: z.string().max(300).default(''),
  }),
  seo: z.object({ default: seoMeta.default({}), pages: z.record(seoMeta).default({}) }),
});

adminRouter.get(
  '/settings',
  wrap(async (_req, res) => {
    const s = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!s) throw new HttpError(404, 'Site settings not seeded');
    res.json(s);
  }),
);
adminRouter.put(
  '/settings',
  validate({ body: settingsBody }),
  wrap(async (req, res) => {
    const b = req.body as z.infer<typeof settingsBody>;
    const data = {
      ...b,
      socials: b.socials as Prisma.InputJsonValue,
      nav: b.nav as Prisma.InputJsonValue,
      footer: b.footer as Prisma.InputJsonValue,
      seo: b.seo as Prisma.InputJsonValue,
    };
    res.json(await prisma.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } }));
  }),
);

/* ---------- Media ---------- */
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => (ALLOWED.has(file.mimetype) ? cb(null, true) : cb(new HttpError(400, 'Unsupported file type'))),
});

adminRouter.get(
  '/media',
  wrap(async (_req, res) => res.json(await prisma.media.findMany({ orderBy: { createdAt: 'desc' } }))),
);
adminRouter.post(
  '/media',
  upload.single('file') as RequestHandler,
  wrap(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'No file uploaded (field name: file)');
    const stored = await storage.put(req.file.buffer, req.file.originalname);
    const media = await prisma.media.create({
      data: { url: stored.url, filename: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size },
    });
    res.status(201).json(media);
  }),
);
adminRouter.delete(
  '/media/:id',
  validate({ params: idParams }),
  wrap(async (req, res) => {
    const m = await prisma.media.delete({ where: { id: req.params.id } });
    await storage.remove(m.url);
    res.status(204).end();
  }),
);
