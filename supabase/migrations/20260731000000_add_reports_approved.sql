-- Add approval flag to reports table
-- approved IS NULL  → not yet reviewed (pending)
-- approved = TRUE   → approved by admin
-- approved = FALSE  → rejected by admin

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT NULL;

CREATE INDEX IF NOT EXISTS reports_approved_idx ON public.reports(approved);

-- Allow admins to update the approval status of any report
DROP POLICY IF EXISTS "Admins can update any report" ON public.reports;
CREATE POLICY "Admins can update any report"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND is_admin = TRUE
    )
  );
