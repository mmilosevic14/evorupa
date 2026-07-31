# EvoRupa — Codebase Guide & Guardrails

> **Purpose.** This document is the single authoritative reference for every piece of the EvoRupa application. It is intended to be read by AI agents, new contributors, and anyone making changes so that functionality is never accidentally broken or silently removed.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Repository Layout](#3-repository-layout)
4. [Database Schema](#4-database-schema)
5. [Configuration & Environment Variables](#5-configuration--environment-variables)
6. [Application Routes](#6-application-routes)
   - 6.1 [Root layout (`app/layout.tsx`)](#61-root-layout-applayouttsx)
   - 6.2 [Home page (`app/page.tsx`)](#62-home-page-apppagetsx)
   - 6.3 [Map page (`app/map/`)](#63-map-page-appmap)
   - 6.4 [Report page (`app/report/`)](#64-report-page-appreport)
   - 6.5 [Account page (`app/account/`)](#65-account-page-appaccount)
   - 6.6 [Admin page (`app/admin/`)](#66-admin-page-appadmin)
   - 6.7 [Auth routes (`app/auth/`)](#67-auth-routes-appauth)
   - 6.8 [API routes (`app/api/`)](#68-api-routes-appapi)
   - 6.9 [SEO helpers (`robots.ts`, `sitemap.ts`)](#69-seo-helpers-robotsts-sitemapsts)
   - 6.10 [`not-found.tsx`](#610-not-foundtsx)
7. [Middleware](#7-middleware)
8. [Components](#8-components)
   - 8.1 [`AppNavLinks`](#81-appnavlinks)
   - 8.2 [`AppShareQr`](#82-appsshareqr)
   - 8.3 [`ClientCacheReset`](#83-clientcachereset)
   - 8.4 [`ConsentManager`](#84-consentmanager)
   - 8.5 [`MapComponent`](#85-mapcomponent)
   - 8.6 [`PwaInstallPrompt`](#86-pwainstallprompt)
   - 8.7 [`ReportLocationPickerMap`](#87-reportlocationpickermap)
   - 8.8 [`ReportViewsTracker`](#88-reportviewstracker)
   - 8.9 [`ShareButton`](#89-sharebutton)
   - 8.10 [`admin/ModerationPlaceholder`](#810-adminmoderationplaceholder)
9. [Library Modules (`lib/`)](#9-library-modules-lib)
   - 9.1 [`supabase.ts`](#91-supabsasts)
   - 9.2 [`supabaseConfig.ts`](#92-supabaseconfigts)
   - 9.3 [`store.ts`](#93-storets)
   - 9.4 [`consent.ts`](#94-consentts)
   - 9.5 [`adminAccess.ts`](#95-adminaccessts)
   - 9.6 [`reportLocation.ts`](#96-reportlocationts)
   - 9.7 [`reportMetadata.ts`](#97-reportmetadatats)
   - 9.8 [`reportAuthors.ts`](#98-reportauthorsts)
   - 9.9 [`reportMedia.ts`](#99-reportmediats)
   - 9.10 [`reportEngagement.ts`](#910-reportengagementts)
   - 9.11 [`reportImageProcessing.ts`](#911-reportimageprocessingts)
   - 9.12 [`serbiaGeo.ts`](#912-serbiaGeots)
   - 9.13 [`serbiaDistricts.ts`](#913-serbiadistrictsts)
   - 9.14 [`mapFocus.ts`](#914-mapfocusts)
   - 9.15 [`cities.ts`](#915-citiests)
   - 9.16 [`usePwaInstall.ts`](#916-usepwainstallts)
10. [Utilities (`utils/supabase/`)](#10-utilities-utilssupabase)
    - 10.1 [`client.ts`](#101-clientts)
    - 10.2 [`server.ts`](#102-serverts)
    - 10.3 [`profile.ts`](#103-profilets)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
    - 11.1 [Report submission flow](#111-report-submission-flow)
    - 11.2 [Authentication flow](#112-authentication-flow)
    - 11.3 [Map/report viewing flow](#113-mapreport-viewing-flow)
12. [Guardrails — Critical Invariants](#12-guardrails--critical-invariants)
    - 12.1 [Authentication & session invariants](#121-authentication--session-invariants)
    - 12.2 [Location tagging invariants](#122-location-tagging-invariants)
    - 12.3 [Image processing invariants](#123-image-processing-invariants)
    - 12.4 [Engagement (views/upvotes) invariants](#124-engagement-viewsupvotes-invariants)
    - 12.5 [Consent & GTM invariants](#125-consent--gtm-invariants)
    - 12.6 [Admin access invariants](#126-admin-access-invariants)
    - 12.7 [PWA/cache invariants](#127-pwacache-invariants)
    - 12.8 [Supabase config invariants](#128-supabase-config-invariants)
    - 12.9 [Deployment invariants](#129-deployment-invariants)
13. [Testing](#13-testing)
14. [Build & Deployment](#14-build--deployment)

---

## 1. Project Overview

**EvoRupa** (Serbian: "Evo Rupe" — "Here's a pothole") is a civic-technology Progressive Web App (PWA) for reporting road defects and infrastructure problems across Serbia. Citizens photograph a problem, pin it on an OpenStreetMap-based map with automatic reverse-geocoding, and submit a report that is stored in Supabase and immediately visible to everyone on the public map.

Key characteristics:
- **Public read / authenticated write**: anyone can view the map; only logged-in users can submit reports or upvote.
- **Server-side rendering + client islands**: Next.js App Router. Leaflet maps are loaded dynamically (no SSR) to avoid DOM conflicts.
- **Deployed to Cloudflare Pages** via OpenNext adapter. GitHub Actions is the only authoritative deploy path.
- **Supabase** handles authentication (email/password + Google OAuth), database (PostgreSQL), and storage (photos).
- **PWA**: installable on Android and iOS. Service worker is registered by `next-pwa`.
- **GTM** (ID `GTM-54BV9VPG`) is loaded only after the user explicitly accepts the consent banner.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, `force-dynamic` by default) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Database / Auth | Supabase (PostgreSQL + GoTrue) |
| Supabase JS SDK | `@supabase/supabase-js` v2, `@supabase/ssr` v0.10 |
| Maps | Leaflet 1.9 + `react-leaflet` 4 (main map), pure Leaflet (picker map) |
| State management | Zustand v4 (in-memory, non-persisted) |
| QR code | `qrcode` v1.5 |
| PWA | `next-pwa` v5 (Workbox, service worker in `public/`) |
| Testing | Vitest v4 |
| Cloudflare adapter | `@opennextjs/cloudflare` v1 |
| Deployment target | Cloudflare Pages (`evorupa` project) |
| Analytics | Google Tag Manager `GTM-54BV9VPG` (opt-in only) |

---

## 3. Repository Layout

```
evorupa/
├── app/                    # Next.js App Router pages & API routes
│   ├── layout.tsx          # Root layout (nav, consent, PWA, GTM noscript)
│   ├── page.tsx            # Home page (server component)
│   ├── not-found.tsx       # 404 page
│   ├── robots.ts           # robots.txt generator
│   ├── sitemap.ts          # sitemap.xml generator
│   ├── globals.css         # Global Tailwind CSS
│   ├── map/                # Map page (client component island)
│   ├── report/             # Report submission page (client component island)
│   ├── account/            # User account / my reports page
│   ├── admin/              # Admin panel (server-gated by is_admin)
│   ├── auth/
│   │   ├── callback/       # OAuth/email callback handler (route.ts)
│   │   ├── login/          # Login page
│   │   └── signup/         # Signup page
│   └── api/
│       ├── cities/         # City lookup API  GET /api/cities/[country]/[region]
│       └── reverse-geocode/ # Coordinate → place name  GET /api/reverse-geocode
├── components/             # Shared React components
│   ├── admin/              # Admin-only components
│   └── ...
├── lib/                    # Pure logic, no React
├── utils/
│   └── supabase/           # Supabase client factories + profile sync
├── data/                   # Static JSON (district GeoJSON)
├── types/                  # Shared TypeScript types
├── tests/                  # Vitest unit tests
├── scripts/                # Node/PowerShell build & data scripts
├── supabase/               # Supabase migration SQL files
├── migration/              # One-off migration scripts
├── public/                 # Static assets (icons, manifest, SW, etc.)
├── middleware.ts            # Edge middleware (OAuth code redirect)
├── next.config.ts           # Next.js + next-pwa config
├── tailwind.config.ts       # Design tokens
├── wrangler.jsonc           # Cloudflare Pages config
└── wrangler.worker.toml     # Cloudflare Worker config (alternate deploy)
```

---

## 4. Database Schema

All tables live in the Supabase project `hjbvdtaeqqlyabmklrmg` (migrated July 2026).

### `reports`
Primary data table.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Auto-generated |
| `user_id` | `uuid` FK→`users.id` | Report author |
| `title` | `text` | Short description |
| `description` | `text` | Long description |
| `category` | `text` | See `report_categories.code` |
| `latitude` | `float8` | WGS-84 |
| `longitude` | `float8` | WGS-84 |
| `photo_url` | `text?` | Public URL (Supabase storage or null) |
| `photo_path` | `text?` | Storage path (for deletion) |
| `photo_object_id` | `text?` | Storage object ID |
| `status` | `enum` | `pending \| in_progress \| resolved \| rejected` |
| `priority` | `text?` | `low \| medium \| high` (derived from upvotes) |
| `tags` | `text[]?` | Location tags — see §9.6 |
| `upvotes` | `int4?` | Denormalized count |
| `views` | `int4?` | Denormalized count |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |
| `resolved_at` | `timestamptz?` | Set when status → resolved |

**⚠ Guardrail**: the `tags` array is the canonical source of location data (place name, municipality, district, region). Do NOT rename or remove the `tags` column without migrating all location parsing in `lib/reportLocation.ts`.

### `users`
Profile table (synced from Supabase Auth on every login).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Same as `auth.users.id` |
| `email` | `text` | May contain `migrating+<old-id>+<email>` during migration |
| `full_name` | `text?` | Shown only when `is_public = true` |
| `avatar_url` | `text?` | Currently unused |
| `role` | `enum` | `citizen \| deputy \| admin` |
| `is_public` | `bool` | Controls author name visibility |
| `is_admin` | `bool` | Explicit admin flag; checked alongside `role = 'admin'` |
| `picker_allowed` | `bool` | Reserved for future location picker permission |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**⚠ Guardrail**: admin detection checks `is_admin OR role = 'admin' OR user_metadata.is_admin OR app_metadata.is_admin`. All four paths must be kept in sync in `lib/adminAccess.ts` and `components/AppNavLinks.tsx`.

### `report_categories`

| Column | Type |
|---|---|
| `code` | `text` PK |
| `label_sr` | `text` |
| `description` | `text?` |
| `sort_order` | `int4` |

Default values are embedded in `lib/reportMetadata.ts` (`DEFAULT_REPORT_CATEGORIES`) and used as fallback when the DB query fails.

### `report_statuses`

| Column | Type |
|---|---|
| `code` | `enum: pending\|in_progress\|resolved\|rejected` PK |
| `label_sr` | `text` |
| `description` | `text?` |
| `sort_order` | `int4` |

Default values embedded in `lib/reportMetadata.ts` (`DEFAULT_REPORT_STATUSES`).

### `report_upvotes`

| Column | Type |
|---|---|
| `report_id` | `uuid` FK→`reports.id` |
| `user_id` | `uuid` FK→`users.id` |
| `created_at` | `timestamptz` |

Managed entirely through the `toggle_report_upvote` RPC. Never mutate directly from the client.

### `settlements`
Serbian geographical settlements used for reverse geocoding.

| Column | Type |
|---|---|
| `id` | `uuid` PK |
| `name` | `text` |
| `municipality` | `text` |
| `district` | `text?` |
| `region` | `text` |
| `place_type` | `text` |
| `latitude` | `float8` |
| `longitude` | `float8` |

Loaded once and cached in `app/api/reverse-geocode/route.ts` (`cachedSettlements`).

### RPC Functions

| Function | Args | Returns | Purpose |
|---|---|---|---|
| `increment_report_views` | `report_ids: uuid[]` | void | Atomically increments `reports.views` |
| `toggle_report_upvote` | `p_report_id: uuid` | `{has_upvoted, priority, upvotes}[]` | Inserts or deletes from `report_upvotes`, updates `reports.priority` and `reports.upvotes` |

---

## 5. Configuration & Environment Variables

### Runtime environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (or fallback) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes (or fallback) | Supabase anon key |
| `SUPABASE_SESSION_DATABASE_URL` | Local dev | Direct Postgres URL for scripts |

**Fallback**: `lib/supabase-public-config.json` contains bundled URL and key used when env vars are absent. This allows the built Cloudflare Pages artifact to work without secrets injected at build time.

### `lib/supabase-public-config.json`

```json
{ "url": "...", "publishableKey": "..." }
```

**⚠ Guardrail**: this file ships in the production bundle. It must never contain private (service-role) keys — only the public anon key.

### GTM

GTM container ID `GTM-54BV9VPG` is hardcoded in `lib/consent.ts`. Do not add a second GTM snippet. Only change the constant if migrating containers.

### Cloudflare

- Primary Pages project: `evorupa`
- Legacy project: `gderupa`
- Deploy command: `npm run deploy:pages` → calls `build:pages` then `wrangler pages deploy .pages-deploy`
- Config files: `wrangler.jsonc` (Pages), `wrangler.worker.toml` (Worker alternative)

---

## 6. Application Routes

All pages use `export const dynamic = 'force-dynamic'` to prevent static caching and ensure fresh Supabase data.

### 6.1 Root layout (`app/layout.tsx`)

**Type**: Server Component  
**Runs on every page request.**

Responsibilities:
1. Reads the consent cookie (`evorupa-consent`) and parses it into `ConsentState`.
2. Renders the `<html lang="sr">` shell with full SEO metadata.
3. Renders the top navigation bar with `AppNavLinks`.
4. Mounts `ClientCacheReset` (runs once per device to clear stale SWs).
5. Mounts `PwaInstallPrompt` (globally, non-blocking).
6. Mounts `ConsentManager` with `initialConsent` prop from the cookie (SSR value avoids flash).
7. Renders the GTM `<noscript>` iframe **only** when `initialConsent === 'accepted'`.

**⚠ Guardrail**: GTM/analytics must never load before explicit user acceptance. The `<noscript>` iframe and `<Script>` tag in `ConsentManager` are both gated on consent. Do not add any third-party analytics outside this gate.

### 6.2 Home page (`app/page.tsx`)

**Type**: Async Server Component  
**Data fetching**: Three parallel Supabase queries at request time:
- `reports` — latest 100 reports, ordered by `created_at DESC`
- `users` — author profiles for those reports (filtered to `is_public = true`)
- `report_statuses` — for label map

Renders:
- Hero section with live stats (total reports, open reports, places with reports)
- "Kako funkcioniše" (how it works) section — static
- "Pregled prijava" (report overview) — top 6 places by report count + top 6 open reports
- `AppShareQr` — QR code widget
- `ReportViewsTracker` — fires view increments for visible reports
- GitHub community links section

**⚠ Guardrail**: the home page MUST display a nonzero "Ukupno prijava" count when the `reports` table has rows. If this becomes zero on production, it indicates a broken Supabase connection or wrong project ID. Check `lib/supabase-public-config.json` and env vars.

### 6.3 Map page (`app/map/`)

**Server shell** (`page.tsx`): trivial passthrough to `MapPageClient`, `force-dynamic`.  
**Client component** (`MapPageClient.tsx`): the main interactive feature of the app.

Responsibilities:
- Loads all reports from Supabase on mount (no server-side data).
- Loads `report_categories` and `report_statuses` from Supabase (falls back to defaults).
- Manages URL search params: `?report=<id>` (deep link to a specific report), `?place=<key>` (filter by place).
- Renders a three-panel layout: district list → place list → report list, with `MapComponent` in the center.
- Handles upvoting via `toggleReportUpvote` RPC (requires auth).
- Renders `ReportViewsTracker` when reports are shown.
- Deep-link resolution is coordinated through `lib/mapFocus.ts`.

**⚠ Guardrail**: `MapComponent` and `ReportLocationPickerMap` are loaded with `dynamic(..., { ssr: false })` because Leaflet requires `window`. Never remove the dynamic import or add `ssr: true`.

### 6.4 Report page (`app/report/`)

**Server shell** (`page.tsx`): trivial passthrough, `force-dynamic`.  
**Client component** (`ReportPageClient.tsx`): multi-step report submission form.

Features:
1. **Photo upload**: accepts JPEG/PNG/WEBP up to `MAX_IMAGE_BYTES` (15 MB). Client-side: extracts GPS EXIF, resizes to max 800 px, converts to WebP at quality 0.72, uploads to Supabase Storage.
2. **Location**: tries in order — browser geolocation → EXIF GPS → map click on `ReportLocationPickerMap`. Default is center of Serbia (44.0165, 21.0059).
3. **Reverse geocoding**: calls `/api/reverse-geocode?latitude=X&longitude=Y` to get place name, municipality, district, region.
4. **Location tags**: result is stored in `reports.tags` as structured prefixed strings via `buildLocationTags()`.
5. **Draft persistence**: form state is saved to `localStorage` under key `evorupa:report-draft` (excluding photo binary).
6. **Auth guard**: redirects to `/auth/login` if not authenticated.

**⚠ Guardrail**: the `tags` column encoding format (`place:`, `municipality:`, `district:`, `region:`, `placeType:`) is the contract between `ReportPageClient` and `lib/reportLocation.ts`. Any change to prefixes must be reflected in **both** `buildLocationTags` and `parseReportLocation`.

### 6.5 Account page (`app/account/`)

**Server shell** (`page.tsx`): trivial passthrough, `force-dynamic`.  
**Client component** (`AccountPageClient.tsx`).

Features:
- Loads the authenticated user's profile and reports on mount. Redirects to `/auth/login` if unauthenticated.
- Allows editing: full name, "show author name" toggle (`is_public`), password.
- Allows editing own reports: title, description, category, status.
- Password validation: 8+ chars, lowercase, uppercase, digit (enforced client-side with visual checklist).
- Calls `syncUserProfile` from `utils/supabase/profile.ts` to upsert the `users` row.

**⚠ Guardrail**: only the report author (`user_id = auth.uid()`) may edit a report. RLS must enforce this on the server side. The client mirrors this by only rendering edit controls for owned reports.

### 6.6 Admin page (`app/admin/`)

**Server component** (`page.tsx`): calls `getCurrentAdminState()` and renders an access-denied message for non-admins.  
**Client component** (`AdminPageClient.tsx`): currently a static placeholder with hardcoded zeros. The `ModerationPlaceholder` component describes planned moderation features.

**⚠ Guardrail**: the server-side admin gate in `page.tsx` must always remain. Never remove the `getCurrentAdminState()` check. The `AdminPageClient` is **not** a substitute for this gate.

### 6.7 Auth routes (`app/auth/`)

#### `/auth/callback/route.ts`
OAuth code-to-session exchange (PKCE). Handles:
- Error params → redirect to `/auth/login?error=…`
- Missing code → redirect to `next` path
- Successful exchange → `syncUserProfile` → redirect to `next` (default `/map`)

Cookies are applied to the redirect response.

#### `/auth/login/`
Server page shell + `LoginPageClient`. Supports:
- Email/password (`signInWithPassword`)
- Google OAuth (`signInWithOAuth` + redirect to `/auth/callback?next=/map`)
- Shows error from `?error` query param (set by callback on failure)

#### `/auth/signup/`
Server page shell + `SignupPageClient`. Email/password registration with optional `full_name`. On success shows an email-verification prompt. If a session is returned immediately (email confirmation disabled), calls `syncUserProfile`.

**⚠ Guardrail**: `syncUserProfile` must be called after every successful auth event (login, signup, OAuth callback) to ensure the `users` row exists. Missing profile rows break author name display and admin detection.

### 6.8 API routes (`app/api/`)

#### `GET /api/reverse-geocode?latitude=<lat>&longitude=<lng>`

Resolution order:
1. Look up nearest settlement in `settlements` Supabase table (result cached in module scope).
2. If no DB settlement found, fall back to Nominatim OSM API.
3. If Nominatim fails, fall back to embedded `EMBEDDED_SERBIA_SETTLEMENTS` constant.
4. Always overlay the district/region from `findSerbiaDistrictByPoint` (GeoJSON polygon lookup) when a match is found.

Returns: `{ placeName, placeType, municipality, district, region }`.

**⚠ Guardrail**: the DB settlement cache (`cachedSettlements`) is in module scope and is never invalidated during the lifetime of a Cloudflare Worker invocation. Re-deployments reset it. This is intentional for performance. Do not add TTL invalidation without measuring the impact.

#### `GET /api/cities/[[...location]]`

Returns a list of Serbian cities, optionally filtered by country/region path segments or query params.

- `/api/cities` → all cities
- `/api/cities/serbia` → cities in Serbia
- `/api/cities/serbia/vojvodina` → cities in Vojvodina
- Query params `?country=` and `?region=` work equivalently (conflict validation applied)

Returns: `{ country, region, count, cities: string[] }`.

### 6.9 SEO helpers (`robots.ts`, `sitemap.ts`)

Standard Next.js file-based metadata. Not critical to application functionality.

### 6.10 `not-found.tsx`

Standard 404 page.

---

## 7. Middleware

**File**: `middleware.ts`  
**Matcher**: all routes except `_next/static`, `_next/image`, `favicon.ico`.

Purpose: intercept requests that carry OAuth callback params (`?code=`, `?error=`, `?error_description=`) on a path other than `/auth/callback` and transparently redirect them to `/auth/callback` while preserving the `next` parameter.

This handles the case where Supabase redirects back to any page (not just `/auth/callback`) after OAuth.

**⚠ Guardrail**: the middleware must not call `createClient` or read cookies — it is intentionally lightweight. Session refresh is handled in the auth callback and in individual client components. Adding cookie-based session refresh here would conflict with the `@supabase/ssr` pattern.

---

## 8. Components

### 8.1 `AppNavLinks`

**Type**: `'use client'`  
**Used in**: root layout (every page)

Renders the navigation links. On mobile renders a hamburger menu.

State:
- `adminState: { isAdmin, isAuthenticated }` — loaded async from Supabase on mount. Subscribes to `onAuthStateChange` to re-evaluate on login/logout.
- `mobileMenuOpen` — hamburger toggle
- `showInstallHelp` — toggles iOS PWA install instructions

Nav items (authenticated only):
- `Mapa` → `/map`
- `Prijavi problem` → `/report`
- `Moj profil` → `/account` (only if `isAuthenticated`)
- `Admin` → `/admin` (only if `isAdmin`)
- Logout button

**⚠ Guardrail**: admin detection in the nav bar mirrors the logic in `lib/adminAccess.ts`. Both must be updated together. The nav bar check is client-side (UI only); the actual server-side gate is in `app/admin/page.tsx`.

### 8.2 `AppShareQr`

**Type**: `'use client'`  
**Used in**: home page

Generates a QR code for `https://evorupa.pages.dev/` using `qrcode` library. Renders the QR as a `<img>` element with a share button.

Cleanup: the `useEffect` sets an `ignore` flag to avoid calling `setState` after unmount.

### 8.3 `ClientCacheReset`

**Type**: `'use client'`  
**Used in**: root layout (every page)

Runs once per device. Checks `localStorage` for `evorupa-cache-reset-version`. If the stored version does not match the hardcoded constant `2026-07-17-supabase-project-cutover`:
1. Unregisters all service workers.
2. Deletes all cache storage keys.
3. Stores the version in localStorage.
4. Reloads the page once if anything changed.

This was added to recover devices stuck on the old Supabase project after the July 2026 migration.

**⚠ Guardrail**: do not change `CACHE_RESET_VERSION` unless you intend to force a cache flush on all users' devices. Only increment it when making breaking changes that require clearing old caches (e.g., another Supabase migration).

### 8.4 `ConsentManager`

**Type**: `'use client'`  
**Used in**: root layout

Props:
- `initialConsent: ConsentState` — from the `evorupa-consent` cookie (server-rendered, avoids flash)

Behavior:
- On mount, reconciles the cookie value against localStorage (handles case where cookie was reset but localStorage still has a value).
- When the user clicks "Prihvatam" (accept): writes the cookie (`Max-Age=15552000`, `SameSite=Lax`, `Secure`) and localStorage; loads the GTM script via `<Script strategy="afterInteractive">`.
- When the user clicks "Samo neophodni" (reject): writes the cookie and localStorage; does NOT load GTM.
- If consent is `null`: shows the consent banner.
- If consent is `'accepted'`: renders `<Script>` with the GTM loader.

**⚠ Guardrail**: never load GTM outside this component. The GTM `<noscript>` iframe in the layout is an edge-case fallback for no-JS environments and is also gated on `initialConsent === 'accepted'`.

### 8.5 `MapComponent`

**Type**: `'use client'`, loaded with `dynamic(..., { ssr: false })`  
**Used in**: `MapPageClient`

This is the most complex component in the codebase (~800 lines). It manages the full interactive Leaflet map.

Key functionality:
- Renders Serbia district boundaries as GeoJSON polygon layers.
- Renders report markers grouped by place. Clicking a place opens a popup with a list of reports for that place.
- Report markers use a custom Leaflet icon with severity colors.
- Supports controlled district selection, place selection, and report selection via props.
- Handles `PendingFocusRequest` to deep-link to a specific report (animate map to location, open popup).
- Uses `groupReportsByPlace` and district data from `lib/serbiaDistricts.ts`.
- Tile layer: OpenStreetMap (`tile.openstreetmap.org`).

**⚠ Guardrail**:
- Must always be imported with `dynamic(..., { ssr: false })`. Leaflet directly accesses `window` and `document` at import time.
- Do not upgrade `leaflet` or `react-leaflet` without testing marker icons — Leaflet's default icon resolution breaks in webpack/Next.js and requires the manual `mergeOptions` workaround at the top of the file.

### 8.6 `PwaInstallPrompt`

**Type**: `'use client'`  
**Used in**: root layout

Uses `usePwaInstall` hook. Shows a bottom sheet:
- On Android/Chrome: shows "Instaliraj" button that triggers the `beforeinstallprompt` event.
- On iOS/Safari: shows instructions for "Add to Home Screen".
- Dismiss is persisted in localStorage for 7 days (`evorupa:pwa-install-dismissed`).
- Hides immediately when the app is already running in standalone mode.

### 8.7 `ReportLocationPickerMap`

**Type**: `'use client'`, loaded with `dynamic(..., { ssr: false })`  
**Used in**: `ReportPageClient`

A minimal, self-contained Leaflet map for picking a GPS coordinate. Does not use `react-leaflet` — uses raw Leaflet API directly for performance and simplicity.

Props:
- `latitude`, `longitude` — controlled marker position
- `onPick(coords)` — callback fired when the user clicks the map

**⚠ Guardrail**: uses a `ref` for `onPick` to avoid re-creating the Leaflet click handler on every render. If you add new props that affect Leaflet behavior, be careful about the closure capture pattern — Leaflet event listeners do not automatically update like React event handlers.

### 8.8 `ReportViewsTracker`

**Type**: `'use client'`  
**Used in**: home page, map page, account page

A zero-rendering component that calls `increment_report_views` RPC when the set of visible `reportIds` changes.

Uses a `ref` (`lastSignatureRef`) to deduplicate calls: a tracking key + comma-joined IDs form a signature; the RPC is only called when the signature changes.

**⚠ Guardrail**: do not replace `lastSignatureRef` with `useState` — it must not trigger re-renders. The component renders `null`.

### 8.9 `ShareButton`

**Type**: `'use client'`

A button that:
1. Tries `navigator.share` (Web Share API — supported on mobile)
2. Falls back to `navigator.clipboard.writeText` (copies link)
3. Falls back to `window.open` in a new tab

Shows "Link kopiran" for 1800 ms after clipboard copy.

Props: `href`, `title`, `text?`, `label?`, `copiedLabel?`, `className?`, `stopPropagation?`, `onSuccess?`.

`toAbsoluteUrl` ensures relative paths are converted to absolute URLs before sharing.

### 8.10 `admin/ModerationPlaceholder`

**Type**: Server Component (no `'use client'`)  
**Used in**: `AdminPageClient`

Static placeholder describing planned moderation features. Renders three cards: "Čekanje na pregled", "Napomena moderatora", "Buduće akcije". No logic.

---

## 9. Library Modules (`lib/`)

### 9.1 `supabase.ts`

Re-exports `createServerClient` and `createBrowserClient` from `utils/supabase/`.

Defines all TypeScript types for the database schema:
- `Database` — full schema type
- `Report` — shorthand for `Database.public.Tables.reports.Row`
- `ReportInsert` — shorthand for insert type
- `User` — shorthand for users row

**⚠ Guardrail**: keep these types in sync with the actual Supabase schema. Any new column must be added here, otherwise TypeScript will allow incorrect queries.

### 9.2 `supabaseConfig.ts`

```ts
export function getSupabaseConfig() → { url, publishableKey }
```

Priority: `NEXT_PUBLIC_SUPABASE_URL` env var → `supabase-public-config.json` bundled fallback.

**⚠ Guardrail**: always use this function to get the Supabase URL and key. Never hardcode or inline them elsewhere. This ensures Cloudflare Pages builds (which may not have env vars at build time) still work.

### 9.3 `store.ts`

Two Zustand stores:

**`useReportStore`**
- `reports: Report[]` — current report list
- `selectedReport: Report | null`
- `setReports`, `setSelectedReport`, `addReport`

**`useUserStore`**
- `user: User | null`
- `isLoggedIn: boolean`
- `setUser`, `logout`

**⚠ Guardrail**: these stores are in-memory and not persisted. They reset on page reload. Do not store sensitive or large data here. Currently `useUserStore` is defined but not widely used (most auth state is read directly from Supabase in components). Be careful when adding new global state — prefer local component state unless truly shared.

### 9.4 `consent.ts`

```ts
export const CONSENT_COOKIE_NAME = 'evorupa-consent'
export const GTM_ID = 'GTM-54BV9VPG'
export type ConsentState = 'accepted' | 'rejected' | null
export function parseConsentState(value: string | undefined): ConsentState
```

**⚠ Guardrail**: `parseConsentState` accepts only the exact strings `'accepted'` and `'rejected'`. Any other value returns `null` (banner shown again). This is intentional for forward compatibility if new states are added.

### 9.5 `adminAccess.ts`

```ts
export async function getCurrentAdminState() → { user: User | null, isAdmin: boolean }
```

Server-only (uses `next/headers`). Reads the current auth session and checks:
1. `users.is_admin === true`
2. `users.role === 'admin'`
3. `user.user_metadata.is_admin === true`
4. `user.app_metadata.is_admin === true`

**⚠ Guardrail**: all four paths are intentional — different admin provisioning mechanisms (DB role, DB flag, JWT metadata) should all work. Do not simplify to a single check without verifying all admin users are covered.

### 9.6 `reportLocation.ts`

The most important data-encoding module. Location data is stored in `reports.tags` as an array of prefixed strings.

#### Tag format

```
place:<name>
placeType:<city|town|village|hamlet|suburb|municipality|county|unknown>
municipality:<name>
district:<name>
region:<name>
```

Example: `["place:Beograd", "placeType:city", "municipality:Beograd", "district:Grad Beograd", "region:Srbija"]`

#### Key exports

| Function | Purpose |
|---|---|
| `buildLocationTags(location)` | Encodes a `ReportLocationDetails` into the tags array |
| `parseReportLocation(tags)` | Decodes tags → `ReportLocationDetails` |
| `getReportPlaceLabel(report)` | Returns the display name: `placeName` → `municipality` → `lat,lng` |
| `groupReportsByPlace(reports, sort)` | Groups reports into `PlaceGroup[]` |
| `groupReportsByDistrict(reports, sort)` | Groups reports into `DistrictGroup[]` |
| `isOpenReport(report)` | `status !== 'resolved' && status !== 'rejected'` |

Sort modes: `'name-asc'` and `'report-count-desc'`.

**⚠ Guardrail**: tag prefix constants (`LOCATION_TAG_PREFIXES`) must never change because existing database rows encode location data using these exact strings. If you must rename a prefix, write a migration that updates all existing `tags` values.

Place grouping key format: `${label.toLowerCase()}|${municipality.toLowerCase()}|${district.toLowerCase()}`. This must remain stable because it is used in deep-link URL params (`?place=<key>`).

### 9.7 `reportMetadata.ts`

Manages report categories and statuses.

| Export | Purpose |
|---|---|
| `DEFAULT_REPORT_CATEGORIES` | Fallback categories when DB query fails |
| `DEFAULT_REPORT_STATUSES` | Fallback statuses when DB query fails |
| `buildCategoryLabelMap(categories?)` | Returns `{ code → label_sr }` map |
| `buildStatusLabelMap(statuses?)` | Returns `{ code → label_sr }` map |
| `derivePriorityFromUpvotes(upvotes)` | `< 5 → low`, `5–19 → medium`, `≥ 20 → high` |
| `sortCategories(categories)` | Sorts by `sort_order` ASC |
| `sortStatuses(statuses)` | Sorts by `sort_order` ASC |

**⚠ Guardrail**: `derivePriorityFromUpvotes` thresholds must match the server-side `toggle_report_upvote` RPC function logic. If the RPC changes the thresholds, update this function too.

### 9.8 `reportAuthors.ts`

Handles author name visibility.

```ts
buildVisibleAuthorMap(profiles: PublicAuthorProfile[]) → Map<userId, name>
getVisibleAuthorName(report, authorNames) → string | null
```

Only profiles with `is_public = true AND full_name != null` are included.

**⚠ Guardrail**: author name display is opt-in (`is_public`). Never show `full_name` unless `is_public = true`. This is enforced in both the query (selecting `is_public`) and in `buildVisibleAuthorMap`.

### 9.9 `reportMedia.ts`

```ts
export const LEGACY_DEFAULT_REPORT_PHOTO_URL = 'https://www.espreso.co.rs/...'
export const DEFAULT_REPORT_PHOTO_URL = '/default-report-photo.jpg'
export function getReportPhotoUrl(photoUrl?: string | null) → string
```

Returns the local fallback `/default-report-photo.jpg` when:
- `photoUrl` is null/undefined
- `photoUrl` is the old legacy external URL (from before local storage was used)

**⚠ Guardrail**: `LEGACY_DEFAULT_REPORT_PHOTO_URL` is kept to handle old database rows. Do not remove it.

### 9.10 `reportEngagement.ts`

```ts
incrementReportViews(supabase, reportIds: string[]) → Promise<void>
toggleReportUpvote(supabase, reportId: string) → Promise<ToggleUpvoteResult>
```

Both functions call Supabase RPC. The `supabase.rpc` call uses a type cast (`as unknown as RpcInvoker`) because the generated types don't fully cover generic RPC.

**⚠ Guardrail**: `incrementReportViews` is a fire-and-forget operation (errors are caught and logged by `ReportViewsTracker`). `toggleReportUpvote` throws on error and must be wrapped in a try/catch at the call site.

### 9.11 `reportImageProcessing.ts`

Constants and pure utility functions for client-side image processing in `ReportPageClient`.

| Export | Value | Purpose |
|---|---|---|
| `MAX_IMAGE_BYTES` | 15 MB | File size check before canvas processing |
| `MAX_IMAGE_DIMENSION` | 800 px | Max width/height after scaling |
| `WEBP_QUALITY` | 0.72 | Canvas `toBlob` quality parameter |
| `getCenteredSquareCrop(w, h)` | — | Returns `{sourceX, sourceY, sourceSize}` for center crop |
| `getScaledImageDimensions(w, h)` | — | Returns `{width, height}` scaled to fit within 800×800 |

**⚠ Guardrail**: these constants affect photo storage cost and quality. Increasing `MAX_IMAGE_BYTES` or `MAX_IMAGE_DIMENSION` will increase Supabase storage usage. `WEBP_QUALITY = 0.72` is a chosen balance; do not raise it without re-testing storage costs.

### 9.12 `serbiaGeo.ts`

Embedded list of Serbian settlements and Haversine distance calculation.

| Export | Purpose |
|---|---|
| `EMBEDDED_SERBIA_SETTLEMENTS` | ~25 major Serbian cities/towns (fallback when DB and Nominatim both fail) |
| `getDistanceInKilometers(lat1, lng1, lat2, lng2)` | Haversine formula |
| `findNearestSettlement(lat, lng, settlements)` | Returns closest settlement ≤ 50 km, or null |
| `settlementToLocationDetails(settlement)` | Converts to `ReportLocationDetails` |

**⚠ Guardrail**: `findNearestSettlement` has a hard 50 km cutoff. Coordinates outside Serbia (or very remote locations) will return `null`, causing fallback to Nominatim. Do not increase this threshold without considering mis-attribution at national borders.

### 9.13 `serbiaDistricts.ts`

Loads `data/serbia-districts.json` (GeoJSON MultiPolygon) and provides:

```ts
export const SERBIA_DISTRICT_BOUNDARIES: SerbiaDistrictBoundaryFeature[]
export function findSerbiaDistrictByPoint(lat, lng) → { district, region } | null
```

Point-in-polygon uses a ray casting algorithm on the GeoJSON coordinates.

**⚠ Guardrail**: `SERBIA_DISTRICT_BOUNDARIES` is computed at module load time from the static JSON file. The JSON file is in `data/` and is not fetched at runtime. If district boundaries need updating, replace `data/serbia-districts.json` and verify the `properties.name` field mapping.

### 9.14 `mapFocus.ts`

Manages the multi-step focus sequence for deep-linking to a specific report on the map:

```ts
getPendingFocusAction(request, districtKey, placeKey, reports) → 'wait' | 'select-place' | 'focus-report'
isPendingFocusReady(...) → boolean
```

The focus sequence has three phases:
1. `wait` — district not yet selected
2. `select-place` — district is selected, place needs to be selected
3. `focus-report` — both selected and report is in list → execute focus

**⚠ Guardrail**: `PendingFocusRequest` includes a `nonce` field to allow re-triggering a focus for the same report ID. Always increment the nonce when re-requesting focus for the same report.

### 9.15 `cities.ts`

Hardcoded catalog of 21 Serbian cities, grouped by region. Used only by the `/api/cities` endpoint.

`normalizeLocation(value)` strips diacritics (NFKD decomposition + strip combining marks) and lowercases/slugifies — used for case/accent-insensitive region matching.

### 9.16 `usePwaInstall.ts`

Custom hook that manages the PWA install prompt lifecycle:
- Listens for `beforeinstallprompt` (Android/Chrome)
- Detects standalone display mode (already installed)
- Detects iOS device (to show manual instruction hint)

Returns: `{ deferredPrompt, installed, showIosHint, promptToInstall }`.

**⚠ Guardrail**: `deferredPrompt.prompt()` can only be called from a user gesture (button click). Do not call it programmatically on mount or in a `useEffect`.

---

## 10. Utilities (`utils/supabase/`)

### 10.1 `client.ts`

```ts
export const createClient = () => createBrowserClient(url, key)
```

Used in any `'use client'` component that needs Supabase. Reads config from `getSupabaseConfig()`.

**⚠ Guardrail**: the browser client uses the **anon** (publishable) key only. It must never use a service-role key.

### 10.2 `server.ts`

```ts
export const createClient = async (cookieStore) → SupabaseClient
```

Used in Server Components and Route Handlers. Reads/writes cookies via `@supabase/ssr`'s `setAll`/`getAll` pattern.

**⚠ Guardrail**: the `setAll` inside a Server Component silently ignores errors (cookies cannot be set from a Server Component render — only from a middleware or Route Handler). This is by design per Supabase SSR docs.

### 10.3 `profile.ts`

```ts
export const syncUserProfile = async (supabase, user, options?) → void
```

Upserts a row in `public.users` with `id`, `email`, `full_name`, `role: 'citizen'`, and optionally `is_public`. Uses `onConflict: 'id'` to handle both new and existing users.

Called after: login, signup, Google OAuth callback.

**⚠ Guardrail**: `role` is always set to `'citizen'` during profile sync. Admin role elevation must be done manually in the Supabase dashboard or via migration SQL. Never allow client-controlled role escalation.

---

## 11. Data Flow Diagrams

### 11.1 Report submission flow

```
User fills form (ReportPageClient)
    │
    ├─ Photo selected
    │       ├─ Extract EXIF GPS → set latitude/longitude (source: 'photo')
    │       ├─ Resize to ≤800px → crop to square → convert to WebP
    │       └─ Upload to Supabase Storage (bucket: report-photos)
    │
    ├─ Browser geolocation requested → set latitude/longitude (source: 'browser')
    │
    ├─ Map click (ReportLocationPickerMap) → set latitude/longitude (source: 'map')
    │
    ├─ POST /api/reverse-geocode?latitude=X&longitude=Y
    │       ├─ Check DB settlements (cached)
    │       ├─ Fallback: Nominatim
    │       └─ Fallback: EMBEDDED_SERBIA_SETTLEMENTS
    │       → returns { placeName, placeType, municipality, district, region }
    │
    ├─ buildLocationTags({ placeName, placeType, municipality, district, region })
    │       → ["place:Beograd", "municipality:Beograd", ...]
    │
    └─ supabase.from('reports').insert({
            user_id, title, description, category,
            latitude, longitude, photo_url, photo_path,
            status: 'pending', tags: [...location tags]
        })
```

### 11.2 Authentication flow

```
Login page / Signup page
    │
    ├─ Email/password: supabase.auth.signInWithPassword / signUp
    │       └─ On success → syncUserProfile → window.location.href = '/map'
    │
    └─ Google OAuth: supabase.auth.signInWithOAuth
            └─ redirectTo: /auth/callback?next=/map
                    │
                    Supabase OAuth redirect
                    │
                    middleware.ts (intercepts ?code= on any path → /auth/callback)
                    │
                    /auth/callback/route.ts
                    ├─ exchangeCodeForSession
                    ├─ syncUserProfile
                    └─ redirect to `next` (/map)
```

### 11.3 Map/report viewing flow

```
User visits /map?report=<id>
    │
    MapPageClient mounts
    ├─ Load reports from supabase.from('reports').select('*')
    ├─ Load categories from report_categories
    ├─ Load statuses from report_statuses
    │
    ├─ Parse URL params: report=<id> → create PendingFocusRequest
    │
    ├─ MapComponent renders (after dynamic import resolves)
    │       ├─ Render district polygons
    │       └─ Render place markers
    │
    ├─ mapFocus state machine:
    │       phase 1: wait for district to be selected (matches report's district tag)
    │       phase 2: select-place (trigger place selection for report's place key)
    │       phase 3: focus-report (animate map, open popup)
    │
    └─ ReportViewsTracker fires increment_report_views RPC
```

---

## 12. Guardrails — Critical Invariants

These invariants must be preserved. Violating any of them silently breaks functionality.

### 12.1 Authentication & session invariants

- **Every successful login** (email, Google, token refresh) must call `syncUserProfile` to ensure the `public.users` row exists. Without this, author names and admin detection break.
- **Never store the Supabase service-role key** on the client or in `lib/supabase-public-config.json`. Only the anon key belongs there.
- **Middleware** must remain lightweight (no cookie writes, no DB calls). Session management is handled by the auth callback route.
- **OAuth redirect URL** must always point to `/auth/callback`. Do not change this without updating the Supabase dashboard's "Redirect URLs" allow-list.

### 12.2 Location tagging invariants

- **Tag prefix strings** (`place:`, `placeType:`, `municipality:`, `district:`, `region:`) are the serialization contract. They are stored in the database and decoded at read time. Never rename them.
- **`getReportPlaceLabel`** must remain the single source of truth for deriving a display name from a report. Always use it; never inline the fallback logic.
- **Place group keys** (used in `?place=` URL params) are derived deterministically from label, municipality, and district. Do not change the key format without handling bookmarked/shared URLs gracefully.

### 12.3 Image processing invariants

- **Max image dimension**: 800 px. Increasing this affects storage and page load performance.
- **WebP quality**: 0.72. Balance of quality vs. file size.
- **Max upload size**: 15 MB raw input (checked before canvas processing). The canvas output will be much smaller.
- **EXIF GPS extraction** is done client-side in `ReportPageClient` using a raw `DataView` parser. This deliberately avoids external libraries to reduce bundle size. Do not replace it without testing on real mobile photos.

### 12.4 Engagement (views/upvotes) invariants

- **`increment_report_views`** is fire-and-forget: errors are swallowed. This is intentional — view tracking failures must not affect the user experience.
- **`toggleReportUpvote`** returns the new state (`has_upvoted`, `upvotes`, `priority`) which must be reflected in the UI immediately without re-fetching all reports.
- **`ReportViewsTracker`** uses a `ref`-based deduplication signature. Do not replace the ref with state.
- **Upvoting requires authentication**: the component must check `isLoggedIn` before calling the RPC, and show a login prompt otherwise.

### 12.5 Consent & GTM invariants

- **GTM loads only after `'accepted'` consent**. The consent banner must be shown to new users.
- **Consent is stored in both a cookie and localStorage**. Cookie is read server-side (avoids flash on SSR). LocalStorage reconciles cases where the cookie was cleared.
- **The GTM noscript iframe** in the root layout is also gated on `initialConsent === 'accepted'`.
- **Cookie attributes**: `Max-Age=15552000` (180 days), `SameSite=Lax`, `Secure`. Do not downgrade `SameSite`.

### 12.6 Admin access invariants

- **Server-side gate**: `app/admin/page.tsx` always calls `getCurrentAdminState()` and returns an access-denied view for non-admins. This is the security gate.
- **Client-side nav**: `AppNavLinks` shows the "Admin" link only for admins, but this is UI-only and not a security boundary.
- **Four-path check**: `is_admin`, `role = 'admin'`, `user_metadata.is_admin`, `app_metadata.is_admin` are all checked. This supports different provisioning workflows.

### 12.7 PWA/cache invariants

- **`ClientCacheReset`** must remain in the root layout. Its version constant must only be changed when a forced cache flush is needed on all devices.
- **Service worker** is registered by `next-pwa` (Workbox). The `public/sw.js` and `public/workbox-*.js` files are generated at build time. Do not manually edit or commit them.
- **`PwaInstallPrompt`** dismissal is persisted for 7 days. The dismiss logic must check `installed` state to remove the dismiss key when the app is later installed.

### 12.8 Supabase config invariants

- **`getSupabaseConfig()`** is the single source for URL and key. It must be used everywhere — no hardcoded URLs or keys in other files.
- **`supabase-public-config.json`** is the build-time fallback. It must be kept up to date with the current Supabase project (`hjbvdtaeqqlyabmklrmg`).
- **`cachedSettlements` in `reverse-geocode/route.ts`** is a module-scope cache that persists for the lifetime of the Cloudflare Worker instance. It is correct to not invalidate it — the settlements table changes infrequently.

### 12.9 Deployment invariants

- **GitHub Actions is the only authoritative deploy path**. Cloudflare's native Git integration is disabled.
- **Build command**: `npm run build:pages` (calls `build:cf` then `prepare-pages-deploy.js`). Output: `.pages-deploy/`.
- **Pre-build test**: `npm run build` triggers `prebuild` which runs `vitest run`. Failing tests block deployment.
- **Post-deploy verification**: check that `https://evorupa.pages.dev/` returns HTTP 200 and shows a nonzero report count.
- **Node version**: 22 (`.nvmrc`). Do not change without a deliberate migration.

---

## 13. Testing

Tests live in `tests/` and use Vitest v4.

| Test file | What it covers |
|---|---|
| `reportLocation.test.ts` | Tag encoding/decoding, place grouping, district grouping, `isOpenReport`, `getReportPlaceLabel` |
| `reportMedia.test.ts` | `getReportPhotoUrl` (null, legacy URL, valid URL), `getScaledImageDimensions`, `MAX_IMAGE_DIMENSION`, `WEBP_QUALITY` |
| `reportEngagement.test.ts` | `incrementReportViews` (no-op on empty, correct RPC args), `toggleReportUpvote` (success and error paths) |
| `mapFocus.test.ts` | `getPendingFocusAction` state machine transitions, `isPendingFocusReady` |
| `cloudflarePagesBuild.test.ts` | Validates the `prepare-pages-deploy.js` script output structure |

Run with:
```bash
npm test           # vitest run (also runs before every build via prebuild hook)
npm run test:coverage  # coverage report
npm run test:watch     # interactive watch mode
```

**⚠ Guardrail**: do not remove or weaken existing tests. The `prebuild` hook runs `npm run test` before every `npm run build`, so failing tests block the entire build pipeline.

---

## 14. Build & Deployment

### Local development

```bash
. "$HOME/.nvm/nvm.sh" && nvm use   # Node 22
npm ci
npm run dev                         # Next.js dev server
```

### Type checking and linting

```bash
npm run type-check    # tsc --noEmit
npm run lint          # eslint .
```

### Production build (Cloudflare Pages)

```bash
npm run build:pages
# 1. npm run test                    (vitest run via prebuild)
# 2. next build                      (output: .next/)
# 3. node scripts/build-cloudflare.js  (OpenNext adapter → .open-next/)
# 4. node scripts/prepare-pages-deploy.js  (copies assets → .pages-deploy/)
```

### Deployment

```bash
npm run deploy:pages
# build:pages + wrangler pages deploy .pages-deploy --project-name evorupa
```

Or via GitHub Actions (preferred):
- Push to `main` triggers the workflow
- Deploys to both `evorupa` and `gderupa` projects

### Environment-specific notes

- **WSL Linux filesystem** is the preferred local environment (fastest, matches Cloudflare Linux shape)
- **Windows** works but produces an OpenNext compatibility warning
- **Cloudflare Worker (alternative)**: `npm run deploy:worker` — uses `wrangler.worker.toml` and the Worker runtime instead of Pages

### Verification after deploy

```bash
curl -I https://evorupa.pages.dev/
# Expect: HTTP/2 200

# Check Supabase connectivity: home page must show nonzero Ukupno prijava count
```
