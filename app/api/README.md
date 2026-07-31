# API Routes Guide

This file documents the route handlers under [app/api](./).

These routes are intentionally small, but they sit on important contracts between client-side workflows and the data/geography utility layer. They should not be treated as generic boilerplate.

## Routes

### [reverse-geocode/route.ts](./reverse-geocode/route.ts)

Responsibility:
Turns latitude and longitude into structured location details used by report tagging and UI grouping.

Request shape:

1. `GET /api/reverse-geocode?latitude=<number>&longitude=<number>`

Response shape:

1. `placeName`
2. `placeType`
3. `municipality`
4. `district`
5. `region`

Important behavior:

1. Validates that both coordinates parse to finite numbers.
2. Prefers database settlements if available.
3. Enriches results with district data from local district boundaries.
4. Falls back to Nominatim reverse geocoding.
5. Falls back again to embedded settlement data if Nominatim fails.
6. Returns a minimal Serbia-oriented fallback even when every richer path fails.

Why it works this way:

The report workflow needs stable grouping metadata, not just a best-effort geocoder string. The fallback chain is designed to keep that metadata available even under partial service failure.

Hidden contract:

This route feeds data that eventually becomes persisted location tags through [../../lib/reportLocation.ts](../../lib/reportLocation.ts). That means seemingly small response-shape changes can affect historical grouping and filter behavior downstream.

High-risk edits:

1. Returning loosely named fields that no longer match `ReportLocationDetails`.
2. Removing the local district enrichment step.
3. Removing fallback behavior and making report creation depend entirely on a third-party service.

### [cities/[[...location]]/route.ts](./cities/[[...location]]/route.ts)

Responsibility:
Returns city names filtered by optional country and region constraints.

Request shapes:

1. `GET /api/cities`
2. `GET /api/cities/serbia`
3. `GET /api/cities/serbia/vojvodina`
4. Query-param variants with `country` and `region`

Important behavior:

1. Supports both path-based and query-based filters.
2. Rejects requests where path and query filters disagree.
3. Rejects paths deeper than two location segments.
4. Returns normalized filter echo plus a flat city-name list.

Why it works this way:

This route is intentionally explicit rather than "smart". It prevents ambiguous filtering and makes client-side usage predictable.

High-risk edits:

1. Allowing conflicting filters and making output precedence unclear.
2. Changing normalization rules without updating the route contract documentation.

## Safe Editing Pattern For app/api/

When editing an API route here, verify:

1. The request shape still matches current client callers.
2. The response shape still matches the utility types or downstream form logic.
3. Any fallback behavior that protects user workflows remains intact.