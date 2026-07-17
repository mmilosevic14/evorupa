# Chat Handoff - EvoRupa

Use this file when opening a new chat with this folder.

## Current State

- Next.js 15.5.20 + TypeScript full-featured app.
- Supabase integration: auth (login/signup), reports CRUD, real-time updates.
- Interactive Leaflet map with Serbia district/settlement filters, place grouping, popup resizing, print layout.
- Report submission with photo upload and image processing.
- Admin page with admin-gating (`lib/adminAccess.ts`).
- Serbia settlements data: `data/serbia-settlements-full.json` (81k entries), geo utilities in `lib/serbiaGeo.ts` and `lib/serbiaDistricts.ts`.
- Homepage shows place groups and open reports.
- Pagination for reported problems on the map page.
- Automated test coverage: 19 tests across 5 test files (vitest).
- Cloudflare Pages CI/CD via `@opennextjs/cloudflare` — builds to `.open-next/assets`.
- Supabase database workflow is now scaffolded under `supabase/`.

## Build System

The app uses `@opennextjs/cloudflare` (NOT the deprecated `@cloudflare/next-on-pages`).

- **Do NOT** add `export const runtime = 'edge'` to page files — it is incompatible with OpenNext/Cloudflare.
- Build command: `npm run build:cf` (runs `scripts/build-cloudflare.js` → `opennextjs-cloudflare build`)
- Output: `.open-next/assets`
- Config: `open-next.config.ts` and `wrangler.toml`

## Recent Failure Pattern

- The July 2026 "Cloudflare is not building new commits" incident was actually a GitHub Actions failure at `npm ci`, not a Cloudflare source-build issue.
- Production deploys come from GitHub Actions uploading `.pages-deploy` with Wrangler, so if CI never reaches the build step, Cloudflare has nothing new to publish.
- Local Wrangler failures on this workstation can be misleading because they may be caused by local TLS or proxy issues even while GitHub-hosted deploys are healthy.

## Critical Files

- `app/map/MapPageClient.tsx` — interactive map with filters
- `app/report/ReportPageClient.tsx` — report submission form
- `app/admin/AdminPageClient.tsx` — admin moderation
- `lib/serbiaGeo.ts`, `lib/serbiaDistricts.ts` — Serbia geo utilities
- `lib/reportLocation.ts` — place labeling and grouping
- `lib/adminAccess.ts` — admin access gating
- `lib/reportImageProcessing.ts` — image optimization
- `data/serbia-settlements-full.json` — full settlements dataset
- `.github/workflows/cloudflare-pages.yml` — CI (Node 22, npm ci)
- `open-next.config.ts`, `wrangler.toml` — Cloudflare config
- `scripts/build-cloudflare.js` — build wrapper
- `supabase/migrations/` — canonical Supabase schema migrations
- `supabase/seed.sql` — lightweight local Supabase seed
- `supabase/manual/` — one-off operational SQL

## Local Secret Files

- `.env.local` (Supabase values)
- `.env.cloudflare.local` (Cloudflare values)

Both are git-ignored and should not be committed.

## What is Already Automated

- CI build on pull requests and pushes (type-check, lint, test, build:cf)
- Deploy to Cloudflare Pages on push to main/master through GitHub Actions + Wrangler artifact deploy
- Helper script for syncing Cloudflare secrets to GitHub

## First Commands in New Chat

```bash
npm ci
npm run type-check
npm run lint
npm test
npm run build:cf
```

If a push does not appear in production, check in this order:

1. Latest GitHub Actions run for `.github/workflows/cloudflare-pages.yml`
2. `Install dependencies` step and uploaded `npm-debug-logs-run-*` artifact
3. Whether the commit ever produced `.pages-deploy`
4. Cloudflare deployment records for the same commit hash

For database work:

```bash
supabase db reset
supabase db push
```

## Operational Steps (Supabase + Cloudflare)

1. Confirm pending schema work is represented in `supabase/migrations/`.
2. Confirm the linked environment has applied pending migrations.
2. Confirm Supabase Auth URL configuration includes deployed Cloudflare domain.
3. Confirm GitHub secrets exist:
   - CLOUDFLARE_ACCOUNT_ID
   - CLOUDFLARE_API_TOKEN
4. Push to main/master and verify workflow success.

## Suggested Prompt for Next Chat

"Read CHAT_HANDOFF.md and continue implementation from current state. All core features are implemented and Cloudflare build is working. Focus on UX improvements, additional test coverage, or new feature requests."
