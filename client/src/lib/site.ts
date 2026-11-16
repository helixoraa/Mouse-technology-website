/** Public site address from the SITE_URL build setting (see README "Site URL"). No trailing slash. */
export const SITE_URL: string = __SITE_URL__;

/** "/blog" -> "https://<site>/blog". Absolute http(s) URLs are returned unchanged. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}
