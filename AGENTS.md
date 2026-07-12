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
