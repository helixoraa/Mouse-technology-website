import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from './helpers.js';

const store = new Map<string, string>();
const put = vi.fn(async (key: string) => {
  const url = `https://abc123.public.blob.vercel-storage.com/${key}`;
  store.set(key, url);
  return { url, pathname: key };
});
vi.mock('@vercel/blob', () => ({
  put: (key: string) => put(key),
  list: async ({ prefix }: { prefix: string }) => ({
    blobs: [...store].filter(([k]) => k.startsWith(prefix)).map(([pathname, url]) => ({ pathname, url })),
  }),
}));

const { migrateLocalMedia } = await import('../src/lib/media-migrate.js');
process.env.BLOB_READ_WRITE_TOKEN = 'test-token';

const BLOB = 'https://abc123.public.blob.vercel-storage.com';

beforeEach(async () => {
  store.clear();
  put.mockClear();
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Media","Post","TeamMember","Service","Testimonial","SiteSettings","PageSection" RESTART IDENTITY CASCADE',
  );
});

describe('migrateLocalMedia', () => {
  it('rewrites local seed paths everywhere, reuses existing Blob files, leaves other content untouched', async () => {
    // one file already in Blob (Listing), one missing (must be uploaded)
    store.set('seed/blog-featured-bus.webp', `${BLOB}/seed/blog-featured-bus.webp`);
    await prisma.post.create({
      data: {
        slug: 'p1',
        title: 'P',
        category: 'c',
        excerpt: 'e',
        author: 'a',
        publishedAt: new Date(),
        image: '/uploads/seed/blog-featured-bus.webp',
        body: 'text with /uploads/seed/blog-featured-bus.webp inside',
      },
    });
    await prisma.post.create({
      data: {
        slug: 'p2',
        title: 'Q',
        category: 'c',
        excerpt: 'e',
        author: 'a',
        publishedAt: new Date(),
        image: 'https://example.com/uploads/x.webp',
      },
    });
    await prisma.pageSection.create({
      data: {
        page: 'products',
        key: 'hero',
        order: 1,
        content: {
          title: 'Keep me',
          image: '/uploads/seed/blog-featured-bus.webp',
          list: [{ photo: '/uploads/seed/does-not-exist.webp' }],
        },
      },
    });
    await prisma.siteSettings.create({
      data: {
        id: 1,
        siteName: 'S',
        tagline: 't',
        logoUrl: '/uploads/seed/blog-featured-bus.webp',
        email: 'e',
        phone: 'p',
        address: 'a',
        socials: {},
        nav: [],
        footer: {},
        seo: {},
      },
    });

    const r = await migrateLocalMedia(prisma, { log: () => {} });

    const p1 = await prisma.post.findUniqueOrThrow({ where: { slug: 'p1' } });
    expect(p1.image).toBe(`${BLOB}/seed/blog-featured-bus.webp`);
    expect(p1.body).toBe(`text with ${BLOB}/seed/blog-featured-bus.webp inside`);
    expect((await prisma.post.findUniqueOrThrow({ where: { slug: 'p2' } })).image).toBe('https://example.com/uploads/x.webp');

    const sec = await prisma.pageSection.findFirstOrThrow({ where: { key: 'hero' } });
    expect(sec.content).toEqual({
      title: 'Keep me',
      image: `${BLOB}/seed/blog-featured-bus.webp`,
      list: [{ photo: '/uploads/seed/does-not-exist.webp' }],
    });
    expect((await prisma.siteSettings.findUniqueOrThrow({ where: { id: 1 } })).logoUrl).toBe(`${BLOB}/seed/blog-featured-bus.webp`);

    expect(r.unresolved).toEqual(['/uploads/seed/does-not-exist.webp']);
    expect(put).not.toHaveBeenCalled(); // existing Blob file reused, nothing re-uploaded

    // idempotent: second run changes nothing
    const again = await migrateLocalMedia(prisma, { log: () => {} });
    expect(Object.keys(again.rewrites)).toHaveLength(0);
  });

  it('uploads a file that is missing from Blob and registers it in Media', async () => {
    await prisma.teamMember.create({ data: { name: 'T', role: 'r', bio: 'b', photo: '/uploads/seed/blog-featured-bus.webp', order: 1 } });
    const r = await migrateLocalMedia(prisma, { log: () => {} });
    expect(put).toHaveBeenCalledTimes(1);
    expect(r.uploaded).toEqual(['/uploads/seed/blog-featured-bus.webp']);
    expect((await prisma.teamMember.findFirstOrThrow()).photo).toBe(`${BLOB}/seed/blog-featured-bus.webp`);
    expect(await prisma.media.count({ where: { filename: 'seed/blog-featured-bus.webp' } })).toBe(1);
  });

  it('dry run writes and uploads nothing', async () => {
    await prisma.teamMember.create({ data: { name: 'T', role: 'r', bio: 'b', photo: '/uploads/seed/blog-featured-bus.webp', order: 1 } });
    const r = await migrateLocalMedia(prisma, { dryRun: true, log: () => {} });
    expect(r.rewrites['TeamMember.photo']).toBe(1);
    expect(put).not.toHaveBeenCalled();
    expect((await prisma.teamMember.findFirstOrThrow()).photo).toBe('/uploads/seed/blog-featured-bus.webp');
  });
});
