# EvoRupa Architecture And Behavior Notes

This document is the current high-signal reference for how EvoRupa works today.

It exists for one practical reason: several parts of the application look simpler than they are. They encode migration constraints, browser/runtime workarounds, deployment assumptions, and data-shape contracts that can be broken by well-intentioned refactors. When that happens, the app may still compile while core behavior silently regresses.

Use this file before changing auth, map flow, report creation, analytics consent, media handling, or deployment.

Component-level companion references:

1. [components/README.md](./components/README.md)
2. [app/CLIENT_COMPONENTS.md](./app/CLIENT_COMPONENTS.md)
3. [lib/README.md](./lib/README.md)
4. [app/api/README.md](./app/api/README.md)
5. [docs/features/auth.md](./docs/features/auth.md)
6. [docs/features/map.md](./docs/features/map.md)
7. [docs/features/report-creation.md](./docs/features/report-creation.md)
8. [docs/features/deployment.md](./docs/features/deployment.md)

## 1. Product Shape

EvoRupa is a Next.js App Router application for reporting road and infrastructure problems in Serbia.

The app has five main responsibilities:

1. Authenticate users with Supabase Auth.
2. Let authenticated users submit reports with title, description, location, and optional photo.
3. Show reports on a Leaflet map with grouping by district and place.
4. Track lightweight engagement such as views and upvotes.
5. Deploy the same application to Cloudflare Pages using OpenNext advanced mode.

The current implementation is intentionally biased toward runtime correctness over aggressive static optimization.

## 2. Top-Level Runtime Model

### 2.1 Next.js App Router

The project uses the Next.js App Router under [app](./app).

Important routes:

1. [app/page.tsx](./app/page.tsx)
Landing page. Server-rendered. Loads recent reports, author visibility data, and status labels from Supabase.

2. [app/map/page.tsx](./app/map/page.tsx) and [app/map/MapPageClient.tsx](./app/map/MapPageClient.tsx)
Interactive map experience. Client-heavy and stateful. Handles real-time report updates, district and place grouping, report focus, view tracking, and upvotes.

3. [app/report/page.tsx](./app/report/page.tsx) and [app/report/ReportPageClient.tsx](./app/report/ReportPageClient.tsx)
Authenticated report creation flow. Handles location selection, EXIF GPS extraction, image processing, storage upload, and report insert.

4. [app/auth/login/page.tsx](./app/auth/login/page.tsx), [app/auth/signup/page.tsx](./app/auth/signup/page.tsx), and [app/auth/callback/route.ts](./app/auth/callback/route.ts)
OAuth entry and callback flow.

5. [app/admin/page.tsx](./app/admin/page.tsx)
Admin-only surface. Access is intentionally guarded by multiple admin signals because profile schema and auth metadata can drift during migrations.

6. [app/account/page.tsx](./app/account/page.tsx)
User account/profile route.

### 2.2 Dynamic Rendering Is Intentional

Several routes export `dynamic = 'force-dynamic'`.

This is not accidental. The app depends on live auth state, live report data, and request-scoped behavior. Removing these flags to chase static output or cache wins can introduce stale auth/UI behavior that only appears after deployment.

Current files using this pattern include:

1. [app/page.tsx](./app/page.tsx)
2. [app/map/page.tsx](./app/map/page.tsx)
3. [app/report/page.tsx](./app/report/page.tsx)
4. [app/account/page.tsx](./app/account/page.tsx)
5. [app/admin/page.tsx](./app/admin/page.tsx)
6. [app/auth/login/page.tsx](./app/auth/login/page.tsx)
7. [app/auth/signup/page.tsx](./app/auth/signup/page.tsx)
8. [app/auth/callback/route.ts](./app/auth/callback/route.ts)

If you plan to change rendering strategy, treat it as an architectural change, not a cleanup.

## 3. Application Shell

The root shell lives in [app/layout.tsx](./app/layout.tsx).

This file is more than branding and navigation. It also owns:

1. Global metadata.
2. Leaflet CSS loading.
3. Server-side consent bootstrap.
4. Conditional GTM `noscript` rendering.
5. PWA install prompt wiring.
6. One-time client cache reset wiring.

### Why the shell reads consent on the server

The layout reads the consent cookie via `cookies()` and passes `initialConsent` into [components/ConsentManager.tsx](./components/ConsentManager.tsx).

This exists so the first HTML response already matches the consent state. Without that server read, the browser could briefly render analytics-disabled markup and then inject GTM after hydration, or worse, briefly render a banner for a user who has already made a choice.

### Why the `noscript` GTM iframe is conditional

The `noscript` iframe is rendered only when consent is already accepted.

This is a deliberate privacy boundary. The app currently uses app-level gating, not Google Consent Mode. If analytics is rejected, GTM is not rendered at all. Do not add a second unconditional GTM snippet elsewhere in the tree.

## 4. Supabase Configuration Model

Supabase configuration is centralized in [lib/supabaseConfig.ts](./lib/supabaseConfig.ts).

It resolves the public URL and publishable key from:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. The fallback bundle [lib/supabase-public-config.json](./lib/supabase-public-config.json)

### Why there is a bundled public config fallback

This app must still be able to build and run in some environments where public env injection is incomplete or intentionally omitted. The fallback bundle keeps the client bootstrap deterministic.

This is safe only because the bundled values are public client values, not service-role secrets.

### Migration context that affects this decision

The repository was migrated from Supabase project `wqnrywhafxutgginzbvk` to `hjbvdtaeqqlyabmklrmg` in July 2026.

That migration matters because stale caches, stale public URLs, or stale stored asset references can surface as auth, profile, or image issues even when application code is correct.

When changing Supabase project identity in the future, update all of these together:

1. [lib/supabase-public-config.json](./lib/supabase-public-config.json)
2. Environment configuration
3. Any migration documentation
4. [components/ClientCacheReset.tsx](./components/ClientCacheReset.tsx) version constant if old service workers or caches must be invalidated

## 5. Supabase Client Creation

There are two app-level wrappers:

1. [utils/supabase/server.ts](./utils/supabase/server.ts)
2. [utils/supabase/client.ts](./utils/supabase/client.ts)

These wrappers exist to guarantee that every code path uses the same public config source.

### Server client

The server wrapper uses `createServerClient` from `@supabase/ssr` and forwards the Next cookie store.

Important detail: the `setAll` implementation catches errors when called from a Server Component context. That catch is intentional. Server Component execution does not always allow mutating cookies directly, and this wrapper avoids turning that mismatch into a runtime crash.

### Browser client

The browser wrapper uses `createBrowserClient` from `@supabase/ssr` and the same config source.

Do not create ad hoc clients in random components with duplicated env lookups unless you are intentionally changing bootstrap behavior.

## 6. Auth Flow

Auth behavior is spread across three files that must be considered together:

1. [middleware.ts](./middleware.ts)
2. [app/auth/callback/route.ts](./app/auth/callback/route.ts)
3. [utils/supabase/profile.ts](./utils/supabase/profile.ts)

### 6.1 Why the middleware rewrites OAuth returns

The middleware intercepts requests that contain OAuth query params such as `code`, `error`, or `error_description` when the request is not already targeting `/auth/callback`.

It then redirects to the callback route and preserves the original destination through the `next` query parameter.

This exists because users can start auth from different parts of the app and return with provider query params attached to arbitrary routes. Centralizing the code exchange in one callback route avoids duplicating auth finalization logic across pages.

If this redirect logic is removed, OAuth may appear to work from some routes and fail or strand users on others.

### 6.2 Why the callback route manages cookies manually

The callback route stores `cookiesToSet` and reapplies them on the final redirect response.

That extra work is intentional. Supabase session exchange can mutate cookies while the route still needs to decide between an error redirect and a success redirect. The code preserves those cookie mutations across either branch.

### 6.3 Why profile sync runs after session exchange

After `exchangeCodeForSession`, the route calls `syncUserProfile()` if an auth user is present.

That call keeps the `public.users` row in sync with the auth identity. The reporting, author display, and admin logic all depend on a usable row in that table.

This sync currently fails open with `.catch(() => undefined)`. That is a deliberate tradeoff: a transient profile-table problem should not fully block sign-in. If you tighten this, do it knowingly and consider the user impact.

## 7. Admin Access Model

Admin state is resolved in [lib/adminAccess.ts](./lib/adminAccess.ts).

The current check returns `true` if any of the following are true:

1. `users.is_admin`
2. `users.role === 'admin'`
3. `user.user_metadata.is_admin === true`
4. `user.app_metadata.is_admin === true`

### Why admin is checked in four places

This is not redundant code. It is resilience against migration and state drift.

During schema changes or identity migrations, some admin signals may update before others. The current behavior prefers continuity of valid admin access over strict reliance on a single source of truth that may temporarily lag.

If you want to simplify this, first prove that all admin state is canonicalized in one place for both existing and migrated users.

## 8. Consent And Analytics Model

Consent constants live in [lib/consent.ts](./lib/consent.ts). Runtime behavior lives in [components/ConsentManager.tsx](./components/ConsentManager.tsx).

The current consent states are:

1. `accepted`
2. `rejected`
3. `null`

### Why consent is stored in both cookie and localStorage

The cookie exists so the server layout can render the correct initial markup.

`localStorage` exists so the client can recover from situations where a browser keeps local state but loses the cookie, or where the client must restore and re-persist a known decision after hydration.

### Why GTM loads only on `accepted`

The app currently follows a strict rule:

1. `accepted`: inject GTM script and server-side `noscript` iframe.
2. `rejected`: do not inject GTM at all.
3. `null`: show the consent banner.

This is different from a Google Consent Mode integration where GTM might always load and then receive consent-state events. Do not mix the two patterns casually.

If the app later adopts Consent Mode, document the migration clearly and remove the old assumptions instead of layering both models together.

## 9. One-Time Client Cache Reset

The cache reset logic lives in [components/ClientCacheReset.tsx](./components/ClientCacheReset.tsx).

### Why this component exists

It was added to recover browsers from the July 2026 Supabase cutover. Old service workers and caches could keep serving stale assets or stale project references after the backend migration.

### How it works

1. Reads a version key from `localStorage`.
2. If the stored version is current, it does nothing.
3. Otherwise it unregisters all service workers.
4. Deletes all Cache Storage entries.
5. Saves the new version.
6. Reloads if anything changed.

### Why this should not be removed as dead code without review

The component can look like a temporary hack, but it protects against a known class of broken-client states. Removing it may reintroduce hard-to-reproduce production issues on previously used devices.

If you retire it, first prove that all users have naturally rotated onto clean assets and no old service worker path remains in the wild.

## 10. Home Page Data Model

The landing page logic in [app/page.tsx](./app/page.tsx) does more than render marketing content.

It:

1. Loads recent reports.
2. Resolves visible author names.
3. Loads localized status labels.
4. Computes open-report counts.
5. Groups reports by place.
6. Renders featured reports and featured places.

### Why this happens on the server

This keeps the landing page fast to first content and avoids duplicating simple aggregate logic into an extra client fetch cycle. It also keeps the public home page useful even before hydration finishes.

### Why author names are filtered

Author display goes through [lib/reportAuthors.ts](./lib/reportAuthors.ts). A report author should be shown only when the corresponding user row is public.

Do not replace this with direct `full_name` rendering from report-related user lookups unless you also preserve the privacy contract.

## 11. Report Location Contract

Location-tag behavior is centralized in [lib/reportLocation.ts](./lib/reportLocation.ts).

This file defines a compact but important data contract: report location metadata is encoded into `reports.tags` using fixed string prefixes.

Current prefixes:

1. `place:`
2. `placeType:`
3. `municipality:`
4. `district:`
5. `region:`

### Why tags are normalized before storage

`normalizeTagValue()` trims whitespace, replaces `|` with `/`, and collapses repeated spaces.

This protects grouping keys from accidental divergence caused by formatting variation.

### Why changing tag prefixes is dangerous

These prefixes are not just view helpers. They are part of the persisted meaning of historical report rows.

The map page, home page, and any grouping/filtering logic depend on them. If you rename a prefix without migrating existing report rows, the UI will silently stop grouping old reports correctly.

### Why Serbian collation is used

The file uses `Intl.Collator('sr', ...)` so grouped location lists sort in a way that is natural for Serbian text.

This should not be replaced with plain `localeCompare()` defaults unless you intentionally accept different ordering behavior.

## 12. Report Creation Flow

The report creation behavior lives mainly in [app/report/ReportPageClient.tsx](./app/report/ReportPageClient.tsx).

This route does much more than submit a form.

### 12.1 Location precedence

The report page intentionally works with multiple location sources:

1. Default Serbia center.
2. Browser geolocation.
3. Photo EXIF GPS.
4. Manual map selection.

This is a resilience strategy. Users may deny geolocation, upload photos without GPS metadata, or manually correct an imprecise reading.

### 12.2 Why EXIF parsing is implemented locally

The form extracts JPEG EXIF GPS coordinates in the browser before upload.

This exists so a user can take a photo on a device that embeds GPS metadata and get a useful location without additional typing. It also avoids round-tripping the file to a server just to discover coordinates.

### 12.3 Draft persistence

Draft state is stored in `localStorage` under `evorupa:report-draft`.

This prevents losing work when a user refreshes the page, navigates accidentally, or temporarily leaves the flow.

There is no server-side draft system. Do not remove this local persistence casually unless you replace the reliability it currently provides.

### 12.4 Why image processing happens before upload

Image constraints are defined in [lib/reportImageProcessing.ts](./lib/reportImageProcessing.ts).

The current flow resizes/crops/compresses client-side before upload so that:

1. Uploads are smaller.
2. Public rendering is more predictable.
3. Storage usage stays bounded.
4. The DB row can safely assume a WebP upload shape.

Current important limits include:

1. Maximum source size: 15 MB.
2. Maximum dimension: 800 px.
3. Output quality: 0.72 WebP.

### 12.5 Storage upload contract

Processed images are uploaded to the `report-photos` bucket.

The report row stores:

1. `photo_url`
2. `photo_path`
3. `photo_object_id`

This three-part storage model exists because operational cleanup and migration work may need the storage object identifier or path even if the public URL later changes.

### 12.6 Why `syncUserProfile()` runs before insert

The submit flow ensures the user profile row exists before inserting the report.

That keeps report ownership, author display, and later account/admin features consistent, especially for first-time sign-ins that have not yet touched profile state elsewhere.

## 13. Media Compatibility And Legacy Asset Handling

Media URL behavior lives in [lib/reportMedia.ts](./lib/reportMedia.ts).

### Why legacy photo URLs are special-cased

Some persisted rows may still reference assets from the previous Supabase project. The app detects legacy URLs and substitutes a safe fallback image instead of rendering broken media.

This protects the UI while cleanup or backfill work is still incomplete.

If you remove the legacy check before all historical assets are migrated, older reports can degrade visually without any database or runtime error.

## 14. Map Experience

The map experience is split across:

1. [app/map/MapPageClient.tsx](./app/map/MapPageClient.tsx)
2. [components/MapComponent.tsx](./components/MapComponent.tsx)
3. [lib/mapFocus.ts](./lib/mapFocus.ts)
4. [lib/reportLocation.ts](./lib/reportLocation.ts)

This is one of the most behavior-sensitive areas in the repository.

### 14.1 Why the map component is dynamically imported with `ssr: false`

Leaflet depends on browser APIs and DOM behavior. Rendering it on the server is not a useful goal here.

The dynamic import keeps the route stable and prevents server-side rendering mismatches.

### 14.2 Why map marker and popup handling is defensive

[components/MapComponent.tsx](./components/MapComponent.tsx) contains several functions such as:

1. `invalidateMapSize()`
2. `preserveMapViewport()`
3. `fitActiveMarkers()`
4. `ensureActiveMarkersVisible()`
5. `ensurePopupVisible()`
6. `scheduleFocusedPopupOpen()`

These exist because Leaflet popup and sizing behavior is timing-sensitive when:

1. The container height changes.
2. Fullscreen toggles.
3. Filtered markers change.
4. A popup is opened for a marker created on a previous render tick.

The repeated `requestAnimationFrame()` and delayed `setTimeout()` calls are deliberate. They wait for the DOM and Leaflet internals to settle before forcing a size recalculation or popup pan.

### 14.3 Why focused popup opening retries

The focused report flow may attempt to open a popup before the corresponding marker exists in the current layer tree. `scheduleFocusedPopupOpen()` retries a bounded number of times so deep links such as `/map?report=...` still work after the data and grouping state settle.

### 14.4 Why map focus is modeled as a small state machine

[lib/mapFocus.ts](./lib/mapFocus.ts) exposes `getPendingFocusAction()` and `isPendingFocusReady()`.

This logic ensures the app does not try to focus a report until all of these are aligned:

1. The correct district is selected.
2. The correct place is selected.
3. The target report is present in the filtered report set.

That ordering matters. If you collapse the steps into direct one-shot state updates, deep-link focusing becomes flaky and will fail intermittently depending on render timing.

### 14.5 Why grouping is place-first and district-aware

The map page groups reports by district and place so the user can browse dense clusters meaningfully instead of being dropped into a flat list of all reports.

This grouping depends on the location-tag contract described above. The map UI and the home page are coupled through that contract.

### 14.6 Why some map callbacks must stay stable

Marker rendering is sensitive to prop and callback churn. Recreating focus-related callbacks unnecessarily can force marker rebuilds at the wrong moment and make popups appear broken.

When refactoring the map page, treat callback identity as part of runtime behavior, not just a style issue.

## 15. Engagement Tracking

Engagement helpers live in [lib/reportEngagement.ts](./lib/reportEngagement.ts), and view tracking is triggered from [components/ReportViewsTracker.tsx](./components/ReportViewsTracker.tsx).

### Why views and upvotes use RPC functions

The app calls the database functions:

1. `increment_report_views(report_ids)`
2. `toggle_report_upvote(p_report_id)`

This is intentional. These mutations belong close to the database because they need consistent updates and should not rely on client-side multi-step logic.

### Why view tracking deduplicates by signature

The view tracker computes a signature from the tracking key and report IDs so that re-renders do not inflate counts for the same rendered set.

If you remove this, innocent React re-renders can distort metrics.

## 16. Real-Time Report Updates

The map page subscribes to Supabase realtime changes for the `reports` table.

This keeps the map view updated without full manual refresh.

Behaviorally, this means list ordering, marker sets, and grouping logic must tolerate inserts, updates, and deletes arriving after the initial load.

When changing report state shape, verify that the realtime update branches in [app/map/MapPageClient.tsx](./app/map/MapPageClient.tsx) still keep local state coherent.

## 17. Metadata And Labels

[lib/reportMetadata.ts](./lib/reportMetadata.ts) is the central place for report category and status label derivation.

The app tries to load label rows from the database but still has utility defaults for resilience.

This is another deliberate fail-soft pattern. If metadata lookup fails, the UI should degrade to less localized or less rich labels rather than stop rendering core report data.

## 18. Deployment Model

Deployment behavior is centered around:

1. [package.json](./package.json)
2. [open-next.config.ts](./open-next.config.ts)
3. [wrangler.jsonc](./wrangler.jsonc)
4. [AGENTS.md](./AGENTS.md)

### 18.1 Current deployment path

The primary deployment flow is Cloudflare Pages advanced mode using OpenNext.

Key commands:

1. `npm run build:cf`
2. `npm run build:pages`
3. `npm run deploy:pages`

### 18.2 Why `open-next.config.ts` has a Windows-specific build command

The config switches to `scripts/build-next-for-opennext-fixed.js` on Windows.

This exists because local Windows builds have required a more stable wrapper in this repository. It is a compatibility decision, not random divergence.

If you remove the conditional build command, re-validate Windows local builds and the full Cloudflare packaging flow.

### 18.3 Why `wrangler.jsonc` still points at `.pages-deploy`

The repo deploys a prepared Pages artifact directory. That path is part of the contract used by build scripts and deployment commands.

Changing it requires synchronized changes to the scripts, local preview flow, and deploy automation.

### 18.4 Runtime flags matter

`compatibility_flags` currently include `nodejs_compat` and `global_fetch_strictly_public`.

These are runtime assumptions, not noise. If they change, validate auth, OpenNext server behavior, and data access paths under Cloudflare specifically.

## 19. PWA Notes

The app includes PWA assets such as [public/manifest.json](./public/manifest.json) and service worker files under [public](./public).

The presence of a PWA layer means client caching bugs can survive deployments. That is why service-worker behavior, cache reset logic, and Cloudflare asset routing must be evaluated together.

## 20. Documentation Hygiene

This repository contains many historical docs. Not all of them reflect the current runtime and deployment model.

When a doc conflicts with source code or [AGENTS.md](./AGENTS.md), treat source code plus this architecture file plus AGENTS as authoritative.

Areas especially prone to staleness:

1. Old next-on-pages or Vercel-oriented deployment notes.
2. Docs that describe the app as mostly placeholder-only.
3. Docs written before the July 2026 Supabase migration.

## 21. Safe Change Checklist

Before changing behavior-sensitive areas, verify the corresponding contract.

### If changing auth

1. Test login from a route other than `/auth/login`.
2. Test provider return with `next` redirect behavior.
3. Confirm the `public.users` row is still synchronized.

### If changing consent or analytics

1. Test accepted, rejected, and first-visit states.
2. Confirm GTM is absent when rejected.
3. Confirm the server-rendered `noscript` branch still matches consent.

### If changing map behavior

1. Test `/map` with no filters.
2. Test district selection.
3. Test place selection.
4. Test `/map?report=<id>` deep linking.
5. Test popup open and close behavior.
6. Test fullscreen toggling.

### If changing report creation

1. Test with browser geolocation allowed.
2. Test with browser geolocation denied.
3. Test with a JPEG containing GPS EXIF.
4. Test with no photo.
5. Test draft persistence across refresh.
6. Test a successful upload to `report-photos`.

### If changing deployment

1. Run `npm run test`.
2. Run `npm run type-check`.
3. Run `npm run lint`.
4. Run `npm run build:pages`.
5. Verify `.pages-deploy` output still matches the Wrangler configuration.

## 22. Source Anchors

If you need to understand the application quickly, start here in this order:

1. [app/layout.tsx](./app/layout.tsx)
2. [lib/supabaseConfig.ts](./lib/supabaseConfig.ts)
3. [middleware.ts](./middleware.ts)
4. [app/auth/callback/route.ts](./app/auth/callback/route.ts)
5. [app/page.tsx](./app/page.tsx)
6. [app/map/MapPageClient.tsx](./app/map/MapPageClient.tsx)
7. [components/MapComponent.tsx](./components/MapComponent.tsx)
8. [app/report/ReportPageClient.tsx](./app/report/ReportPageClient.tsx)
9. [lib/reportLocation.ts](./lib/reportLocation.ts)
10. [lib/reportEngagement.ts](./lib/reportEngagement.ts)
11. [lib/adminAccess.ts](./lib/adminAccess.ts)
12. [components/ClientCacheReset.tsx](./components/ClientCacheReset.tsx)

That path will take you through most of the behavior that future changes can accidentally break.