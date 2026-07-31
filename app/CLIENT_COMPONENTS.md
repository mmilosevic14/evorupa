# Client Components Guide

This file documents every `*Client.tsx` component under [app](./).

These components are the route-level orchestration layer. They usually do not contain the lowest-level utilities, but they decide when data loads, how state flows, and when user-visible actions trigger. That makes them especially important during AI-assisted editing: a change that looks like "simple cleanup" at this layer can alter auth flow, map focus timing, local draft recovery, or edit restrictions.

Use this guide together with [../ARCHITECTURE.md](../ARCHITECTURE.md).

## Route Clients

### [account/AccountPageClient.tsx](./account/AccountPageClient.tsx)

Responsibility:
Owns the authenticated account experience: profile editing, password change, personal report listing, and limited report editing.

Key dependencies:

1. Browser Supabase client.
2. [../components/ReportViewsTracker.tsx](../components/ReportViewsTracker.tsx).
3. [../utils/supabase/profile.ts](../utils/supabase/profile.ts).
4. Report metadata helpers from [../lib/reportMetadata.ts](../lib/reportMetadata.ts).

Important behavior:

1. Profile state comes from the `users` table first, then falls back to auth metadata.
2. Password validation is intentionally stricter than a bare "non-empty password" check.
3. Editing of the user's reports is intentionally limited to safe fields such as title, description, category, and status.
4. Engagement features are conditional and can degrade off if metadata lookups fail.
5. Keyboard interaction on report cards pushes into map detail using `/map?report=<id>`.

Why it works this way:

This page is a controlled self-service surface. It allows account maintenance and limited report editing without exposing the more complex map, media, and location mutation flows here.

Safe edits:

1. Form presentation and copy.
2. Additional non-sensitive profile fields if they are wired end to end.

High-risk edits:

1. Allowing location or media edits here without designing a full update path.
2. Weakening password validation by accident.
3. Replacing profile-table-first loading with metadata-only loading.

Editing note:

If future work wants full report editing from the account page, treat that as a product change. The current page intentionally avoids rewriting location and media because those flows depend on different validation and storage behavior than simple text edits.

### [admin/AdminPageClient.tsx](./admin/AdminPageClient.tsx)

Responsibility:
Current visual shell for the admin page.

Key dependencies:

1. [../components/admin/ModerationPlaceholder.tsx](../components/admin/ModerationPlaceholder.tsx).

Important behavior:

1. This component is mostly placeholder UI.
2. It relies on server-side route protection rather than owning auth checks locally.

Why it works this way:

The route exists as a protected destination and admin surface scaffold, even though the full operational panel is not implemented yet.

Safe edits:

1. Layout cleanup.
2. Replacing placeholder content with real data if the backend contract is implemented.

High-risk edits:

1. Assuming client-side checks alone are enough to protect admin behavior.

### [auth/login/LoginPageClient.tsx](./auth/login/LoginPageClient.tsx)

Responsibility:
User login flow for email/password and Google OAuth.

Key dependencies:

1. Browser Supabase auth.
2. [../utils/supabase/profile.ts](../utils/supabase/profile.ts).
3. Callback route [auth/callback/route.ts](./auth/callback/route.ts).

Important behavior:

1. It surfaces callback errors from the URL so provider failures are visible to the user.
2. It syncs the profile after a successful direct login when possible.
3. It uses a hard redirect to `/map` after login rather than assuming a soft client transition is sufficient.

Why it works this way:

Auth changes session state, cookies, and protected-route expectations. The route favors predictability over clever navigation shortcuts.

Safe edits:

1. Form presentation.
2. Error messaging.

High-risk edits:

1. Diverging the redirect target from the callback flow without a reason.
2. Removing profile sync without confirming downstream data still materializes.

### [auth/signup/SignupPageClient.tsx](./auth/signup/SignupPageClient.tsx)

Responsibility:
User registration flow for email/password and Google OAuth.

Key dependencies:

1. Browser Supabase auth.
2. [../utils/supabase/profile.ts](../utils/supabase/profile.ts).
3. Callback route [auth/callback/route.ts](./auth/callback/route.ts).

Important behavior:

1. It passes `full_name` into signup metadata.
2. It attempts profile sync if a session is immediately available.
3. It exposes a success state for verification-based flows.

Why it works this way:

Signup is both auth creation and first-time profile bootstrap. The code treats those as related operations even if the profile row may still require later repair.

Safe edits:

1. Form text and layout.
2. Additional signup fields if they are intentionally reflected in the profile sync path.

High-risk edits:

1. Breaking the relationship between signup metadata and profile bootstrap.

### [map/MapPageClient.tsx](./map/MapPageClient.tsx)

Responsibility:
Route-level orchestrator for the full report map experience.

Key dependencies:

1. Browser Supabase client.
2. [../components/MapComponent.tsx](../components/MapComponent.tsx).
3. [../components/ReportViewsTracker.tsx](../components/ReportViewsTracker.tsx).
4. [../lib/mapFocus.ts](../lib/mapFocus.ts).
5. [../lib/reportLocation.ts](../lib/reportLocation.ts).
6. [../lib/reportEngagement.ts](../lib/reportEngagement.ts).

Important behavior:

1. It loads reports, metadata, user state, and upvote state separately and keeps working when some metadata paths degrade.
2. District selection, place selection, and focused report deep-linking are coordinated rather than applied as one flat state update.
3. Focus requests use a nonce so repeated selection of the same report can still retrigger behavior.
4. Upvote requests have pending-state protection to avoid double actions.
5. Pagination state is split by list type because the page renders multiple browse surfaces at once.
6. Realtime report changes update in-memory report state without a full refetch.

Why it works this way:

This page is the state coordinator for nearly all public report browsing behavior. It exists to keep filtering, focusing, metadata, and engagement stable around an imperative Leaflet map.

Safe edits:

1. Visual grouping and presentation.
2. Copy and metadata labels.

High-risk edits:

1. Simplifying focus sequencing.
2. Merging pagination state carelessly.
3. Changing callback stability in ways that force marker rebuilds.

### [report/ReportPageClient.tsx](./report/ReportPageClient.tsx)

Responsibility:
Route-level report creation workflow including location inference, image processing, draft persistence, upload, and insert.

Key dependencies:

1. [../components/ReportLocationPickerMap.tsx](../components/ReportLocationPickerMap.tsx).
2. Browser Geolocation API.
3. Custom JPEG EXIF GPS extraction.
4. [../lib/reportImageProcessing.ts](../lib/reportImageProcessing.ts).
5. [../lib/reportLocation.ts](../lib/reportLocation.ts).
6. Browser Supabase client and storage.

Important behavior:

1. Location can come from default Serbia center, browser geolocation, photo EXIF, or manual map selection.
2. Draft state is intentionally stored in `localStorage` so users do not lose work.
3. Images are processed before upload to control size, dimensions, and output format.
4. Profile sync is run before insert so report ownership and author-related flows remain consistent.
5. The report row stores both user-facing and operational media identifiers.

Why it works this way:

This route absorbs the variability of real-world mobile reporting: weak connectivity, missing permissions, oversized photos, lost tab state, and mixed quality location inputs.

Safe edits:

1. Form layout and copy.
2. Additional validation messaging.

High-risk edits:

1. Removing draft persistence.
2. Changing location precedence without retesting photo and browser flows.
3. Replacing image processing with raw uploads.

### [account/AccountPageClient.tsx](./account/AccountPageClient.tsx)

Editing note:
If future work wants "full report editing" from the account page, treat that as a product change. The current page intentionally avoids rewriting location and media because those flows depend on different validation and storage behavior than simple text edits.