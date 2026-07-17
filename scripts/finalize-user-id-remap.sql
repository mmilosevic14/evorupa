with remap as (
  select
    old_users.id as old_user_id,
    new_users.id as new_user_id,
    candidates.email,
    candidates.full_name,
    candidates.avatar_url,
    candidates.role,
    candidates.is_public,
    candidates.is_admin,
    candidates.picker_allowed
  from public.user_id_remap_candidates as candidates
  join public.users as old_users
    on old_users.id = candidates.old_user_id
  join public.users as new_users
    on new_users.email = candidates.email
   and new_users.id <> candidates.old_user_id
),
report_update as (
  update public.reports as reports
  set user_id = remap.new_user_id
  from remap
  where reports.user_id = remap.old_user_id
  returning reports.id
),
duplicate_upvote_delete as (
  delete from public.report_upvotes as old_upvotes
  using remap
  where old_upvotes.user_id = remap.old_user_id
    and exists (
      select 1
      from public.report_upvotes as new_upvotes
      where new_upvotes.report_id = old_upvotes.report_id
        and new_upvotes.user_id = remap.new_user_id
    )
  returning old_upvotes.report_id, old_upvotes.user_id
),
upvote_update as (
  update public.report_upvotes as report_upvotes
  set user_id = remap.new_user_id
  from remap
  where report_upvotes.user_id = remap.old_user_id
  returning report_upvotes.report_id, report_upvotes.user_id
),
profile_merge as (
  update public.users as new_users
  set
    full_name = coalesce(new_users.full_name, remap.full_name),
    avatar_url = coalesce(new_users.avatar_url, remap.avatar_url),
    role = coalesce(nullif(new_users.role, 'citizen'), remap.role),
    is_public = new_users.is_public or remap.is_public,
    is_admin = new_users.is_admin or remap.is_admin,
    picker_allowed = new_users.picker_allowed or remap.picker_allowed,
    updated_at = now()
  from remap
  where new_users.id = remap.new_user_id
  returning new_users.id
),
old_delete as (
  delete from public.users as old_users
  using remap
  where old_users.id = remap.old_user_id
  returning old_users.id
)
select
  (select count(*) from remap) as remapped_users,
  (select count(*) from report_update) as remapped_reports,
  (select count(*) from duplicate_upvote_delete) as deleted_duplicate_upvotes,
  (select count(*) from upvote_update) as remapped_upvotes,
  (select count(*) from profile_merge) as merged_profiles,
  (select count(*) from old_delete) as deleted_old_profiles;

select
  candidates.old_user_id,
  candidates.email,
  new_users.id as new_user_id
from public.user_id_remap_candidates as candidates
left join public.users as new_users
  on new_users.email = candidates.email
order by candidates.email asc;