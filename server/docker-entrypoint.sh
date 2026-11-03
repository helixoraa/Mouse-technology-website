#!/bin/sh
set -e
# 1. Refuse to continue with unsafe production secrets (before touching the database).
node dist/check-env.js
# 2. Apply the schema, retrying while the database finishes starting.
i=0
until npx prisma db push --skip-generate; do
  i=$((i+1)); [ "$i" -ge 5 ] && { echo "Database schema sync failed" >&2; exit 1; }
  echo "Retrying schema sync ($i/5)..."; sleep 3
done
# 3. Seed missing content (idempotent). Retry: the first start can be CPU-heavy (image conversion + bcrypt).
i=0
until npm run db:seed; do
  i=$((i+1)); [ "$i" -ge 4 ] && { echo "Seeding failed" >&2; exit 1; }
  echo "Retrying seed ($i/4)..."; sleep 3
done
exec node dist/index.js
