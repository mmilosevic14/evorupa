UPDATE public.reports AS reports
SET photo_path = matched.object_name
FROM (
  SELECT
    report_rows.id AS report_id,
    object_rows.name AS object_name
  FROM public.reports AS report_rows
  JOIN storage.objects AS object_rows
    ON object_rows.bucket_id = 'report-photos'
   AND NULLIF(
         regexp_replace(
           report_rows.photo_url,
           '^.*/object/public/report-photos/',
           ''
         ),
         ''
       ) = object_rows.name
  WHERE report_rows.photo_url IS NOT NULL
    AND btrim(report_rows.photo_url) <> ''
    AND (report_rows.photo_path IS NULL OR btrim(report_rows.photo_path) = '')
) AS matched
WHERE reports.id = matched.report_id;

UPDATE public.reports AS reports
SET photo_object_id = matched.object_id
FROM (
  SELECT
    report_rows.id AS report_id,
    object_rows.id AS object_id
  FROM public.reports AS report_rows
  JOIN storage.objects AS object_rows
    ON object_rows.bucket_id = 'report-photos'
   AND COALESCE(report_rows.photo_path, NULLIF(
         regexp_replace(
           report_rows.photo_url,
           '^.*/object/public/report-photos/',
           ''
         ),
         ''
       )) = object_rows.name
  WHERE report_rows.photo_url IS NOT NULL
    AND btrim(report_rows.photo_url) <> ''
    AND report_rows.photo_object_id IS NULL
) AS matched
WHERE reports.id = matched.report_id;

WITH normalized_reports AS (
  SELECT
    r.id,
    NULLIF(regexp_replace(r.photo_url, '^.*/object/public/report-photos/', ''), '') AS derived_photo_path
  FROM public.reports AS r
  WHERE r.photo_url IS NOT NULL
    AND btrim(r.photo_url) <> ''
),
updated_paths AS (
  UPDATE public.reports AS r
  SET photo_path = normalized_reports.derived_photo_path
  FROM normalized_reports
  WHERE r.id = normalized_reports.id
    AND normalized_reports.derived_photo_path IS NOT NULL
    AND (
      r.photo_path IS NULL
      OR btrim(r.photo_path) = ''
    )
  RETURNING r.id
)
UPDATE public.reports AS r
SET photo_object_id = o.id
FROM storage.objects AS o
WHERE o.bucket_id = 'report-photos'
  AND r.photo_path = o.name
  AND r.photo_path IS NOT NULL
  AND (
    r.photo_object_id IS NULL
    OR r.photo_object_id <> o.id
  );