CREATE TABLE IF NOT EXISTS public.report_categories (
  code VARCHAR(50) PRIMARY KEY,
  label_sr VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.report_statuses (
  code VARCHAR(20) PRIMARY KEY,
  label_sr VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

INSERT INTO public.report_categories (code, label_sr, description, sort_order)
VALUES
  ('road_damage', 'Oštećenje puta', 'Oštećenja kolovoza i bankina.', 10),
  ('pothole', 'Rupa na putu', 'Udarne rupe i lokalna oštećenja.', 20),
  ('traffic_sign', 'Saobraćajna signalizacija', 'Nedostajuća ili oštećena signalizacija.', 30),
  ('lighting', 'Javna rasveta', 'Problemi sa uličnom rasvetom.', 40),
  ('sidewalk', 'Pločnik i pešačke staze', 'Oštećenja pešačke infrastrukture.', 50),
  ('other', 'Ostalo', 'Drugi infrastrukturni problemi.', 60)
ON CONFLICT (code) DO UPDATE
SET
  label_sr = EXCLUDED.label_sr,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.report_statuses (code, label_sr, description, sort_order)
VALUES
  ('pending', 'Na čekanju', 'Prijava je zaprimljena i čeka obradu.', 10),
  ('in_progress', 'U radu', 'Radovi ili obrada su u toku.', 20),
  ('resolved', 'Rešeno', 'Problem je rešen.', 30),
  ('rejected', 'Odbačeno', 'Prijava je odbijena ili zatvorena bez akcije.', 40)
ON CONFLICT (code) DO UPDATE
SET
  label_sr = EXCLUDED.label_sr,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.report_upvotes (
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (report_id, user_id)
);

CREATE INDEX IF NOT EXISTS report_upvotes_user_id_idx ON public.report_upvotes(user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reports_category_fkey'
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_category_fkey
      FOREIGN KEY (category) REFERENCES public.report_categories(code);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reports_status_fkey'
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_status_fkey
      FOREIGN KEY (status) REFERENCES public.report_statuses(code);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.report_priority_from_upvotes(upvote_count INT)
RETURNS VARCHAR(20)
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(upvote_count, 0) >= 20 THEN 'high'
    WHEN COALESCE(upvote_count, 0) >= 5 THEN 'medium'
    ELSE 'low'
  END;
$$;

CREATE OR REPLACE FUNCTION public.set_report_priority_from_upvotes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.upvotes := COALESCE(NEW.upvotes, 0);
  NEW.views := COALESCE(NEW.views, 0);
  NEW.priority := public.report_priority_from_upvotes(NEW.upvotes);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_set_priority_trigger ON public.reports;
CREATE TRIGGER reports_set_priority_trigger
  BEFORE INSERT OR UPDATE OF upvotes ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_report_priority_from_upvotes();

CREATE OR REPLACE FUNCTION public.apply_report_upvote_delta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reports
    SET
      upvotes = COALESCE(upvotes, 0) + 1,
      updated_at = NOW()
    WHERE id = NEW.report_id;

    RETURN NEW;
  END IF;

  UPDATE public.reports
  SET
    upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0),
    updated_at = NOW()
  WHERE id = OLD.report_id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS report_upvotes_apply_delta_trigger ON public.report_upvotes;
CREATE TRIGGER report_upvotes_apply_delta_trigger
  AFTER INSERT OR DELETE ON public.report_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_report_upvote_delta();

CREATE OR REPLACE FUNCTION public.increment_report_views(report_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reports AS reports
  SET
    views = COALESCE(reports.views, 0) + increments.view_count,
    updated_at = NOW()
  FROM (
    SELECT report_id, COUNT(*)::INT AS view_count
    FROM unnest(COALESCE(report_ids, ARRAY[]::UUID[])) AS report_id
    GROUP BY report_id
  ) AS increments
  WHERE reports.id = increments.report_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_report_upvote(p_report_id UUID)
RETURNS TABLE(has_upvoted BOOLEAN, upvotes INT, priority VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to upvote reports.' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.report_upvotes
    WHERE report_id = p_report_id
      AND user_id = current_user_id
  ) THEN
    DELETE FROM public.report_upvotes
    WHERE report_id = p_report_id
      AND user_id = current_user_id;

    RETURN QUERY
    SELECT FALSE, COALESCE(reports.upvotes, 0), COALESCE(reports.priority, 'low')
    FROM public.reports AS reports
    WHERE reports.id = p_report_id;

    RETURN;
  END IF;

  INSERT INTO public.report_upvotes (report_id, user_id)
  VALUES (p_report_id, current_user_id)
  ON CONFLICT (report_id, user_id) DO NOTHING;

  RETURN QUERY
  SELECT TRUE, COALESCE(reports.upvotes, 0), COALESCE(reports.priority, 'low')
  FROM public.reports AS reports
  WHERE reports.id = p_report_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_report_views(UUID[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_report_upvote(UUID) TO authenticated;

ALTER TABLE public.report_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view report categories" ON public.report_categories;
CREATE POLICY "Anyone can view report categories"
  ON public.report_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can view report statuses" ON public.report_statuses;
CREATE POLICY "Anyone can view report statuses"
  ON public.report_statuses FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can view own report upvotes" ON public.report_upvotes;
CREATE POLICY "Users can view own report upvotes"
  ON public.report_upvotes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own report upvotes" ON public.report_upvotes;
CREATE POLICY "Users can create own report upvotes"
  ON public.report_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own report upvotes" ON public.report_upvotes;
CREATE POLICY "Users can delete own report upvotes"
  ON public.report_upvotes FOR DELETE
  USING (auth.uid() = user_id);

UPDATE public.reports
SET
  upvotes = COALESCE(upvotes, 0),
  views = COALESCE(views, 0),
  priority = public.report_priority_from_upvotes(COALESCE(upvotes, 0));