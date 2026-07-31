# Components Guide

This file documents every React component under [components](./).

The goal is practical: many future edits to this codebase will be assisted by AI or done quickly by humans. Several components look replaceable at a glance but actually encode product rules, migration safety, browser workarounds, or state-handling assumptions. This guide is meant to reduce accidental behavior loss.

Use this file together with [../ARCHITECTURE.md](../ARCHITECTURE.md) before changing component behavior.

## How To Use This File

For each component, this guide records:

1. Its responsibility.
2. What data or props it depends on.
3. Which behaviors are intentional and should not be simplified casually.
4. What kind of edits are usually safe.

If a component is described as behavior-sensitive, prefer small changes and validate the user-visible flow after editing it.

## Shared Components

### [AppNavLinks.tsx](./AppNavLinks.tsx)

Responsibility:
Primary app navigation for both desktop and mobile. Also owns auth-aware navigation state, admin link visibility, install affordances, and logout behavior.

Key dependencies:

1. `usePwaInstall()` from [../lib/usePwaInstall.ts](../lib/usePwaInstall.ts).
2. Browser Supabase client from [../utils/supabase/client.ts](../utils/supabase/client.ts).
3. [ShareButton.tsx](./ShareButton.tsx).

Important behavior:

1. The mobile menu closes on route change. That is intentional and avoids stale overlay state when navigation completes.
2. Admin visibility is derived from multiple sources, not just one profile field. It mirrors the migration-tolerant admin logic documented in [../ARCHITECTURE.md](../ARCHITECTURE.md).
3. The auth subscription re-runs the admin/auth check so the nav updates immediately after login or logout.
4. PWA install behavior differs by platform. Android-like browsers can expose a deferred install prompt, while iOS falls back to instructional text.

Why it works this way:

This component is the user's always-visible session and navigation boundary. If auth state, admin state, or install state lags here, the rest of the app can look broken even if the underlying route logic is correct.

Safe edits:

1. Styling changes.
2. Adding or removing plain links if auth/admin branching is preserved.
3. Copy changes for menu labels or iOS install help.

High-risk edits:

1. Replacing the admin check with a single source.
2. Removing the auth state subscription.
3. Collapsing mobile and desktop behavior without retesting install and logout flows.

### [AppShareQr.tsx](./AppShareQr.tsx)

Responsibility:
Shows a QR code and sharing affordances for the app root URL.

Key dependencies:

1. `qrcode` package.
2. [ShareButton.tsx](./ShareButton.tsx).

Important behavior:

1. QR code generation happens on mount and is intentionally client-side.
2. The component has separate mobile and desktop layouts rather than a single compressed layout.
3. Failures log to the console instead of throwing, because QR rendering should not break the home page.

Why it works this way:

This is a progressive enhancement. Sharing the app is useful, but it is not allowed to block page rendering.

Safe edits:

1. Layout and styling changes.
2. Updating the surrounding copy.

High-risk edits:

1. Turning QR generation failure into a fatal render path.
2. Changing the app URL without verifying the production canonical host.

### [ClientCacheReset.tsx](./ClientCacheReset.tsx)

Responsibility:
Invisible one-time client recovery path for stale PWA and service-worker state after backend or asset cutovers.

Key dependencies:

1. `localStorage` version tracking.
2. Browser service worker APIs.
3. Cache Storage APIs.

Important behavior:

1. It runs only when the local reset version does not match the hardcoded current version.
2. It removes service worker registrations and caches before reloading.
3. It reloads only if something was actually changed.

Why it works this way:

This component exists because stale clients can survive deployments and keep talking to old assets or old backend assumptions. That class of bug is difficult to diagnose from code alone and often reproduces only on previously used devices.

Safe edits:

1. Updating the version string when a deliberate client reset is needed.
2. Clarifying comments or documentation.

High-risk edits:

1. Removing it as dead code without confirming the reset path is no longer needed in production.
2. Making it run on every load.

### [ConsentManager.tsx](./ConsentManager.tsx)

Responsibility:
Displays the analytics consent banner and conditionally loads GTM only after explicit opt-in.

Key dependencies:

1. `initialConsent` passed from [../app/layout.tsx](../app/layout.tsx).
2. [../lib/consent.ts](../lib/consent.ts).
3. Next `Script` component.

Important behavior:

1. Consent is stored in both a cookie and `localStorage`.
2. `localStorage` can restore a prior choice and re-persist it into the cookie.
3. GTM loads only when consent is `accepted`.
4. Rejected consent means GTM is absent entirely, not merely disabled later.

Why it works this way:

The app uses strict app-level analytics gating. That means privacy behavior is determined before analytics scripts enter the page, not after they load.

Safe edits:

1. Consent banner wording.
2. Visual styling.

High-risk edits:

1. Loading GTM unconditionally.
2. Mixing this approach with a second hardcoded GTM snippet.
3. Changing consent state names without a migration plan.

### [MapComponent.tsx](./MapComponent.tsx)

Responsibility:
Low-level Leaflet rendering surface for report markers, district overlays, popup behavior, focus handling, fullscreen, and viewport synchronization.

Key dependencies:

1. Leaflet.
2. [../lib/reportLocation.ts](../lib/reportLocation.ts).
3. [../lib/serbiaDistricts.ts](../lib/serbiaDistricts.ts).
4. [../lib/reportMedia.ts](../lib/reportMedia.ts).

Important behavior:

1. Popup opening can be retried because marker creation and focus requests do not always stabilize in the same render tick.
2. Map size invalidation is scheduled through animation frames and delayed retries because DOM layout and Leaflet internals do not settle instantly.
3. Viewport preservation is deliberate. The component avoids surprising jumps when possible and fits markers only when needed.
4. Fullscreen and popup behavior are coupled, so changes to one often affect the other.
5. Marker and popup lifecycle is intentionally defensive because map regressions often appear only in interaction-heavy flows.

Why it works this way:

Leaflet is imperative state inside a React app. This component contains the coordination layer that keeps those two models from fighting each other.

Safe edits:

1. Popup copy or styling.
2. Non-structural icon or label changes.

High-risk edits:

1. Removing delayed invalidation or popup retry logic as "cleanup".
2. Rebuilding markers more often than necessary.
3. Changing focus flow without retesting `/map?report=<id>` deep links.

### [PwaInstallPrompt.tsx](./PwaInstallPrompt.tsx)

Responsibility:
Displays a dismissible app-install prompt when installation is possible and the app is not already installed.

Key dependencies:

1. `usePwaInstall()`.
2. `localStorage` dismissal timestamp.

Important behavior:

1. Dismissal lasts seven days.
2. The prompt hides if the app is already installed.
3. iOS and non-iOS install behavior differ by platform capability.

Why it works this way:

Install prompts should stay helpful without becoming noise. The TTL exists to avoid repeating the same prompt too aggressively.

Safe edits:

1. Visual styling.
2. Install copy.

High-risk edits:

1. Removing the dismiss TTL.
2. Showing install UI when no actual install path exists.

### [ReportLocationPickerMap.tsx](./ReportLocationPickerMap.tsx)

Responsibility:
Map widget for selecting or reviewing a report location in the report form.

Key dependencies:

1. Leaflet.
2. `latitude`, `longitude`, `onPick`, and `interactive` props.

Important behavior:

1. Interactive and read-only modes are intentionally distinct.
2. Picked coordinates are normalized to a stable precision.
3. The component re-centers when controlled coordinates change.

Why it works this way:

The form needs a reliable controlled map input. This component keeps location selection predictable instead of mixing uncontrolled Leaflet state with form state.

Safe edits:

1. Styling and helper text.
2. Marker visuals.

High-risk edits:

1. Breaking the controlled `onPick` flow.
2. Merging interactive and read-only behavior without retesting form restore flows.

### [ReportViewsTracker.tsx](./ReportViewsTracker.tsx)

Responsibility:
Invisible helper that increments report view counters when a specific report set becomes active.

Key dependencies:

1. [../lib/reportEngagement.ts](../lib/reportEngagement.ts).
2. Browser Supabase client.

Important behavior:

1. It deduplicates repeated tracking by keeping a signature of the current tracking key and report IDs.
2. It fails softly and never throws into the UI.

Why it works this way:

React re-renders are not meaningful user views by themselves. The signature check prevents inflated counts from ordinary component churn.

Safe edits:

1. Logging changes.
2. Prop naming cleanup if the signature behavior is preserved.

High-risk edits:

1. Removing deduplication.
2. Throwing tracking failures into the render path.

### [ShareButton.tsx](./ShareButton.tsx)

Responsibility:
Generic share action used across the app.

Key dependencies:

1. Native Web Share API.
2. Clipboard API.
3. Browser window fallback.

Important behavior:

1. Relative URLs are converted to absolute URLs.
2. The component tries native share first, then clipboard copy, then a direct open fallback.
3. User-cancelled native shares are treated as non-errors.

Why it works this way:

Sharing should work across a wide range of mobile and desktop browsers without forcing a single capability assumption.

Safe edits:

1. Button copy or style.
2. Success callback usage.

High-risk edits:

1. Removing the fallback chain.
2. Treating `AbortError` as a hard failure.

## Admin Components

### [admin/ModerationPlaceholder.tsx](./admin/ModerationPlaceholder.tsx)

Responsibility:
Placeholder card for future moderation functionality.

Important behavior:

1. It is intentionally static.
2. It should not be mistaken for implemented moderation logic.

Why it works this way:

The admin route currently exposes structure and future intent, not full moderation workflows.

Safe edits:

1. Copy or layout changes.

High-risk edits:

1. Presenting placeholder content as real moderation state without implementing backend support.