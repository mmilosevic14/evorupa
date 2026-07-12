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

The configured Cloudflare Pages project name is:

```text
evorupa
```

`gderupa` may also exist in the Cloudflare account. Do not deploy to it unless the owner explicitly confirms it is the intended target.

Deploy command:

```bash
npm run deploy:pages
```

## Known Local Benchmarks

Measured on this workstation:

| Environment | npm ci | test | type-check | lint | build:pages |
| --- | ---: | ---: | ---: | ---: | ---: |
| WSL Linux FS `~/src/evorupa` | about 2m | 13.55s | 20.77s | 14.99s | 135.56s |
| Windows `D:\Git\evorupa` | 103.84s | 7.99s | 21.19s | 19.11s | 146.67s |
| WSL on `/mnt/d/Git/evorupa` | about 14m | 47.83s | passed | slow | much slower |

The speed difference between Windows and WSL Linux FS is small for full builds. Prefer WSL Linux FS because it avoids OpenNext's Windows compatibility warning and matches the Cloudflare/Linux deployment shape more closely.
