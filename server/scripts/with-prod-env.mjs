// Runs a command against PRODUCTION using ONLY the variables in <repo>/.env.production.local (from `vercel env pull`).
// The local server/.env is deliberately ignored (DOTENV_CONFIG_PATH redirects dotenv), so a development file can never
// leak a different database URL or secret into a production command. NODE_ENV is forced to production, so the secret
// guards (and the --reset refusal in the seed) are active.
//   node scripts/with-prod-env.mjs <command> [args...]
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import console from 'node:console';
import { URL } from 'node:url';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';

const file = path.resolve(process.cwd(), '..', '.env.production.local');
if (!fs.existsSync(file)) {
  console.error(
    `Missing ${file}\nCreate it with \`npx vercel env pull .env.production.local --environment=production\` or paste the Vercel variables into it (see DEPLOY.md).`,
  );
  process.exit(1);
}

const vars = parseEnv(fs.readFileSync(file, 'utf8'));
const env = { ...process.env, ...vars, NODE_ENV: 'production', DOTENV_CONFIG_PATH: file };
if (!vars.DIRECT_URL) delete env.DIRECT_URL; // let scripts/prisma.mjs derive it from DATABASE_URL_UNPOOLED

try {
  const u = new URL(vars.DATABASE_URL ?? '');
  console.log(`Production target: ${u.hostname}${u.pathname} (env file: ${path.basename(file)})`);
} catch {
  console.error('DATABASE_URL is missing or invalid in .env.production.local');
  process.exit(1);
}

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error('Usage: node scripts/with-prod-env.mjs <command> [args...]');
  process.exit(1);
}
const res = spawnSync(cmd, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
process.exit(res.status ?? 1);
