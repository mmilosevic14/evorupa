create table if not exists public.user_id_remap_candidates (
  old_user_id uuid primary key,
  email varchar(255) not null unique,
  full_name varchar(255),
  avatar_url varchar(255),
  role varchar(20) not null default 'citizen',
  is_public boolean not null default false,
  is_admin boolean not null default false,
  picker_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  captured_at timestamptz not null default now()
);

insert into public.user_id_remap_candidates (
  old_user_id,
  email,
  full_name,
  avatar_url,
  role,
  is_public,
  is_admin,
  picker_allowed,
  created_at,
  captured_at
)
select
  users.id,
  users.email,
  users.full_name,
  users.avatar_url,
  users.role,
  users.is_public,
  users.is_admin,
  users.picker_allowed,
  users.created_at,
  now()
from public.users as users
where users.email not like 'migrating+%'
on conflict (old_user_id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  role = excluded.role,
  is_public = excluded.is_public,
  is_admin = excluded.is_admin,
  picker_allowed = excluded.picker_allowed,
  created_at = excluded.created_at,
  captured_at = now();

update public.users as users
set email = 'migrating+' || users.id::text || '+' || users.email
from public.user_id_remap_candidates as candidates
where users.id = candidates.old_user_id
  and users.email = candidates.email;

select
  candidates.old_user_id,
  candidates.email as original_email,
  users.email as parked_email
from public.user_id_remap_candidates as candidates
join public.users as users
  on users.id = candidates.old_user_id
order by candidates.email asc;