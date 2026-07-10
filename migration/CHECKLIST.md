# Migration Checklist

## 1. Install Local Tooling

- Install Node.js 18 or newer.
- Install npm.
- Install Git.
- Optional: install GitHub CLI `gh` if you will sync GitHub secrets.

## 2. Clone The Repository

```bash
git clone <repo-url>
cd gderupa
```

## 3. Restore Local Environment Files

Create these files in the project root, not inside `migration/`:

- `.env.local`
- `.env.cloudflare.local` only if deployment or secret sync is needed

Use these templates:

- `migration/.env.local.template`
- `migration/.env.cloudflare.local.template`

## 4. Required Runtime Values

These must exist in `.env.local` for the app to run:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## 5. Required Database Script Values

If you need to run schema or settlement scripts, add one of these to `.env.local`:

```env
SUPABASE_SESSION_DATABASE_URL=
```

Accepted alternatives:

```env
SUPABASE_DB_CONNECTION=
SUPABASE_DATABASE_URL=
SUPABASE_DB_PASSWORD=
```

Preferred option:

- Use `SUPABASE_SESSION_DATABASE_URL` from the Supabase Session Pooler.
- Avoid relying on the direct `db.<project>.supabase.co` host from this Windows environment.

## 6. External State To Verify

- You have access to the same Supabase project.
- Supabase tables and policies were already applied.
- Supabase Storage contains bucket `report-photos`.
- Supabase Auth settings allow the local and deployed URLs you need.
- If deploying, Cloudflare Pages is connected to the correct GitHub repository.
- If deploying through GitHub, repository secrets exist for Cloudflare.

## 7. Install And Validate

```bash
npm install
npm test
npm run type-check
npm run build
```

Optional Cloudflare build validation:

```bash
npm run build:cf
```

## 8. Scripts That Need Hidden State

- `npm run dev`
- `npm run seed:test-serbia`
- `npm run supabase:apply-schema`
- `npm run supabase:apply-settlements`
- `npm run supabase:import-settlements`
- `npm run sync:cf:secrets`
- `npm run deploy:cf`

## 9. Deployment-Only Requirements

Put these in `.env.cloudflare.local` only when needed:

```env
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

Also required:

- Access to Cloudflare
- Access to GitHub
- `gh auth login` if using `npm run sync:cf:secrets`

## 10. Start The Next Agent

Open a new chat and point it to:

- `migration/AGENT_START.md`
- `CHAT_HANDOFF.md`

Then ask it to validate the environment before continuing feature work.