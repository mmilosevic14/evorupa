# Supabase Folder

This folder makes the database part of the repo explicit and reviewable.

## What it gives you

1. Schema changes live in Git instead of only in ad hoc SQL editor history.
2. Local and CI database resets can recreate the same baseline deterministically.
3. PRs can review database changes next to app changes.
4. Supabase CLI workflows such as `db reset`, `db push`, and `db diff` have a standard home.
5. One-off operational SQL can be separated from normal schema migrations.

## Structure

- `config.toml`: Supabase CLI project config for this repository.
- `migrations/`: schema and data migrations that define the baseline application database.
- `seed.sql`: lightweight local seed data for CLI resets.
- `manual/`: one-off operational SQL that should not auto-run everywhere.

## Mapping from the old scripts directory

- `scripts/bootstrap-supabase.sql` is now represented as the canonical baseline migration.
- Small historical patch scripts such as `add-user-is-admin.sql` are already folded into that baseline schema.
- Data repair and migration-only scripts such as the user remap flow stay under `manual/`.
- Large settlement imports can continue to live in `scripts/` until you decide to promote them into a heavier seed or a dedicated data migration.

## Suggested workflow

1. Put new schema changes in `supabase/migrations`.
2. Keep one-off production data fixes in `supabase/manual`.
3. Use `seed.sql` only for lightweight local reset data.
4. Keep very large imports, exports, or one-time migration helpers in `scripts/` unless they truly belong in normal CLI resets.