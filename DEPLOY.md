# Deploying MAOUAJ to Vercel

One Vercel project serves everything on **one domain**: the React site as static files, and the Express API as a serverless function at `/api`.
The database is **Neon** (Postgres) and uploaded images live in **Vercel Blob**. Nothing sends email: accounts are handed over with a one-time temporary password.

You need: a GitHub repo with this code, a Vercel account and Node 20+ on your computer.

## 1. Import the repo

1. Vercel dashboard -> **Add New... -> Project** -> import the GitHub repo.
2. **Framework Preset: Other.** **Root Directory: leave empty (repo root).** Do not override the build settings: `vercel.json` already sets
   install (`npm install`), build (`npm run vercel-build` = `prisma generate` + client build) and output (`client/dist`).
3. Do **not** press Deploy yet: add the database, storage and variables first (steps 2 and 3). An early deploy will simply fail the secret check, which is harmless.

## 2. Add the database and file storage

In the new project open the **Storage** tab:

- **Neon (Postgres):** Create / connect a Neon database. When asked for an environment-variable **prefix, leave it empty** so the variables are named `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
- **Blob:** Create a Blob store and connect it to the project. This adds `BLOB_READ_WRITE_TOKEN`.

Then fix the database variables under **Settings -> Environment Variables** (see `.env.production.example`):

- `DATABASE_URL` must be the **pooled** URL and must end with `&pgbouncer=true&connect_timeout=15` (add it if it is missing; the URL already contains a `?`).
- Add `DIRECT_URL` = the value of `DATABASE_URL_UNPOOLED` (the direct, non-pooled URL).

## 3. Set the remaining environment variables

Settings -> Environment Variables, scope **Production** (add Preview too if you want preview deployments to work). Generate every secret yourself, locally:

| Variable                | Value                                                        | How to generate                                                                  |
| ----------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `NODE_ENV`              | `production`                                                 |                                                                                  |
| `JWT_SECRET`            | 32+ random characters                                        | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `ADMIN_EMAIL`           | your admin e-mail address (used only as a login name)        |                                                                                  |
| `ADMIN_PASSWORD`        | 12+ characters, not an example                               | `node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"` |
| `CLIENT_URL`            | `https://your-project.vercel.app` (later your custom domain) |                                                                                  |
| `STORAGE_DRIVER`        | `blob`                                                       |                                                                                  |
| `BLOB_READ_WRITE_TOKEN` | set by the Blob store                                        |                                                                                  |

**Store `JWT_SECRET` and `ADMIN_PASSWORD` in your password manager.** The site refuses to start in production if either of them is missing
or is still an example value.

## 4. Deploy, then create the tables and the first content (once)

1. Press **Deploy** (or push to `main`). The site builds, but the database is empty until the next step.
2. Get the production variables onto your computer. Either:
   - Vercel CLI: `npx vercel login`, then `npx vercel link` (choose the project), then `npx vercel env pull .env.production.local --environment=production`, **or**
   - create the file `.env.production.local` in the repo root by hand and paste the variables from the dashboard (one `NAME="value"` per line, including `NODE_ENV="production"`).

   This file is git-ignored. Never commit it.

3. From the repo root (the same commands work in PowerShell, cmd and bash; they read `.env.production.local` automatically):

   ```bash
   npm install
   npm run prod:deploy     # applies the database migrations to Neon
   npm run prod:seed -- --force-production   # first setup: the admin, all content and the images (takes a minute)
   ```

   These commands use **only** `.env.production.local` (your local `server/.env` is ignored, so they can never touch your development database), force production mode, and print the target database host first: check that it is your Neon host before you continue.

   The seed refuses to touch production unless you add `-- --force-production`, so it can't run there by accident (`--allow-production-env`, used by the Docker setup for its own database, does not get past the production-host check). It never changes an existing user, never overwrites content edited in the admin, and matches services and posts by a fixed id (a renamed slug can't create a duplicate).

4. Open your site: all pages should load with the real content and images.

> Already have a local database created before migrations existed (`prisma db push`)? Mark the initial migration as applied instead of running it:
> `cd server && node scripts/prisma.mjs migrate resolve --applied 20260101000000_init`.

## 5. First login (you, the administrator)

1. Go to `https://your-site/admin` and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
2. You are forced to **choose a new password** (12+ characters), then land on the dashboard.

## 6. Create the client's account and hand it over

1. Admin -> **Users** -> **New user**: name, e-mail, role (**ADMIN** can manage users; **EDITOR** edits content only).
2. A **temporary password** is shown **once** with a Copy button. Send it to the client through a private channel (phone call, a private chat message, in person). It is never stored or shown again.
3. The client opens `/admin`, signs in with the temporary password, and chooses a new password. The temporary password stops working as soon as they change it.

Other actions on the Users page (ADMIN only):

- **Reset password**: generates a new one-time temporary password; the user must change it on next login and all their sessions are signed out.
- **Deactivate / Activate**, **Change role**, **Delete**. You cannot delete, demote or deactivate yourself, and the last active ADMIN can never be removed.
- **Audit log** (Admin -> Audit log): every login, password and user change with time and IP.

## 7. If nobody can log in (recovery)

Run this on your computer with `.env.production.local` in place (pull it again with `npx vercel env pull` if needed):

```bash
npm run prod:admin-reset -- --email someone@yourcompany.com
```

It prints a **temporary password** and signs that account out. They then log in and choose a new password.

## 8. Custom domain

1. Vercel -> Project -> Settings -> **Domains** -> add your domain and set the DNS records Vercel shows. HTTPS is automatic.
2. Change `CLIENT_URL` to `https://your-domain` and **redeploy** (Deployments -> ... -> Redeploy), so the API trusts the new origin.

## Things to know

- **Rotating secrets.** Changing `JWT_SECRET` signs everyone out (fine; do it if you suspect a leak).
- **Upload limit: 4 MB per file.** Vercel functions accept request bodies up to 4.5 MB, so the admin refuses larger images. Resize big photos first (WebP/JPEG at ~2000 px wide is plenty).
- **Function limits.** The API function is configured for up to 30 seconds and 1 GB (`vercel.json`); normal requests take milliseconds. Your Vercel plan may cap this lower.
- **Compression and caching.** Vercel compresses the HTML, JS, CSS and SVG automatically (brotli/gzip). `vercel.json` adds one-year caching for hashed files and fonts, 30 days for `/animations/*`, no caching for `index.html` and `no-store` for `/api`.
- **Security headers.** `vercel.json` sets a strict Content-Security-Policy (own scripts only; images from the site, `data:` and your Blob store), HSTS, `X-Frame-Options: DENY` and more. If you embed a third-party script or iframe later, extend the policy there.
- **Backups.** Neon keeps point-in-time history (length depends on your plan; restore from the Neon console). For your own copy: `pg_dump "<DIRECT_URL>" > backup.sql`. Blob files are not versioned: keep originals of important images.
- **Updating the site.** Push to `main` and Vercel redeploys. After a change that adds a migration run `npm run prod:deploy` once.

## Troubleshooting

| Symptom                                                                   | Fix                                                                                                                                                                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/...` returns 500 and the log says `Refusing to start in production` | A required secret is missing or still an example (Project -> Logs shows which).                                                                                                                               |
| Log says `STORAGE_DRIVER=blob requires BLOB_READ_WRITE_TOKEN`             | Connect the Blob store to the project and redeploy.                                                                                                                                                           |
| `Can't reach database` / too many connections                             | `DATABASE_URL` must be the **pooled** URL with `&pgbouncer=true`; migrations use `DIRECT_URL`.                                                                                                                |
| `Query engine library ... not found`                                      | The Prisma client must be generated for Vercel's Linux runtime: confirm the build log shows `prisma generate`, and that `binaryTargets` in `server/prisma/schema.prisma` still includes `rhel-openssl-3.0.x`. |
| Login says "Too many attempts"                                            | The DB-backed limiter locks an account for 15 minutes after 5 wrong codes. Wait, or use the recovery command above.                                                                                           |
| Pages 404 on refresh                                                      | `vercel.json` must be at the repo root with the SPA rewrite; keep Framework Preset = Other.                                                                                                                   |
| Images missing on the live site                                           | `npm run prod:seed -- --force-production` was not run (it uploads the seed images to Blob), or `STORAGE_DRIVER` is not `blob`.                                                                                |
