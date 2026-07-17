-- Historical bootstrap snapshot.
-- For normal ongoing schema work, use supabase/migrations/ as the source of truth.
-- Keep this file for recovery or manual dashboard-only execution when needed.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'citizen',
  phone VARCHAR(20),
  city VARCHAR(100),
  municipality VARCHAR(100),
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  picker_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);
CREATE INDEX IF NOT EXISTS users_is_admin_idx ON public.users(is_admin);

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

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  photo_url VARCHAR(500),
  photo_path TEXT,
  photo_object_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  tags TEXT[],
  upvotes INT DEFAULT 0,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.report_upvotes (
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (report_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  municipality VARCHAR(150) NOT NULL,
  district VARCHAR(150),
  region VARCHAR(150) NOT NULL DEFAULT 'Srbija',
  place_type VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT settlements_unique_place UNIQUE (name, municipality, district)
);

CREATE INDEX IF NOT EXISTS reports_user_id_idx ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS reports_category_idx ON public.reports(category);
CREATE INDEX IF NOT EXISTS reports_location_idx ON public.reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS reports_photo_object_id_idx ON public.reports(photo_object_id);
CREATE INDEX IF NOT EXISTS report_upvotes_user_id_idx ON public.report_upvotes(user_id);
CREATE INDEX IF NOT EXISTS settlements_name_idx ON public.settlements(name);
CREATE INDEX IF NOT EXISTS settlements_municipality_idx ON public.settlements(municipality);
CREATE INDEX IF NOT EXISTS settlements_location_idx ON public.settlements(latitude, longitude);

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

UPDATE public.reports
SET
  upvotes = COALESCE(upvotes, 0),
  views = COALESCE(views, 0),
  priority = public.report_priority_from_upvotes(COALESCE(upvotes, 0));

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view reports" ON public.reports;
CREATE POLICY "Anyone can view reports"
  ON public.reports FOR SELECT
  USING (true);

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

DROP POLICY IF EXISTS "Anyone can view settlements" ON public.settlements;
CREATE POLICY "Anyone can view settlements"
  ON public.settlements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;
CREATE POLICY "Users can update own reports"
  ON public.reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reports" ON public.reports;
CREATE POLICY "Users can delete own reports"
  ON public.reports FOR DELETE
  USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public access to report photos" ON storage.objects;
CREATE POLICY "Public access to report photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-photos');

DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
CREATE POLICY "Users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'report-photos'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'report-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );