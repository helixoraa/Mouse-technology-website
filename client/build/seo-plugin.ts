import type { Plugin } from 'vite';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SHARE_IMAGE, SITE_NAME } from '../src/lib/seo-defaults';
import { PRIVATE_PATH_PREFIXES, PUBLIC_ROUTES } from '../src/lib/routes';

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** sitemap.xml: every public page. Blog posts are sections of /blog (no URL of their own), so they are not listed. */
export function buildSitemap(siteUrl: string): string {
  const urls = PUBLIC_ROUTES.map(({ path }) => `  <url><loc>${escapeXml(siteUrl + path)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** robots.txt: allow everything except the admin area and the API, and point to the sitemap. */
export function buildRobots(siteUrl: string): string {
  const disallow = PRIVATE_PATH_PREFIXES.map((p) => `Disallow: ${p}`).join('\n');
  return `User-agent: *\nAllow: /\n${disallow}\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

/**
 * Build-time SEO output:
 * - fills the {{TOKENS}} in index.html with SITE_URL and the defaults from src/lib/seo-defaults.ts, so the HTML that
 *   crawlers and link-preview bots receive (they don't run JavaScript) already has title, description, og:* and twitter:*;
 * - emits robots.txt and sitemap.xml (SITE_URL + src/lib/routes.ts) as real files next to index.html.
 */
export function seoPlugin(siteUrl: string): Plugin {
  const tokens: Record<string, string> = {
    SITE_URL: siteUrl,
    PAGE_URL: `${siteUrl}/`,
    SITE_NAME,
    DEFAULT_TITLE,
    DEFAULT_DESCRIPTION,
    SHARE_IMAGE_URL: `${siteUrl}${SHARE_IMAGE.path}`,
    SHARE_IMAGE_WIDTH: String(SHARE_IMAGE.width),
    SHARE_IMAGE_HEIGHT: String(SHARE_IMAGE.height),
    SHARE_IMAGE_ALT: SHARE_IMAGE.alt,
  };
  return {
    name: 'maouaj-seo',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace(/\{\{([A-Z_]+)\}\}/g, (match, key: string) => {
          if (!(key in tokens)) throw new Error(`index.html: unknown token ${match}`);
          return escapeHtml(tokens[key]);
        }),
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobots(siteUrl) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(siteUrl) });
    },
  };
}
