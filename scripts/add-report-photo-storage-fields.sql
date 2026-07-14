ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS photo_path TEXT,
ADD COLUMN IF NOT EXISTS photo_object_id UUID;

CREATE INDEX IF NOT EXISTS reports_photo_object_id_idx ON public.reports(photo_object_id);

CREATE OR REPLACE FUNCTION public.list_my_orphaned_report_photos()
RETURNS TABLE(object_id UUID, object_name TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT o.id AS object_id, o.name AS object_name
  FROM storage.objects AS o
  WHERE o.bucket_id = 'report-photos'
    AND auth.uid() IS NOT NULL
    AND (
      (storage.foldername(o.name))[1] = auth.uid()::text
      OR (storage.foldername(o.name))[2] = auth.uid()::text
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.reports AS r
      WHERE r.user_id = auth.uid()
        AND COALESCE(
          r.photo_path,
          NULLIF(regexp_replace(r.photo_url, '^.*/object/public/report-photos/', ''), '')
        ) = o.name
    )
  ORDER BY o.name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_orphaned_report_photos() TO authenticated;