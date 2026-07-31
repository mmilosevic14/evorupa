# Report Creation Guide

This guide explains the report submission path and why it contains multiple fallback systems.

## Files That Define Report Creation

1. [../../app/report/ReportPageClient.tsx](../../app/report/ReportPageClient.tsx)
2. [../../components/ReportLocationPickerMap.tsx](../../components/ReportLocationPickerMap.tsx)
3. [../../app/api/reverse-geocode/route.ts](../../app/api/reverse-geocode/route.ts)
4. [../../lib/reportImageProcessing.ts](../../lib/reportImageProcessing.ts)
5. [../../lib/reportLocation.ts](../../lib/reportLocation.ts)
6. [../../utils/supabase/profile.ts](../../utils/supabase/profile.ts)

## Flow Summary

1. User enters report details.
2. The app derives location from default coordinates, browser geolocation, photo EXIF, or manual map selection.
3. Reverse geocoding resolves location details for tagging.
4. Draft state is stored locally so the user does not lose progress.
5. The selected photo is processed to a constrained WebP output.
6. The user profile is synchronized if needed.
7. The image uploads to `report-photos`.
8. The report row is inserted with location tags and media identifiers.

## Why There Are Multiple Location Sources

Users report from mobile contexts with inconsistent permissions and inconsistent source media. The app needs a usable location even when one source is unavailable or imprecise.

That is why the route supports layered sources instead of assuming browser geolocation alone.

## Why Drafts Are Local

This flow can involve large photos, navigation away from the page, or interrupted connectivity. Local draft persistence keeps the user from losing progress and avoids introducing a more complex server-side draft model.

## Why Images Are Processed Before Upload

The upload path assumes predictable size, format, and dimensions. Client-side normalization reduces upload cost and makes later rendering more stable.

## Why Tags Are Written At Submission Time

Location tags are the downstream contract used by browsing and grouping. The app persists them immediately so later pages do not need to reconstruct location meaning from raw coordinates every time.

## Safe Changes

1. Form copy and layout.
2. Additional validation messaging.
3. UI improvements around location source visibility.

## High-Risk Changes

1. Removing local draft persistence.
2. Changing location precedence without retesting all paths.
3. Uploading raw files instead of normalized outputs.
4. Changing the tag payload shape without migration planning.