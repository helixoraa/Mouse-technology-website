/**
 * Site-wide SEO / link-preview defaults. Used by build/seo-plugin.ts to fill index.html (what crawlers and
 * WhatsApp/LinkedIn see without JavaScript) and by <Seo> when a page has no value of its own in the CMS.
 * Keep this file free of browser/Vite-only code: it is also imported by the build.
 */
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
