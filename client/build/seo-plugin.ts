import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import type { OutputAsset } from 'rollup';
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

/** The page paths (without "/") that the hosting config must route to the app; "/" is served by index.html itself. */
const routedPages = () => PUBLIC_ROUTES.map((r) => r.path.slice(1)).filter(Boolean);

/**
 * Unknown URLs return a real 404 because the hosting config routes only the known pages to the app (vercel.json
 * rewrites, nginx.conf location). Fail the build if either list differs from src/lib/routes.ts, so a new page can't
 * silently 404 in production.
 */
export function checkHostingRoutes(clientDir: string) {
  const expected = routedPages().sort().join('|');
  const sources: [string, RegExp][] = [
    [path.resolve(clientDir, '../vercel.json'), /"source":\s*"\/:page\(([^)]+)\)"/],
    [path.resolve(clientDir, 'nginx.conf'), /location ~ \^\/\(([^)]+)\)/],
  ];
  for (const [file, pattern] of sources) {
    if (!fs.existsSync(file)) continue;
    const found = fs.readFileSync(file, 'utf8').match(pattern)?.[1];
    const actual = found?.split('|').sort().join('|');
    if (actual !== expected) {
      throw new Error(
        `${path.basename(file)}: the public page list (${found ?? 'not found'}) must match src/lib/routes.ts (${routedPages().join('|')})`,
      );
    }
  }
}

const CANONICAL_TAG = /<link rel="canonical" href="[^"]*" \/>/;
const OG_URL_TAG = /<meta property="og:url" content="[^"]*" \/>/;

/**
 * The HTML for one public page: index.html with that page's canonical URL and og:url, so crawlers get the right
 * canonical without running JavaScript. Written to <page>/index.html; the hosting config rewrites /<page> to it.
 */
export function buildPageHtml(indexHtml: string, siteUrl: string, pagePath: string): string {
  if (!CANONICAL_TAG.test(indexHtml) || !OG_URL_TAG.test(indexHtml)) {
    throw new Error('maouaj-seo: index.html must contain the canonical link and og:url meta tags');
  }
  const url = escapeHtml(siteUrl + pagePath);
  return indexHtml
    .replace(CANONICAL_TAG, `<link rel="canonical" href="${url}" />`)
    .replace(OG_URL_TAG, `<meta property="og:url" content="${url}" />`);
}

/**
 * The app shell marked noindex, without canonical or og:url. Used for 404.html (hosts serve it with status 404 for
 * every unknown URL) and admin/index.html (the admin portal must never be indexed or claim the home page's canonical).
 */
export function buildNoindexHtml(indexHtml: string): string {
  return indexHtml
    .replace(/\s*<link rel="canonical"[^>]*>/, '')
    .replace(/\s*<meta property="og:url"[^>]*>/, '')
    .replace(/(<meta name="viewport"[^>]*>)/, '$1\n    <meta name="robots" content="noindex" />');
}

/**
 * Build-time SEO output:
 * - fills the {{TOKENS}} in index.html with SITE_URL and the defaults from src/lib/seo-defaults.ts, so the HTML that
 *   crawlers and link-preview bots receive (they don't run JavaScript) already has title, description, og:* and twitter:*;
 * - emits robots.txt and sitemap.xml (SITE_URL + src/lib/routes.ts) as real files next to index.html;
 * - emits <page>/index.html for every public page with its own canonical URL and og:url (see buildPageHtml);
 * - emits 404.html and admin/index.html (noindex shells) and checks that vercel.json / nginx.conf route exactly the public pages (see checkHostingRoutes).
 */
export function seoPlugin(siteUrl: string, clientDir: string): Plugin {
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
    enforce: 'post',
    buildStart() {
      checkHostingRoutes(clientDir);
    },
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace(/\{\{([A-Z_]+)\}\}/g, (match, key: string) => {
          if (!(key in tokens)) throw new Error(`index.html: unknown token ${match}`);
          return escapeHtml(tokens[key]);
        }),
    },
    generateBundle(_options, bundle) {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobots(siteUrl) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(siteUrl) });
      const index = bundle['index.html'] as OutputAsset | undefined;
      if (!index) throw new Error('maouaj-seo: index.html missing from the bundle');
      const html = String(index.source);
      for (const { path: pagePath } of PUBLIC_ROUTES) {
        if (pagePath === '/') continue; // index.html itself already carries the home canonical
        this.emitFile({ type: 'asset', fileName: `${pagePath.slice(1)}/index.html`, source: buildPageHtml(html, siteUrl, pagePath) });
      }
      const noindex = buildNoindexHtml(html);
      this.emitFile({ type: 'asset', fileName: '404.html', source: noindex });
      this.emitFile({ type: 'asset', fileName: 'admin/index.html', source: noindex });
    },
  };
}
