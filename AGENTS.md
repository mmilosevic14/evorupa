# Agent Operating Notes

These instructions are for coding agents working on this repository.

## Environment Priority

Use this order for local work:

1. WSL checkout inside the Linux filesystem.
2. Native Windows checkout.
3. WSL against a Windows-mounted path such as `/mnt/d/Git/evorupa`.

The preferred local checkout on this workstation is:

```bash
cd ~/src/evorupa
```

Avoid using `/mnt/d/Git/evorupa` as the main WSL workspace. It works, but dependency install and OpenNext trace collection are much slower, and WSL Git can report line-ending noise on the Windows checkout.

Native Windows builds currently pass, but OpenNext prints a Windows compatibility warning. Treat Windows as acceptable for quick checks, not as the primary Cloudflare/OpenNext environment.

## Node And Package Manager

Use Node 22 unless the project intentionally migrates.

```bash
. "$HOME/.nvm/nvm.sh"
nvm use
npm ci
```

CI currently uses Node 22. Do not upgrade the expected Node version as part of unrelated changes. If upgrading Node, first keep CI green on Node 22, then make the migration explicit in a separate change.

For dependency and Node migration sequencing, follow `UPGRADE_MIGRATION_PLAN.md`.

## Local Env Files

Expected local files:

```text
.env.local
.env.cloudflare.local
```

They must stay untracked. Do not print secret values in logs, commits, PRs, or chat. It is safe to report variable names and whether they are present.

Required `.env.local` keys for full local work:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SESSION_DATABASE_URL
```

Optional or fallback DB keys used by scripts:

```text
SUPABASE_DB_CONNECTION
SUPABASE_DATABASE_URL
SUPABASE_DB_PASSWORD
```

Required `.env.cloudflare.local` keys:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

Load Cloudflare env before Wrangler commands:

```bash
set -a
. ./.env.cloudflare.local
set +a
```

## Supabase Migration Context

This repository was migrated in July 2026 from the retired Supabase project `wqnrywhafxutgginzbvk` to `hjbvdtaeqqlyabmklrmg`.

Keep these migration artifacts in mind during debugging:

1. Auth, profile, and ownership issues can still come from partial user remap state rather than current application code.
2. `public.users.email` can temporarily contain parked values in the form `migrating+<old-user-id>+<email>` while recreated auth accounts are being matched.
3. If reports exist but profile/email state looks wrong, check [SUPABASE_MIGRATION_TODO.md](c:/Users/mmilosev/gderupa/SUPABASE_MIGRATION_TODO.md), [scripts/prepare-user-id-remap.sql](c:/Users/mmilosev/gderupa/scripts/prepare-user-id-remap.sql), and [scripts/finalize-user-id-remap.sql](c:/Users/mmilosev/gderupa/scripts/finalize-user-id-remap.sql) before changing app logic.
4. Ignore stale Supabase project IDs in generated output folders such as `.next`, `.open-next`, `.pages-deploy`, and `.vercel`; only source files and current env/config files are authoritative.

## GTM And Consent

The current Google Tag Manager integration is app-gated rather than Google Consent Mode driven.

1. The active GTM container ID is `GTM-54BV9VPG`.
2. GTM loads only after the user explicitly accepts anonymous analytics in the site consent banner.
3. If the user rejects analytics, the GTM script and `noscript` iframe are not rendered at all.
4. Because GTM is blocked entirely until opt-in, the GTM container does not currently need Consent Mode `default` or `update` events to respect the banner decision.
5. Keep GTM-side setup simple unless the app is intentionally upgraded to full Google Consent Mode. Standard GA4 tags are fine, but do not add a second hardcoded GTM snippet outside the app shell.
6. If a previously used device shows old auth or analytics behavior that a new device does not reproduce, suspect stale browser caches or an old service worker before changing source config. The app now includes a one-time client cache reset for that recovery path.

## Standard Checks

Run these before handing off code changes:

```bash
npm run test
npm run type-check
npm run lint
npm run build:pages
```

`npm run build:pages` is the closest local equivalent to the Cloudflare Pages advanced-mode build. It creates `.open-next` and `.pages-deploy`, both ignored.

## Post-Push Verification

After every push or deployment-related update, verify both automation layers:

1. GitHub Actions run for the pushed commit is `success`.
2. Cloudflare Pages has a successful deployment whose trigger commit hash matches the pushed commit.
3. `https://evorupa.pages.dev/` returns HTTP 200.
4. Supabase access works from production: the home page must render a nonzero `Ukupno prijava` count when the `reports` table has rows.

Useful commands:

```bash
gh run list --repo mmilosevic14/evorupa --limit 5

set -a
. ./.env.cloudflare.local
set +a
npx wrangler pages deployment list --project-name evorupa

curl -I https://evorupa.pages.dev/
```

Do not treat a green GitHub build alone as enough. The deployed Cloudflare version and the production Supabase-backed UI must be checked as well.

## Local Preview

For Cloudflare Pages preview:

```bash
npm run build:pages
set -a
. ./.env.cloudflare.local
set +a
npx wrangler pages dev .pages-deploy --port 8788 --ip 127.0.0.1
```

Verify with:

```bash
curl -I http://127.0.0.1:8788/
```

## Deploy Targets

The primary Cloudflare Pages project name is:

```text
evorupa
```

The legacy Cloudflare Pages project name is:

```text
gderupa
```

GitHub Actions deploys the same `.pages-deploy` artifact to both projects. Keep both projects' native Cloudflare Git deployments disabled; they are not the source of truth.

Deploy command:

```bash
npm run deploy:pages
```

GitHub Actions is the source of truth for production deploys. Cloudflare Pages native GitHub deployments are disabled for both `evorupa` and `gderupa` because they have failed before `clone_repo`/`build` initialization. Do not re-enable native Git deployments unless you also prove that the deployed Cloudflare commit matches the pushed GitHub commit and that production Supabase access still works.

## Known Local Benchmarks

Measured on this workstation:

| Environment | npm ci | test | type-check | lint | build:pages |
| --- | ---: | ---: | ---: | ---: | ---: |
| WSL Linux FS `~/src/evorupa` | about 2m | 13.55s | 20.77s | 14.99s | 135.56s |
| Windows `D:\Git\evorupa` | 103.84s | 7.99s | 21.19s | 19.11s | 146.67s |
| WSL on `/mnt/d/Git/evorupa` | about 14m | 47.83s | passed | slow | much slower |

The speed difference between Windows and WSL Linux FS is small for full builds. Prefer WSL Linux FS because it avoids OpenNext's Windows compatibility warning and matches the Cloudflare/Linux deployment shape more closely.
