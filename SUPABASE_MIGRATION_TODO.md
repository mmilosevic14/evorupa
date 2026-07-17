# Supabase Migration TODO

## Current status

Completed from this command line:

1. Public schema bootstrap dependency identified and handed off.
2. Public data exported from the old project.
3. Public data imported into the new project.
4. Public table counts validated between old and new projects.
5. App config remapped to the new Supabase project in local defaults.

Important migration caveat for future debugging:

1. Some auth/profile bugs can still come from migration artifacts rather than current code.
2. During or after user recreation, `public.users.email` may still contain parked values like `migrating+<old-user-id>+<email>` until cleanup is finished.
3. If ownership, author names, or login-linked profile state looks wrong, compare `public.users`, `public.reports.user_id`, and the remap SQL flow before changing application behavior.

Validated counts:

1. `report_categories`: 6
2. `report_statuses`: 4
3. `settlements`: 9098
4. `users`: 3
5. `reports`: 6

Current default project config files now point at the new project:

1. [lib/supabase-public-config.json](c:/Users/mmilosev/gderupa/lib/supabase-public-config.json)
2. [.env.local](c:/Users/mmilosev/gderupa/.env.local)

## What cannot be done from this command line

These items are currently blocked from this Windows environment:

1. Apply the new Supabase schema over PostgreSQL.
   - Direct host `db.hjbvdtaeqqlyabmklrmg.supabase.co` is not usable here.
   - Pooler hosts are reachable, but the PostgreSQL handshake resets with `ECONNRESET`.
   - Result: the new project schema must be applied from the Supabase SQL Editor or another machine that can connect normally.

2. Migrate auth users and identities.
   - This needs account recreation or privileged auth migration.
   - A SQL-assisted account recreation flow is now prepared in this repo.

3. Migrate storage objects from the `report-photos` bucket.
   - This needs storage export/upload or an admin script with the correct old project secret key.

4. Fully validate login, admin access, uploads, and ownership continuity after cutover.
   - This must happen after schema, data, auth, and storage are all in place.

## SQL to run in Supabase

Run this in the new project's Supabase SQL Editor.

### Option A: recommended

Paste the full contents of the following file into the SQL Editor and run it:

- [scripts/bootstrap-supabase.sql](c:/Users/mmilosev/gderupa/scripts/bootstrap-supabase.sql)

This creates:

1. `public.users`
2. `public.report_categories`
3. `public.report_statuses`
4. `public.reports`
5. `public.report_upvotes`
6. `public.settlements`
7. triggers, functions, RLS policies, and the `report-photos` storage bucket rules

### Option B: if you want a minimal schema smoke test first

Run this first only to confirm the new project accepts SQL. After that, still run the full bootstrap file above.

```sql
create extension if not exists pgcrypto;

create table if not exists public.report_categories (
  code varchar(50) primary key,
  label_sr varchar(100) not null,
  description text,
  sort_order int not null default 0
);

create table if not exists public.report_statuses (
  code varchar(20) primary key,
  label_sr varchar(100) not null,
  description text,
  sort_order int not null default 0
);
```

If that works, stop and run the full bootstrap SQL from [scripts/bootstrap-supabase.sql](c:/Users/mmilosev/gderupa/scripts/bootstrap-supabase.sql).

## Export already prepared

The public data export script is already in the repo:

- [scripts/migrate-supabase-public-data.js](c:/Users/mmilosev/gderupa/scripts/migrate-supabase-public-data.js)

The export file created from the old project is here:

- [tmp/supabase-public-export.json](c:/Users/mmilosev/gderupa/tmp/supabase-public-export.json)

Exported tables and counts:

1. `report_categories`: 6
2. `report_statuses`: 4
3. `settlements`: 9098
4. `users`: 3
5. `reports`: 6

## Export command

Use this if you want to regenerate the public export from the old project.

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
node scripts/migrate-supabase-public-data.js export
```

## Import command

Run this only after the new schema exists.

Replace the placeholder secret with the new project's service-role key or secret key.

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
$env:SUPABASE_TARGET_URL='https://YOUR_NEW_PROJECT_ID.supabase.co'
$env:SUPABASE_TARGET_KEY='YOUR_NEW_PROJECT_SERVICE_KEY'
node scripts/migrate-supabase-public-data.js import
```

## What the import script covers

The script imports these public tables by REST upsert, and this step is already completed for the current migration:

1. `report_categories`
2. `report_statuses`
3. `settlements`
4. `users`
5. `reports`

## What still needs separate migration work

1. `auth.users`
2. `auth.identities`
3. storage files in `report-photos`
4. any global `report_upvotes` history that must be preserved exactly

## Storage migration

Use this script on the other machine:

1. [scripts/migrate-report-photos.js](c:/Users/mmilosev/gderupa/scripts/migrate-report-photos.js)

What it does:

1. reads the exported report list from [tmp/supabase-public-export.json](c:/Users/mmilosev/gderupa/tmp/supabase-public-export.json)
2. downloads each referenced photo from the old public bucket URL
3. uploads it to the new project's `report-photos` bucket
4. updates `public.reports.photo_url` in the new project to the new public URL
5. rewrites `photo_path` to the normalized object path and sets `photo_object_id` to `null`

What you need on the other machine:

1. the repo with this script
2. internet access to both old and new Supabase projects
3. the new project's service-role key or secret key

Dry run:

```powershell
node scripts/migrate-report-photos.js --dry-run
```

Real run:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
$env:SUPABASE_TARGET_URL='https://hjbvdtaeqqlyabmklrmg.supabase.co'
$env:SUPABASE_TARGET_KEY='YOUR_NEW_PROJECT_SERVICE_KEY'
node scripts/migrate-report-photos.js
```

Optional mode if you only want to copy files but not rewrite report rows yet:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
$env:SUPABASE_TARGET_URL='https://hjbvdtaeqqlyabmklrmg.supabase.co'
$env:SUPABASE_TARGET_KEY='YOUR_NEW_PROJECT_SERVICE_KEY'
node scripts/migrate-report-photos.js --skip-report-update
```

Current dry-run result in this repo:

1. 6 report photos will be migrated

Current verification result after migration:

1. The migrated photo-backed reports currently have `photo_path` folder prefixes that match their current `user_id` values.
2. The migrated public photo URLs were verified to return HTTP `200`.

## Account recreation and user-id remap

If you are recreating accounts in the new project instead of migrating `auth.users`, use these SQL files:

1. [scripts/prepare-user-id-remap.sql](c:/Users/mmilosev/gderupa/scripts/prepare-user-id-remap.sql)
2. [scripts/finalize-user-id-remap.sql](c:/Users/mmilosev/gderupa/scripts/finalize-user-id-remap.sql)

Recommended flow:

1. Run [scripts/prepare-user-id-remap.sql](c:/Users/mmilosev/gderupa/scripts/prepare-user-id-remap.sql) in the new project's SQL Editor.
2. This parks the imported old `public.users.email` values by prefixing them with `migrating+...` so the real email addresses become available again.
3. Have each user create a fresh account in the new project using the original email address.
4. After all needed accounts exist, run [scripts/finalize-user-id-remap.sql](c:/Users/mmilosev/gderupa/scripts/finalize-user-id-remap.sql).
5. That remaps `public.reports.user_id` and `public.report_upvotes.user_id` from old user IDs to the new ones by matching on email, merges profile flags into the new rows, and deletes the parked old profile rows.

Important limitation:

1. If you also need existing storage object paths to match the new user IDs, that is still a separate storage migration step.

## Remaining order

1. Migrate storage bucket contents.
2. Decide whether to preserve old auth users or recreate them.
3. Test login, report creation, map loading, images, and admin access.

## Minimal post-import checks

After import, confirm these queries work in the new project's SQL Editor:

```sql
select count(*) from public.report_categories;
select count(*) from public.report_statuses;
select count(*) from public.settlements;
select count(*) from public.users;
select count(*) from public.reports;
```

Expected results for this migration:

1. `report_categories`: 6
2. `report_statuses`: 4
3. `settlements`: 9098
4. `users`: 3
5. `reports`: 6

## Security note

The new database password and secret key were shared in chat during this migration attempt. Rotate them after the migration is complete.