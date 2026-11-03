/**
 * Moves every local "/uploads/..." image reference in the database to a Vercel Blob URL.
 *   npm run prod:migrate-media              -> runs against the pulled production env (.env.production.local)
 *   npm run prod:migrate-media -- --dry-run -> prints what would change, writes nothing, uploads nothing
 * Idempotent and non-destructive: only strings containing a /uploads/ path are rewritten, files already in Blob are reused.
 */
import 'dotenv/config';
import { prisma } from '../src/db.js';
import { migrateLocalMedia, printMigrateSummary } from '../src/lib/media-migrate.js';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (run `vercel env pull .env.production.local` first)');
  const r = await migrateLocalMedia(prisma, { dryRun, log: console.log });
  printMigrateSummary(r, dryRun);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
