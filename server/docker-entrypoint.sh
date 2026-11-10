#!/bin/sh
set -e
# 1. Refuse to continue with unsafe production secrets (before touching the database).
node dist/check-env.js
# 2. Apply the database migrations, retrying while the database finishes starting.
i=0
until node scripts/prisma.mjs migrate deploy; do
  i=$((i+1)); [ "$i" -ge 5 ] && { echo "Database migration failed" >&2; exit 1; }
  echo "Retrying migrations ($i/5)..."; sleep 3
done
# 3. Seed missing content (idempotent). Retry: the first start can be CPU-heavy (image conversion + bcrypt).
#    --allow-production-env: this container seeds its own database on purpose, so NODE_ENV=production is accepted.
#    It does NOT bypass the production-host check (only --force-production does), and --reset/SEED_RESET stay refused.
i=0
until npm run db:seed -- --allow-production-env; do
  i=$((i+1)); [ "$i" -ge 4 ] && { echo "Seeding failed" >&2; exit 1; }
  echo "Retrying seed ($i/4)..."; sleep 3
done
exec node dist/index.js
