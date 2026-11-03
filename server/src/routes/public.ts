import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError, validate, wrap } from '../middleware/common.js';
import { rateLimit } from '../lib/ratelimit.js';

export const PAGE_KEYS = ['home', 'vision', 'about', 'team', 'contact', 'products', 'projects', 'blog', 'terms', 'privacy'] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export const publicRouter = Router();

type SeoShape = {
  default?: { title?: string; description?: string; ogImage?: string };
  pages?: Record<string, { title?: string; description?: string; ogImage?: string }>;
};

publicRouter.get(
  '/site',
  wrap(async (_req, res) => {
    const s = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!s) throw new HttpError(404, 'Site settings not seeded');
    const seo = (s.seo ?? {}) as SeoShape;
    res.json({
      siteName: s.siteName,
      tagline: s.tagline,
      logoUrl: s.logoUrl,
      email: s.email,
      phone: s.phone,
      address: s.address,
      socials: s.socials,
      nav: s.nav,
      footer: s.footer,
      seo: { default: seo.default ?? {} },
    });
  }),
);

publicRouter.get(
  '/pages/:page',
  validate({ params: z.object({ page: z.enum(PAGE_KEYS) }) }),
  wrap(async (req, res) => {
    const page = req.params.page as PageKey;
    const [sections, settings] = await Promise.all([
      prisma.pageSection.findMany({ where: { page, visible: true }, orderBy: { order: 'asc' } }),
      prisma.siteSettings.findUnique({ where: { id: 1 } }),
    ]);
    const seo = (settings?.seo ?? {}) as SeoShape;
    res.json({
      page,
      seo: { ...(seo.default ?? {}), ...(seo.pages?.[page] ?? {}) },
      sections: sections.map((s) => ({ id: s.id, key: s.key, order: s.order, content: s.content })),
    });
  }),
);

const visibleOrdered = { where: { visible: true }, orderBy: { order: 'asc' as const } };

publicRouter.get(
  '/services',
  validate({ query: z.object({ category: z.enum(['product', 'planned', 'business']).optional() }) }),
  wrap(async (req, res) => {
    const category = (req.query as { category?: string }).category;
    res.json(await prisma.service.findMany({ where: { visible: true, ...(category ? { category } : {}) }, orderBy: { order: 'asc' } }));
  }),
);
publicRouter.get(
  '/team',
  wrap(async (_req, res) => res.json(await prisma.teamMember.findMany(visibleOrdered))),
);
publicRouter.get(
  '/faqs',
  wrap(async (_req, res) => res.json(await prisma.faq.findMany(visibleOrdered))),
);
publicRouter.get(
  '/testimonials',
  wrap(async (_req, res) => res.json(await prisma.testimonial.findMany(visibleOrdered))),
);
publicRouter.get(
  '/posts',
  wrap(async (_req, res) => res.json(await prisma.post.findMany({ where: { visible: true }, orderBy: { publishedAt: 'desc' } }))),
);
publicRouter.get(
  '/posts/:slug',
  validate({ params: z.object({ slug: z.string().min(1) }) }),
  wrap(async (req, res) => {
    const post = await prisma.post.findFirst({ where: { slug: req.params.slug, visible: true } });
    if (!post) throw new HttpError(404, 'Post not found');
    res.json(post);
  }),
);

const leadLimiter = rateLimit({
  name: 'leads',
  limit: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Too many submissions, please try again later.',
});

export const leadSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name').max(120),
  email: z.string().trim().email('Please enter a valid email').max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  organisation: z.string().trim().max(160).optional().or(z.literal('')),
  interest: z.string().trim().max(120).optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Please tell us how we can help').max(4000),
  consent: z.literal(true, { errorMap: () => ({ message: 'Consent is required' }) }),
});

publicRouter.post(
  '/leads',
  leadLimiter,
  validate({ body: leadSchema }),
  wrap(async (req, res) => {
    const b = req.body as z.infer<typeof leadSchema>;
    await prisma.lead.create({
      data: {
        name: b.name,
        email: b.email,
        phone: b.phone || null,
        organisation: b.organisation || null,
        interest: b.interest || null,
        message: b.message,
        consent: true,
      },
    });
    res.status(201).json({ ok: true });
  }),
);
