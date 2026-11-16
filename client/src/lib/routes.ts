/**
 * The public pages. App.tsx builds its routes from this list, and the build (build/seo-plugin.ts) uses it for
 * sitemap.xml and the per-page HTML files - so a page added here is routed, listed and served in one place.
 * Kept free of React/browser code: it is also imported by the build.
 */
export const PUBLIC_ROUTES = [
  { path: '/', page: 'home' },
  { path: '/our-products', page: 'products' },
  { path: '/our-projects', page: 'projects' },
  { path: '/our-vision', page: 'vision' },
  { path: '/about-us', page: 'about' },
  { path: '/our-team', page: 'team' },
  { path: '/blog', page: 'blog' },
  { path: '/contact-us', page: 'contact' },
  { path: '/privacy-policy', page: 'privacy' },
  { path: '/terms-of-use', page: 'terms' },
] as const;

export type PublicPage = (typeof PUBLIC_ROUTES)[number]['page'];

/** Areas crawlers should skip (robots.txt Disallow). */
export const PRIVATE_PATH_PREFIXES = ['/admin', '/api/'] as const;
