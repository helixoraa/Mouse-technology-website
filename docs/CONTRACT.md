# Build contract (shared by client, server, seed, admin)

Brand: **MAOUAJ Technology** (as written in the Figma file). All frames are 1440px desktop only.
Page keys / routes: `home` `/`, `vision` `/our-vision`, `about` `/about-us`, `team` `/our-team`, `contact` `/contact-us`,
`products` `/our-products`, `projects` `/our-projects`, `blog` `/blog`, `terms` `/terms-of-use`, `privacy` `/privacy-policy`.

## Public API (no auth) — all under `/api`

- `GET /site` -> SiteSettings `{siteName,tagline,logoUrl,email,phone,address,socials,nav,footer,seo}`
  - `nav: {label,href}[]`, `footer: {tagline, columns:{title,links:{label,href}[]}[], copyright}`, `seo: {default:{title,description,ogImage}}`
- `GET /pages/:page` -> `{page, seo:{title,description,ogImage?}, sections:{id,key,order,content}[]}` (visible only, ordered)
- `GET /services` `?category=product|planned|business` -> Service[]
- `GET /team`, `GET /faqs`, `GET /testimonials`, `GET /posts`, `GET /posts/:slug`
- `POST /leads` `{name,email,phone?,organisation?,interest?,message,consent}` -> `201 {ok:true}`
  Images are URL strings. Local uploads are served from `/uploads/...`; seed images live at `/uploads/seed/<file>`.

## Section content

`PageSection.content` is free-form JSON owned by the component that renders `(page,key)`.
The admin section editor is a generic recursive JSON form: strings -> inputs/textareas, strings whose key is `image`, `src`,
`photo` or ends with `Image`/`Url` (or whose value starts with `/uploads/`) -> image uploader with preview, arrays -> orderable lists,
objects -> nested groups. So keep content JSON plain (strings, numbers, booleans, arrays, objects), keys camelCase.
Headings with coloured words use a **segments** convention: `[{"text":"Our ","accent":false},{"text":"leadership","accent":true}]`.

## Seed data (exact Figma text)

`server/prisma/seed-data/<page>.ts` exports `default` of type `PageSeed` (see `types.ts`): `{page, seo, sections:[{key,order,content}]}`.
`server/prisma/seed-data/collections.ts` exports services, team, faqs, posts, testimonials, settings.

## Design

Use Tailwind tokens from `client/tailwind.config.ts` only (no raw hex in components). Decorative SVGs in `client/src/assets/svg`.
Shared building blocks: `components/layout/*`, `components/ui/*`, `lib/api.ts` hooks. Pages live in `client/src/pages/*Page.tsx`,
one component per section in `client/src/components/sections/<Page>/<Section>.tsx`.

## Auth + Admin API (httpOnly JWT cookie `token`; roles ADMIN, EDITOR; users CRUD is ADMIN-only)

- `POST /auth/login {email,password}` -> `{user}` (rate limited, sets cookie) · `POST /auth/logout` · `GET /auth/me` -> `{user}` or 401
- `GET /admin/stats` -> `{leads:{total,new,contacted}, recentLeads:Lead[], content:{sections,services,team,faqs,posts,testimonials,media,users}}`
- Sections: `GET /admin/sections?page=` (all incl. hidden, ordered) · `POST /admin/sections {page,key,content,order?,visible?}` ·
  `PUT /admin/sections/:id {content?,visible?,key?}` · `DELETE /admin/sections/:id` · `PUT /admin/sections/reorder {page, ids:string[]}`
  · `GET /admin/pages` -> `{page,count}[]` (the 10 page keys)
- CRUD resources `services|testimonials|team|faqs|posts|users`: `GET /admin/<r>` · `POST /admin/<r>` · `PUT /admin/<r>/:id` · `DELETE /admin/<r>/:id`
  · `PUT /admin/<r>/reorder {ids}` for services/testimonials/team/faqs. All have `visible` (users: no). Users: `{email,name,role,password?}`.
- Leads: `GET /admin/leads?status=` · `PATCH /admin/leads/:id {status:'NEW'|'CONTACTED'}` · `DELETE /admin/leads/:id` · `GET /admin/leads/export.csv`
- `GET /admin/settings` / `PUT /admin/settings` (same shape as public `/site` plus `id`)
- Media: `POST /admin/media` multipart field `file` (jpg/png/webp/svg/gif, <=5MB) -> `{id,url,filename,mimeType,size}` · `GET /admin/media` · `DELETE /admin/media/:id`
  Validation errors: `400 {error, details}`. Every mutation invalidates nothing server-side; the client invalidates TanStack queries (`['page',key]`, `['services',...]`, `['site']`...) so public pages update immediately.

## Prisma models (server/prisma/schema.prisma)

User, PageSection(page,key,content Json,order,visible, @@unique[page,key]), Service, Testimonial, TeamMember, Faq, Post, Lead(status NEW|CONTACTED), Media, SiteSettings (single row id=1).

## Server notes (implemented)

- Per-page SEO lives in `SiteSettings.seo.pages[pageKey]` (`PageSeed.seo` is written there by the seed); `GET /pages/:page` returns `seo.default` merged with it; `PUT /admin/settings` accepts `seo:{default,pages}`.
- Seed: `npm run db:seed` never overwrites edits; `-- --reset` restores Figma content. Drop images in `server/seed-media/` -> served at `/uploads/seed/<name>.webp` (png/jpg converted; svg copied unchanged).
- `PageSeed` type: `server/prisma/seed-data/types.ts`. Page files `seed-data/<page>.ts` default-export a `PageSeed` and are auto-discovered.
- Env: `COOKIE_SECURE` optional (default = production). Health: `GET /api/health`.

## Auth v2 (2FA + managed accounts, no email anywhere)

Login is a multi-step flow. Steps before the final one return a short-lived (5 min) signed **preAuthToken** in JSON (never a cookie, grants nothing else).

- `POST /auth/login {email,password}` -> `{preAuthToken, next}` where `next` is `change-password` (user.mustChangePassword) | `setup-2fa` (no TOTP yet) | `verify-code`. Wrong credentials: 401 generic error. Deactivated users cannot log in. No session cookie yet.
- `POST /auth/pre/change-password {preAuthToken,newPassword}` -> `{preAuthToken,next}`. min 12 chars, strength check, must differ from the temporary password. Clears mustChangePassword, bumps sessionVersion.
- `POST /auth/pre/2fa/setup {preAuthToken}` -> `{manualKey, otpauthUrl, qrDataUrl}` (secret stored AES-256-GCM encrypted as pending, never returned again after this call).
- `POST /auth/pre/2fa/enable {preAuthToken,code}` -> sets the session cookie, returns `{user, backupCodes:string[10]}` (shown once, bcrypt-hashed at rest, single use).
- `POST /auth/pre/verify {preAuthToken, code}` or `{preAuthToken, backupCode}` -> sets the session cookie, `{user}`. 5 failed attempts per preAuthToken then the account is locked 15 min (DB-backed). A TOTP code cannot be reused within its window.
- `POST /auth/logout` · `GET /auth/me` -> `{user}` (user: id,email,name,role) or 401. Session JWT carries `sv` (sessionVersion); the middleware rejects it when it differs from the user row or the user is inactive.
  Authenticated (any role): `GET /admin/security` -> `{totpEnabled, backupCodesRemaining}` · `POST /admin/security/backup-codes {code}` -> `{backupCodes}` (replaces old ones) · `POST /admin/security/change-password {currentPassword,newPassword,code}` -> `{ok:true}` (bumps sessionVersion, re-issues the cookie).
  ADMIN only: `GET /admin/audit?page=&limit=&action=` -> `{items:[{id,userId,email,action,success,ip,meta,createdAt}],total}`; users: `GET /admin/users` (user rows add `active, mustChangePassword, totpEnabled, lastLoginAt`), `POST /admin/users {name,email,role}` -> `{user, temporaryPassword}` (shown once), `PUT /admin/users/:id {name?,role?}`, `POST /admin/users/:id/reset-password` -> `{temporaryPassword}` (sets mustChangePassword, bumps sessionVersion), `POST /admin/users/:id/reset-2fa` (clears TOTP + backup codes, bumps sessionVersion), `POST /admin/users/:id/deactivate` and `/activate`, `DELETE /admin/users/:id`. Guards: nobody can delete/demote/deactivate themselves; the last active ADMIN cannot be deleted/demoted/deactivated.
  Audit actions: login.password.ok/fail, login.2fa.ok/fail, 2fa.enabled, 2fa.backup.used, 2fa.backup.regenerated, password.changed, user.created/updated/deleted/deactivated/activated, user.password.reset, user.2fa.reset, session.logout.
