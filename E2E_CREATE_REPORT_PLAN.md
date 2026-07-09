# End-to-End Test Plan: Create New Problem Report

## Goal

Verify the full user flow for creating a new infrastructure report and confirming that the uploaded image, location metadata, map placement, and print views all behave correctly.

## Preconditions

- Local app is running with access to Supabase.
- Test user exists and can log in.
- `report-photos` bucket is publicly readable.
- Reverse geocoding endpoint is working locally.

## Scenario A: Submit a report with image URL

1. Log in with the test account.
2. Open `/report`.
3. Enter a unique title and description.
4. Choose a category.
5. Paste an external image URL.
6. Click the WebP conversion button.
7. Confirm that image preview appears.
8. Confirm that the UI states the image is prepared as WebP.
9. Submit the report.
10. Confirm redirect to `/map`.

## Scenario B: Verify location enrichment

1. Confirm place name is resolved from current/browser location or EXIF/photo location.
2. Confirm district is resolved through Serbia district GeoJSON when coordinates are inside a known district.
3. Confirm region defaults to `Srbija`.
4. Confirm tags written to the report contain place, municipality, district, and region values.

## Scenario C: Verify storage and media

1. Query the latest report in Supabase by unique title.
2. Confirm `photo_url` is not null.
3. Confirm `photo_url` points to the `report-photos` storage bucket.
4. Confirm the uploaded object path ends with `.webp`.
5. Fetch the object headers and confirm `content-type` is `image/webp`.

## Scenario D: Verify map visibility

1. Open `/map` after submission.
2. Confirm the new report appears in the main list.
3. Confirm the report image is visible in the list card.
4. Confirm the map marker popup shows the same image.
5. If a district filter is selected, confirm the new report remains inside the correct district boundary.

## Scenario E: Verify focused filters

1. Filter by district.
2. Confirm the map fits the district boundary instead of arbitrary marker-only bounds.
3. Filter by town within that district.
4. Confirm `Pregled po mestu` is hidden when a town is already selected.
5. Confirm each report item stops repeating the already-selected place context.

## Scenario F: Verify print output

1. Open print preview from `/map`.
2. Confirm the map is visible in print.
3. Confirm the printable list uses black-on-white styling.
4. Confirm no decorative borders or tinted backgrounds remain.
5. Confirm report items do not split across pages.

## Scenario G: Verify moderation placeholder

1. Open `/admin`.
2. Confirm the moderation module is visible.
3. Confirm it clearly states that no moderation actions are active yet.
4. Confirm this placeholder does not block the rest of the admin view.

## Expected Results

- New reports can be created end-to-end.
- Images are converted to WebP before upload.
- Uploaded storage objects are public and render on the map.
- District metadata is assigned from border containment when available.
- District selection controls map bounds.
- Print output remains document-friendly.