import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { resolveSiteUrl } from './build/site-url';

export default defineConfig(({ mode }) => {
  // SITE_URL: process env (Vercel / Docker) or client/.env*, falling back to the default in build/site-url.ts.
  const siteUrl = resolveSiteUrl(loadEnv(mode, __dirname, '').SITE_URL);
  return {
    plugins: [react()],
    define: { __SITE_URL__: JSON.stringify(siteUrl) },
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    server: {
      port: 5173,
      proxy: {
        '/api': 'http://localhost:4000',
        '/uploads': 'http://localhost:4000',
      },
    },
  };
});
