import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { resolveSiteUrl } from './build/site-url';
import { seoPlugin } from './build/seo-plugin';

export default defineConfig(({ mode }) => {
  // SITE_URL: process env (Vercel / Docker) or client/.env*, falling back to the default in build/site-url.ts.
  const siteUrl = resolveSiteUrl(loadEnv(mode, __dirname, '').SITE_URL);
  return {
    plugins: [react(), seoPlugin(siteUrl, __dirname)],
    define: { __SITE_URL__: JSON.stringify(siteUrl) },
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
