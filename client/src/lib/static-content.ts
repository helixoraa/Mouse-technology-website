import type { Faq, PageData, Post, Service, SiteSettings, TeamMember, Testimonial } from './types';

/**
 * Temporary static version of the site (no API, no database). Switched on only by VITE_STATIC_CONTENT=true at build
 * time (vite.config.ts turns it into the compile-time constant __STATIC_CONTENT__). Unset, the site works exactly as
 * before and this file's snapshot is never bundled.
 */
export const STATIC_CONTENT: boolean = __STATIC_CONTENT__;

/** client/src/content/static-content.json: the public API responses, frozen (see README "Static version"). */
export interface StaticSnapshot {
  generatedAt: string;
  site: SiteSettings;
  /** SiteSettings.seo as stored ({ default, pages }); the build writes each page's title from it. */
  seo: unknown;
  pages: Record<string, PageData>;
  services: Service[];
  team: TeamMember[];
  faqs: Faq[];
  testimonials: Testimonial[];
  posts: Post[];
}

let snapshot: Promise<StaticSnapshot> | undefined;
const loadSnapshot = () =>
  (snapshot ??= import('../content/static-content.json').then((m) => m.default as unknown as StaticSnapshot));

/** The snapshot's answer to a public GET request ("/site", "/pages/home", "/services?category=…"); undefined = not found. */
export async function staticResponse(path: string): Promise<unknown> {
  const s = await loadSnapshot();
  const [route, query = ''] = path.split('?');
  const [resource, id] = route.split('/').filter(Boolean);
  switch (resource) {
    case 'site':
      return s.site;
    case 'pages':
      return id ? s.pages[id] : undefined;
    case 'services': {
      const category = new URLSearchParams(query).get('category');
      return category ? s.services.filter((x) => x.category === category) : s.services;
    }
    case 'team':
      return s.team;
    case 'faqs':
      return s.faqs;
    case 'testimonials':
      return s.testimonials;
    case 'posts':
      return id ? s.posts.find((p) => p.slug === id) : s.posts;
    default:
      return undefined;
  }
}
