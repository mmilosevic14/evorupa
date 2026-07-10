# Agent Start

Read these files first:

- `migration/README.md`
- `migration/CHECKLIST.md`
- `CHAT_HANDOFF.md`
- `package.json`

Assume secrets are not committed and must already be restored into local root env files.

## Required Checks Before Any New Work

Run:

```bash
npm install
npm test
npm run type-check
npm run build
```

If the task involves Cloudflare output, also run:

```bash
npm run build:cf
```

If the task involves any `supabase:*` script, confirm `.env.local` contains a working `SUPABASE_SESSION_DATABASE_URL` before running it.

## Constraints

- Do not commit real secrets.
- Do not replace the session pooler URL with a direct database host unless connectivity is verified.
- Treat Supabase project config, storage bucket state, and Cloudflare project wiring as external state that is not fully represented in git.

## Continue With

After validation passes, continue the requested feature or bugfix work.