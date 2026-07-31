# Map Flow Guide

This guide explains the public map experience and the logic that protects deep linking and popup stability.

## Files That Define Map Behavior

1. [../../app/map/MapPageClient.tsx](../../app/map/MapPageClient.tsx)
2. [../../components/MapComponent.tsx](../../components/MapComponent.tsx)
3. [../../lib/mapFocus.ts](../../lib/mapFocus.ts)
4. [../../lib/reportLocation.ts](../../lib/reportLocation.ts)
5. [../../lib/reportEngagement.ts](../../lib/reportEngagement.ts)
6. [../../components/ReportViewsTracker.tsx](../../components/ReportViewsTracker.tsx)

## Flow Summary

1. Load reports, metadata, user state, and upvote state.
2. Group reports by district and place.
3. Apply district and place selection.
4. Resolve deep-link focus requests such as `/map?report=<id>` in stages.
5. Render and coordinate Leaflet markers and popups.
6. Record views and upvotes through RPC-backed engagement helpers.

## Why Focus Is Staged

The target report cannot be focused reliably until the correct district and place have already been selected and the filtered report set contains that report.

This is why the app uses a small state machine instead of trying to jump directly from query param to popup.

## Why Popups And Viewport Logic Look Defensive

Leaflet is imperative and timing-sensitive. The map component uses retry scheduling, delayed invalidation, and viewport restoration because popup opening, map sizing, and filtered marker changes do not always stabilize in a single render pass.

If these defensive steps are removed as "cleanup", the usual failure mode is not a compile error. It is a flaky UX where popups fail to open, open off-screen, or close unexpectedly.

## Why Grouping Uses Location Tags

The home page and map page share the same persisted location-tag contract. That keeps browsing and aggregate views consistent, but it also means grouping behavior depends on historical stored tags.

## Safe Changes

1. Presentation and layout changes.
2. Label and copy improvements.
3. New non-destructive filters if they preserve the existing focus sequence.

## High-Risk Changes

1. Simplifying focus into one direct state update.
2. Recreating callbacks or markers in ways that destabilize popup lifecycle.
3. Changing tag interpretation without data migration.