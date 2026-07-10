# Migration Pack

Use this folder when moving development to another machine.

This folder is intentionally safe to commit. It documents what the new machine needs, but it does not contain real secrets.

## Files In This Folder

- `README.md`
  Overview and recommended order
- `CHECKLIST.md`
  Step-by-step migration checklist
- `.env.local.template`
  Template for app and database-related local variables
- `.env.cloudflare.local.template`
  Template for Cloudflare deployment variables
- `AGENT_START.md`
  Short instruction set for the next agent or fresh chat

## Recommended Order

1. Copy this repository to the new machine.
2. Recreate `.env.local` from `migration/.env.local.template`.
3. Recreate `.env.cloudflare.local` from `migration/.env.cloudflare.local.template` only if deployment work is needed.
4. Follow `migration/CHECKLIST.md`.
5. Start the next chat with `migration/AGENT_START.md` and `CHAT_HANDOFF.md`.

## Important Notes

- Do not commit real secrets into any file in this folder.
- The app can run with Supabase runtime keys only.
- Database admin scripts need a working session pooler connection string or another accepted DB credential.
- On this Windows environment, prefer `SUPABASE_SESSION_DATABASE_URL` over the direct Supabase database host.

## Related Root Docs

- `CHAT_HANDOFF.md`
- `GETTING_STARTED.md`
- `BUILD_AND_DEPLOY.md`
- `SETUP_DATABASE.md`
- `SUPABASE_INTEGRATION.md`