# Library Guide

This file documents the shared utility layer under [lib](./).

The purpose of this guide is to make future changes safer. The files in this directory are small, but several of them define contracts that are broader than their size suggests. Some affect persisted data shape, some define fallback behavior that keeps the app alive when external services degrade, and some exist specifically because of migration history.

Use this file together with [../ARCHITECTURE.md](../ARCHITECTURE.md), [../components/README.md](../components/README.md), and [../app/CLIENT_COMPONENTS.md](../app/CLIENT_COMPONENTS.md).

## Highest-Risk Files

These files are the easiest to break accidentally:

1. [reportLocation.ts](./reportLocation.ts)
Persists location meaning into `reports.tags` with fixed prefixes.

2. [mapFocus.ts](./mapFocus.ts)
Controls the ordering for district selection, place selection, and report focus.

3. [reportEngagement.ts](./reportEngagement.ts)
Defines the RPC-only path for views and upvotes.

4. [supabaseConfig.ts](./supabaseConfig.ts)
Controls how all public Supabase clients bootstrap.

5. [adminAccess.ts](./adminAccess.ts)
Encodes migration-tolerant admin detection.

6. [serbiaGeo.ts](./serbiaGeo.ts) and [serbiaDistricts.ts](./serbiaDistricts.ts)
Provide fallback geography behavior when database or third-party data is incomplete.

## Utility Inventory

### [adminAccess.ts](./adminAccess.ts)

Responsibility:
Resolves the current user and whether they should be treated as admin.

Important behavior:

1. Checks multiple admin signals instead of a single source.
2. Uses the authenticated user plus a `users` table lookup.

Why it works this way:

Admin state can drift during migrations or partial profile synchronization. The file prefers continuity of legitimate admin access over strict reliance on one potentially stale flag.

High-risk edits:

1. Reducing the check to one field without proving state canonicalization.

### [cities.ts](./cities.ts)

Responsibility:
Provides a small static city catalog and normalization helpers for the `/api/cities` route.

Important behavior:

1. `normalizeLocation()` removes diacritics and normalizes user-friendly names into URL-safe slugs.
2. Matching is exact after normalization rather than fuzzy.

Why it works this way:

The API route accepts either path or query filters and needs stable matching across labels such as `Šumadija` and slug-style inputs.

High-risk edits:

1. Changing normalization rules without retesting route compatibility.

### [consent.ts](./consent.ts)

Responsibility:
Defines the consent cookie name, GTM ID, and valid consent states.

Important behavior:

1. Consent state is intentionally narrow: `accepted`, `rejected`, or `null`.
2. Invalid values are normalized to `null`.

Why it works this way:

This file is the shared type-level boundary for both server bootstrap and client consent persistence.

High-risk edits:

1. Renaming consent states without a migration plan.
2. Changing the cookie name and forgetting existing users.

### [mapFocus.ts](./mapFocus.ts)

Responsibility:
Provides the tiny state machine used by the map page to decide whether it should wait, select a place, or focus a report.

Important behavior:

1. Focus is staged.
2. The target report must exist in the currently filtered report set before focus is allowed.

Why it works this way:

The map is not a single flat list. District and place filters alter which reports exist in the active view, so focusing too early fails intermittently.

High-risk edits:

1. Replacing the staged checks with a direct one-shot focus assumption.

### [reportAuthors.ts](./reportAuthors.ts)

Responsibility:
Controls which author names are visible in public UI.

Important behavior:

1. Only profiles marked public and having a `full_name` are exposed.
2. The output is a `Map` keyed by user id for cheap repeated lookup.

Why it works this way:

Author visibility is a privacy decision, not just a presentational choice.

High-risk edits:

1. Rendering raw profile names without the public visibility filter.

### [reportEngagement.ts](./reportEngagement.ts)

Responsibility:
Wraps report engagement RPC calls.

Important behavior:

1. Views are incremented only through `increment_report_views`.
2. Upvotes are toggled only through `toggle_report_upvote`.
3. `toggleReportUpvote()` expects one row back and throws if the function returns nothing.

Why it works this way:

The DB function boundary keeps engagement mutation atomic and central.

High-risk edits:

1. Replacing RPC calls with ad hoc client-side multi-step mutations.

### [reportImageProcessing.ts](./reportImageProcessing.ts)

Responsibility:
Defines image constraints and processing helpers used before report photo upload.

Important behavior:

1. Keeps source size, output dimensions, and compression bounded.
2. Supports the report form's pre-upload normalization path.

Why it works this way:

The report workflow assumes images are normalized before they hit storage. That keeps uploads smaller and rendering more predictable.

High-risk edits:

1. Allowing arbitrary raw uploads without retesting bandwidth, storage, and preview behavior.

### [reportLocation.ts](./reportLocation.ts)

Responsibility:
Defines the location-tag contract, parsing helpers, grouping helpers, and open-report logic.

Important behavior:

1. Stores location metadata in `reports.tags` using fixed prefixes.
2. Normalizes tag values before storage.
3. Uses Serbian collation for sorting.
4. Groups reports by place and district for both home and map views.

Why it works this way:

This file is both a UI helper and a persisted data contract. Historical rows depend on it.

High-risk edits:

1. Renaming tag prefixes.
2. Changing grouping keys without a data migration.

### [reportMedia.ts](./reportMedia.ts)

Responsibility:
Resolves which image URL should be displayed for a report.

Important behavior:

1. Falls back to the default report photo when the URL is empty.
2. Also falls back when the URL matches the legacy default external image.

Why it works this way:

This protects old rows and keeps the UI stable during migration cleanup.

High-risk edits:

1. Removing legacy handling before all historical media references are cleaned up.

### [reportMetadata.ts](./reportMetadata.ts)

Responsibility:
Defines fallback categories, fallback statuses, sort order logic, label maps, and upvote-derived priority.

Important behavior:

1. The app can operate even if metadata tables fail to load.
2. Category and status maps are derived from rows or defaults.
3. Priority is derived from upvote thresholds rather than being freely edited.

Why it works this way:

This is fail-soft infrastructure. Report rendering should survive metadata degradation.

High-risk edits:

1. Treating metadata table availability as mandatory for all views.
2. Changing priority thresholds without considering existing UI expectations.

### [serbiaDistricts.ts](./serbiaDistricts.ts)

Responsibility:
Provides district boundary data and helpers for matching coordinates to Serbian districts.

Important behavior:

1. Acts as a local geographic truth source when third-party reverse geocoding is inconsistent.
2. Supports map grouping and reverse-geocode enrichment.

Why it works this way:

External geocoders are not reliable enough to be the only source of district identity.

### [serbiaGeo.ts](./serbiaGeo.ts)

Responsibility:
Provides embedded settlements, nearest-settlement lookup, distance calculation, and settlement-to-location conversion.

Important behavior:

1. Uses haversine distance.
2. Applies a maximum match radius, defaulting to 25 km.
3. Provides an embedded fallback dataset for reverse geocoding.

Why it works this way:

The app needs location enrichment even when the database or Nominatim is unavailable.

High-risk edits:

1. Removing the distance threshold and creating implausible matches.
2. Treating embedded settlement data as canonical full coverage when it is actually a fallback.

### [store.ts](./store.ts)

Responsibility:
Defines lightweight Zustand stores for reports and user state.

Important behavior:

1. The stores are intentionally minimal.
2. Most major flows still use component-local state rather than centralizing everything here.

Why it works this way:

This repository uses Zustand as a helper, not as the dominant application architecture.

High-risk edits:

1. Starting a large state migration into Zustand without first designing ownership boundaries.

### [supabase.ts](./supabase.ts)

Responsibility:
Defines the public database TypeScript types and re-exports client factory names.

Important behavior:

1. Function types include engagement RPC contracts.
2. Table types reflect both application and storage-related report fields.

Why it works this way:

This file is the shared typing backbone for the rest of the application.

High-risk edits:

1. Changing types to "match current UI usage" while drifting from the actual schema.

### [supabaseConfig.ts](./supabaseConfig.ts)

Responsibility:
Provides public Supabase config from env or bundled fallback.

Important behavior:

1. The fallback config is intentional.
2. All public clients should source config here rather than duplicating env reads.

Why it works this way:

Shared configuration keeps browser and server bootstrap consistent across routes and environments.

High-risk edits:

1. Duplicating config logic elsewhere.
2. Removing fallback behavior without validating all target environments.

### [usePwaInstall.ts](./usePwaInstall.ts)

Responsibility:
Encapsulates browser-specific PWA install state and install prompt handling.

Important behavior:

1. iOS uses hinting rather than a browser prompt.
2. `beforeinstallprompt` is captured and deferred.
3. Installation state is derived from display mode or iOS standalone mode.

Why it works this way:

PWA installation is fragmented across browsers. The hook normalizes that divergence so components do not each reinvent it.

High-risk edits:

1. Assuming all browsers support the same install event model.

## Safe Editing Pattern For lib/

Before editing a lib file, ask which kind of contract it carries:

1. Persisted data contract.
2. External service fallback contract.
3. Privacy or auth contract.
4. UI convenience helper only.

The first three categories need explicit validation after any behavioral change.