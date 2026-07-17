# Manual Supabase SQL

These SQL files are intentionally outside `supabase/migrations`.

Use them only for one-time migration operations on an existing project:

- `prepare-user-id-remap.sql`
- `finalize-user-id-remap.sql`

They should not run automatically in every environment because they rewrite existing user/profile data.