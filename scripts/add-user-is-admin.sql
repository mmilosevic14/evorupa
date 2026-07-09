ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS users_is_admin_idx ON public.users(is_admin);