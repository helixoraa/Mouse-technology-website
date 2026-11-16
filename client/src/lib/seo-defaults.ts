/**
 * Site-wide SEO / link-preview defaults. Used by build/seo-plugin.ts to fill index.html (what crawlers and
 * WhatsApp/LinkedIn see without JavaScript) and by <Seo> when a page has no value of its own in the CMS.
 * Keep this file free of browser/Vite-only code: it is also imported by the build.
 */
import type { PublicPage } from './routes';

export const SITE_NAME = 'MAOUAJ Technology';
/** At most 60 characters so Google does not truncate it. */
export const DEFAULT_TITLE = 'MAOUAJ Technology | For the way people move, pay and trade';
export const DEFAULT_DESCRIPTION =
  'Digital platforms for cashless bus fares and clearer money transfers, with ride-hailing and e-commerce planned next.';
/** 1200x630 share image in client/public (source: client/build/og-image.html). */
export const SHARE_IMAGE = {
  path: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'MAOUAJ Technology: technology for the way people move, pay and trade.',
} as const;

/**
 * Per-page titles used only when the build can't read the CMS (no DATABASE_URL, or the database is down): each page
 * still gets its own title in the HTML. The real titles come from Admin -> Settings -> SEO (see build/page-seo.ts).
 */
export const FALLBACK_PAGE_TITLES: Record<PublicPage, string> = {
  home: DEFAULT_TITLE,
  products: `Our Products | ${SITE_NAME}`,
  projects: `Our Projects | ${SITE_NAME}`,
  vision: `Our Vision | ${SITE_NAME}`,
  about: `About Us | ${SITE_NAME}`,
  team: `Our Team | ${SITE_NAME}`,
  blog: `Blog & Updates | ${SITE_NAME}`,
  contact: `Contact Us | ${SITE_NAME}`,
  privacy: `Privacy Policy | ${SITE_NAME}`,
  terms: `Terms of Use | ${SITE_NAME}`,
};
