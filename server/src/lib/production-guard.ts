/**
 * Recognises a command that is about to write to the production database, so scripts meant for new or development
 * databases (the seed) can refuse to run there unless the operator explicitly says so.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const here = path.dirname(fileURLToPath(import.meta.url));
/** `vercel env pull .env.production.local` at the repo root (same file scripts/with-prod-env.mjs reads). */
export const PRODUCTION_ENV_FILE = path.resolve(here, '../../../.env.production.local');
const URL_VARS = ['DATABASE_URL', 'DIRECT_URL', 'DATABASE_URL_UNPOOLED'] as const;

/** Host of a Postgres URL, lower-cased, with Neon's "-pooler" endpoint folded into the direct one so both compare equal. */
export function dbHost(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host ? host.replace(/^([^.]+)-pooler\./, '$1.') : null;
  } catch {
    return null;
  }
}

/**
 * Production database hosts: every database URL in the production env file (when it exists on this machine) plus
 * PRODUCTION_DB_HOSTS (comma-separated hostnames, for machines without that file).
 */
export function productionDbHosts(env: NodeJS.ProcessEnv = process.env, envFile: string | null = PRODUCTION_ENV_FILE): Set<string> {
  const hosts = new Set<string>();
  for (const h of (env.PRODUCTION_DB_HOSTS ?? '').split(',')) {
    const host = dbHost(`postgresql://${h.trim()}`);
    if (h.trim() && host) hosts.add(host);
  }
  if (envFile && fs.existsSync(envFile)) {
    const vars = parseEnv(fs.readFileSync(envFile, 'utf8'));
    for (const v of URL_VARS) {
      const host = dbHost(vars[v]);
      if (host) hosts.add(host);
    }
  }
  return hosts;
}

/** Why this process looks like it targets production; empty when it does not. */
export function productionTargets(env: NodeJS.ProcessEnv, prodHosts: Set<string>): string[] {
  const reasons: string[] = [];
  if (env.NODE_ENV === 'production') reasons.push('NODE_ENV=production');
  for (const v of URL_VARS) {
    const host = dbHost(env[v]);
    if (host && prodHosts.has(host)) reasons.push(`${v} points at the production database host (${host})`);
  }
  return reasons;
}
