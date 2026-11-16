/**
 * The ONE setting for the public site address. Read at build time from the SITE_URL environment variable
 * (Vercel project env, Docker build arg, or client/.env) and used for canonical URLs, og:url, sitemap.xml and robots.txt.
 * Change it when the site moves to its own domain - see README "Site URL".
 */
export const DEFAULT_SITE_URL = 'https://maouaj-technology-website.vercel.app';

/** Normalises SITE_URL to an absolute http(s) origin (+ optional base path) without a trailing slash. Throws on garbage. */
export function resolveSiteUrl(raw: string | undefined): string {
  const value = raw?.trim() || DEFAULT_SITE_URL;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`SITE_URL must be an absolute URL like https://www.example.com (got "${value}")`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error(`SITE_URL must use http or https (got "${value}")`);
  if (url.search || url.hash) throw new Error(`SITE_URL must not contain a query string or #fragment (got "${value}")`);
  return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
}
