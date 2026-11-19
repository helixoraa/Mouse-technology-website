import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { resolveSiteUrl } from './build/site-url';
import { seoPlugin } from './build/seo-plugin';

export default defineConfig(({ mode }) => {
  // SITE_URL: process env (Vercel / Docker) or client/.env*, falling back to the default in build/site-url.ts.
  const env = loadEnv(mode, __dirname, '');
  const siteUrl = resolveSiteUrl(env.SITE_URL);
  // VITE_STATIC_CONTENT=true: the temporary static version (content from src/content/static-content.json, no API).
  const staticContent = env.VITE_STATIC_CONTENT === 'true';
  return {
    plugins: [react(), seoPlugin(siteUrl, __dirname, { staticContent })],
    define: { __SITE_URL__: JSON.stringify(siteUrl), __STATIC_CONTENT__: JSON.stringify(staticContent) },
    // @shared = validation rules shared with the API (server/src/shared; the client Dockerfile copies that folder too).
    resolve: { alias: { '@': path.resolve(__dirname, 'src'), '@shared': path.resolve(__dirname, '../server/src/shared') } },
    server: {
      port: 5173,
      proxy: {
        '/api': 'http://localhost:4000',
        '/uploads': 'http://localhost:4000',
      },
    },
  };
});
