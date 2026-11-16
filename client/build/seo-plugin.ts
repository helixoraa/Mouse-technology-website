import type { Plugin } from 'vite';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SHARE_IMAGE, SITE_NAME } from '../src/lib/seo-defaults';

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Fills the {{TOKENS}} in index.html with SITE_URL and the defaults from src/lib/seo-defaults.ts, so the HTML that
 * crawlers and link-preview bots receive (they don't run JavaScript) already has the title, description, og:* and twitter:* tags.
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
  };
}
