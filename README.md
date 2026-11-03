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
# 3. Schema + seed (creates the admin user and all Figma content)
npm run db:push
npm run db:seed
# 4. Run API (http://localhost:4000) and site (http://localhost:5173)
npm run dev
```

Admin: <http://localhost:5173/admin> — sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `server/.env`
(defaults in `.env.example`: `admin@maouaj.example` / `ChangeMe123!` — change them before deploying).

## Environment variables

| App    | Variable                        | Purpose                                                                                               |
| ------ | ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| server | `DATABASE_URL`                  | PostgreSQL connection string                                                                          |
| server | `JWT_SECRET`                    | Signs the httpOnly session cookie (>= 16 chars, random in production)                                 |
| server | `CLIENT_URL`                    | The only origin allowed by CORS (credentials enabled)                                                 |
| server | `PORT`                          | API port (default 4000)                                                                               |
| server | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin account created/updated by the seed                                                             |
| server | `STORAGE_DRIVER`, `UPLOAD_DIR`  | Upload storage (`local` -> `server/uploads`, served at `/uploads`)                                    |
| server | `COOKIE_SECURE`                 | `true`/`false`; defaults to `true` when `NODE_ENV=production`. Use `false` only for plain-http setups |
| client | `VITE_API_URL`                  | API origin. Leave empty in dev (Vite proxies `/api` + `/uploads`) and when nginx proxies the API      |

## Seeding

`npm run db:seed` is idempotent and **never overwrites admin edits**: it creates the admin user, converts everything in `server/seed-media/`
(png/jpg -> webp, svg copied) into `server/uploads/seed/`, and creates any missing sections, services, team, FAQs, posts and settings from
`server/prisma/seed-data/`. `npm run db:seed -w server -- --reset` resets sections, services, team, FAQs, posts, settings and the admin password
back to the Figma content. Page content lives in `server/prisma/seed-data/<page>.ts` (one `PageSeed` per page); collections and site settings in `collections.ts`.

## Security

bcrypt password hashes, JWT in an httpOnly + SameSite=Lax cookie (8h), roles `ADMIN` / `EDITOR` (only admins manage users), login rate limit (10 / 15 min),
lead form rate limit, helmet, CORS locked to `CLIENT_URL`, zod validation on every route, upload allow-list (jpg/png/webp/svg/gif, 5 MB).

## Storage

Uploads go through the `StorageDriver` interface in `server/src/lib/storage.ts`. The local driver writes to `UPLOAD_DIR`. To use S3, add a driver that
implements `put`/`remove` (returning a public/CDN URL) and select it with `STORAGE_DRIVER`.

## Scripts

`npm run dev` (API + site) · `npm run build` · `npm run typecheck` · `npm run lint` · `npm run format` · `npm run db:push` · `npm run db:seed`

## Docker

```bash
cp .env.example .env   # set JWT_SECRET and ADMIN_PASSWORD (required), optionally ADMIN_EMAIL, POSTGRES_PASSWORD, CLIENT_URL
docker compose up --build
```

Site + admin: <http://localhost:8080> (nginx serves the build and proxies `/api` and `/uploads` to the server container).
The server container runs `prisma db push`, the idempotent seed, then starts the API. Data lives in the `pgdata` and `uploads` volumes.

## Deployment

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Server: `npm ci && npm run build -w server`, then `npx prisma db push && npm run db:seed -w server` once, then `npm start -w server`
   (set `NODE_ENV=production`, a strong `JWT_SECRET`, `CLIENT_URL` = your site origin, and persist `UPLOAD_DIR`).
3. Client: `VITE_API_URL=https://api.example.com npm run build -w client` and host `client/dist` on any static host with an SPA fallback to `index.html`,
   or serve both behind one domain with the provided nginx config (recommended: same origin keeps cookies first-party).
4. Serve everything over HTTPS (cookies are `Secure` in production).
