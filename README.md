# MAOUAJ Technology — website + admin portal

React 18 + Vite + Tailwind public site (`client/`), Express + Prisma + PostgreSQL API (`server/`), and an admin portal at `/admin`.
All page content, images, products/projects, team, FAQs, blog posts and site settings are served by the API and editable in the admin.
The design comes from the Figma file "MAOUAJ combination theme" — see [DESIGN_TOKENS.md](DESIGN_TOKENS.md) and [docs/CONTRACT.md](docs/CONTRACT.md).

## Requirements

Node 20+ (tested on 22/24), npm 10+, PostgreSQL 14+ (or Docker).

## Quick start (local)

```bash
npm install
# 1. PostgreSQL — any instance works; this one-liner matches server/.env.example:
docker run -d --name maouaj-pg -e POSTGRES_USER=maouaj -e POSTGRES_PASSWORD=maouaj -e POSTGRES_DB=maouaj -p 5432:5432 postgres:16-alpine
# 2. Environment
cp server/.env.example server/.env      # edit JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
cp client/.env.example client/.env
# 3. Migrations + seed (creates the tables, the first admin and all Figma content)
npm run db:deploy
npm run db:seed
# 4. Run API (http://localhost:4000) and site (http://localhost:5173)
npm run dev
```

Admin: <http://localhost:5173/admin> — sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `server/.env`
(defaults in `.env.example`: `admin@maouaj.example` / `ChangeMe123!`). **Every account uses two-factor authentication (Google Authenticator / any TOTP app).**
The first sign-in of the seeded admin forces: new password (min 12 chars) → 2FA setup (scan the QR code, confirm with a code) → 10 one-time backup codes (shown once, save them).
If the dev database already has an admin from before 2FA existed, that admin simply sets up 2FA on the next sign-in.

## Environment variables

| App    | Variable                        | Purpose                                                                                                                                                                                                |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| server | `DATABASE_URL`                  | PostgreSQL connection string                                                                                                                                                                           |
| server | `JWT_SECRET`                    | Signs the httpOnly session cookie (>= 16 chars, random in production)                                                                                                                                  |
| server | `TOTP_ENCRYPTION_KEY`           | 32-byte AES-256-GCM key (64 hex chars or base64) encrypting 2FA secrets at rest. **Required in production** (`openssl rand -hex 32`). In development a key is derived from `JWT_SECRET` with a warning |
| server | `DIRECT_URL`                    | Direct (non-pooled) database URL used by migrations (Neon). Locally leave it equal to `DATABASE_URL` (the `scripts/prisma.mjs` wrapper defaults it)                                                    |
| server | `CLIENT_URL`                    | The only origin allowed by CORS (credentials enabled)                                                                                                                                                  |
| server | `PORT`                          | API port (default 4000)                                                                                                                                                                                |
| server | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First admin, created by the seed **only if missing** with "must change password"; an existing account is never touched                                                                                 |
| server | `STORAGE_DRIVER`, `UPLOAD_DIR`  | Upload storage (`local` -> `server/uploads`, served at `/uploads`)                                                                                                                                     |
| server | `COOKIE_SECURE`                 | `true`/`false`; defaults to `true` when `NODE_ENV=production`. Use `false` only for plain-http setups                                                                                                  |
| client | `VITE_API_URL`                  | API origin. Leave empty in dev (Vite proxies `/api` + `/uploads`) and when nginx proxies the API                                                                                                       |

## Seeding

`npm run db:seed` is idempotent and **never overwrites admin edits**: it creates the admin user, converts everything in `server/seed-media/`
(png/jpg -> webp, svg copied) into `server/uploads/seed/`, and creates any missing sections, services, team, FAQs, posts and settings from
`server/prisma/seed-data/`. `npm run db:seed -w server -- --reset` resets sections, services, team, FAQs, posts and settings back to the Figma content (it never touches users, passwords or 2FA).
**In production `--reset` is refused** unless `--force-production` is also passed.

## Security

- **Passwords:** bcrypt hashes; new passwords need 12+ characters, 3 of 4 character classes, no name/email/common words.
- **Two-factor authentication (required for every account).** TOTP (RFC 6238, 30 s, 6 digits, ±1 step window). Sign-in is a multi-step flow and **no session exists
  until the code is verified**:
  1. email + password → a 5-minute signed _pre-auth token_ (JSON, not a cookie; useless as a session);
  2. forced steps when needed: change the temporary password → set up 2FA (QR code + manual key, confirmed with a valid code before it is enabled) → 10 single-use
     backup codes (bcrypt-hashed, shown once, regenerable on the Security page);
  3. 6-digit code (or a backup code) → the httpOnly session cookie (`Secure` + `SameSite=Lax` in production, 8 h).
     The TOTP secret is encrypted at rest (AES-256-GCM, `TOTP_ENCRYPTION_KEY`) and never returned after setup. A used code cannot be replayed (time step stored per user).
- **Lockout:** 5 wrong codes per pre-auth token (10 per 15 min per account) lock the account for 15 minutes. Login attempts are limited per IP and per email+IP.
  All limiters and locks are stored in the database (`RateLimit` table), so they work on serverless platforms.
- **Sessions:** the session carries a `sessionVersion`; resetting a password or 2FA, changing role, deactivating or changing your own password increments it and every
  older session is rejected on its next request. Deactivated users cannot sign in.
- **Roles:** `ADMIN` (everything, users, audit log) and `EDITOR` (content). An admin creates users on **Admin → Users**: the system generates a strong temporary password,
  shows it **once** (only its hash is stored), and the user must change it at first sign-in and set up 2FA. Admins can reset a user's password or 2FA, deactivate or delete
  them; nobody can delete, demote or deactivate themselves, and the last active admin can never be removed. No email is sent anywhere: hand over the temporary password yourself.
- **Audit log:** logins, 2FA, password and user changes (user, action, time, IP, success/fail), visible to admins at **Admin → Audit log** (`GET /api/admin/audit`).
- **Lockout recovery** (nobody can sign in): `npm run admin:reset -w server -- --email you@example.com` prints a temporary password and clears that account's 2FA; the next sign-in
  forces a new password and a new 2FA setup. It uses `DATABASE_URL` from the environment (for Vercel: `vercel env pull .env.production.local` first). In Docker:
  `docker compose exec server npx tsx scripts/admin-reset.ts --email you@example.com`.
- Also: helmet, CORS locked to `CLIENT_URL`, zod validation on every route, upload allow-list (jpg/png/webp/svg/gif, 5 MB), lead form rate limit.

**Production secret guard.** With `NODE_ENV=production` the API, the container entrypoint (before it migrates/seeds) and the seed exit with code 1 if `JWT_SECRET`,
`ADMIN_PASSWORD` or `TOTP_ENCRYPTION_KEY` is missing, still an example/default value (`ChangeMe123!`, `change-me-to-a-long-random-string`, `changeme`, `password`, anything
starting with `change-me`/`replace-me`/`your-`…) or too weak (`JWT_SECRET` < 32 chars, `ADMIN_PASSWORD` < 12 chars, `TOTP_ENCRYPTION_KEY` not a 32-byte key). The denylist lives
in one file, `server/src/secrets.ts`. Generate: `openssl rand -base64 48` (JWT) and `openssl rand -hex 32` (TOTP key). In development the guard is off.

**Tests:** `npm test -w server` (vitest + supertest). It creates a separate `maouaj_test` database next to the dev one, so the dev data is never touched.

## Storage

Uploads go through the `StorageDriver` interface in `server/src/lib/storage.ts`. `STORAGE_DRIVER=local` (default) writes to `UPLOAD_DIR` and serves `/uploads` (dev, docker);
`STORAGE_DRIVER=blob` stores files on Vercel Blob (needs `BLOB_READ_WRITE_TOKEN`; uploads are capped at 4 MB because Vercel functions accept 4.5 MB request bodies).
For S3, add a driver that implements `put`/`remove` (returning a public/CDN URL) and select it in `createStorage()`.

## Scripts

`npm run dev` (API + site) · `npm run build` · `npm run typecheck` · `npm run lint` · `npm run format` · `npm run db:deploy` (apply migrations) · `npm run db:migrate` (create a migration while developing) · `npm run db:seed` · `npm run prod:deploy` / `prod:seed` / `prod:admin-reset` (run against the production env pulled into `.env.production.local`, see DEPLOY.md) · `npm test -w server` · `npm run admin:reset -w server -- --email you@example.com`

## Docker

```bash
cp .env.docker.example .env   # then edit .env: set JWT_SECRET, TOTP_ENCRYPTION_KEY, ADMIN_PASSWORD and POSTGRES_PASSWORD (all required, no example values)
docker compose up --build
```

- Compose runs the API with `NODE_ENV=production`, so the secret guard above applies: it refuses to start with example secrets. `JWT_SECRET`,
  `TOTP_ENCRYPTION_KEY`, `ADMIN_PASSWORD` and `POSTGRES_PASSWORD` are required (`${VAR:?}`) and compose stops with a clear message if one is missing.
  Use letters/digits for `POSTGRES_PASSWORD` (it is embedded in the `DATABASE_URL`).
- Site + admin: <http://localhost:8080>. nginx serves the build and proxies `/api` and `/uploads` to the server container; Postgres is not published to the host.
- On plain http (local compose) keep `COOKIE_SECURE=false`; the admin cookie is `Secure` by default in production, so set it back to `true` (or remove it) behind HTTPS.
- The server entrypoint (`server/docker-entrypoint.sh`) checks the secrets, runs `prisma migrate deploy`, the idempotent seed, then starts the API.
  Data lives in the `pgdata` and `uploads` volumes; `docker compose down -v` deletes them.
- nginx compresses text/JSON/SVG with **gzip** (the stock nginx image has no brotli module), caches hashed `/assets/*` for a year and `/animations/*` for 30 days,
  and never caches `index.html`.
- Low on disk? `docker system prune -f` removes stopped containers, dangling images and unused networks (not volumes).

## Deployment

**Vercel (recommended): see [DEPLOY.md](DEPLOY.md).** One Vercel project serves the static client and the Express API as a serverless function at `/api` on the same domain,
with Neon Postgres and Vercel Blob for uploads. `vercel.json` and `.env.production.example` hold the configuration.

Self-hosting elsewhere (any VM or container platform):

1. Provision PostgreSQL and set `DATABASE_URL` (and `DIRECT_URL`: the same value, or the direct connection).
2. `npm ci && npm run build -w server`, then `npm run db:deploy && npm run db:seed` once, then `npm start -w server`.
   Set `NODE_ENV=production`, a strong unique `JWT_SECRET`, `TOTP_ENCRYPTION_KEY` and `ADMIN_PASSWORD` (the server refuses to start otherwise), `CLIENT_URL` = your site origin, and persist `UPLOAD_DIR` (or use `STORAGE_DRIVER=blob`).
3. Client: `npm run build -w client` and host `client/dist` on the same domain as the API with an SPA fallback to `index.html` (the provided nginx config does this), so the cookie stays first-party.
4. TLS: terminate HTTPS at your proxy and forward `X-Forwarded-Proto`; the API sets `trust proxy`, so the `Secure` admin cookie and the DB-backed rate limits see the real client.
5. Secrets live in your platform secret store, never in git. Rotating `JWT_SECRET` signs everyone out. **Never change `TOTP_ENCRYPTION_KEY` once users have set up 2FA** (reset their 2FA from Admin -> Users instead).
