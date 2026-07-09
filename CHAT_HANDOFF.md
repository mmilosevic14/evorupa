# Chat Handoff - EvoRupa

Use this file when opening a new chat with this folder.

## Current State

- Next.js 14 + TypeScript app scaffold is in place.
- Supabase integration is implemented (client, server, middleware, auth pages).
- Cloudflare Pages CI/CD lifecycle is configured.

## Critical Files

- README.md
- GETTING_STARTED.md
- PROJECT_SUMMARY.md
- SETUP_DATABASE.md
- SUPABASE_INTEGRATION.md
- CLOUDFLARE_HOSTING.md
- .github/workflows/cloudflare-pages.yml

## Local Secret Files

- .env.local (Supabase values)
- .env.cloudflare.local (Cloudflare values)

Both are git-ignored and should not be committed.

## What is Already Automated

- CI build on pull requests and pushes
- Deploy to Cloudflare Pages on push to main/master
- Helper script for syncing Cloudflare secrets to GitHub

## First Commands in New Chat

```bash
npm install
npm run type-check
npm run lint
npm run build:cf
```

## Operational Steps (Supabase + Cloudflare)

1. Confirm Supabase tables/policies were applied from SETUP_DATABASE.md.
2. Confirm Supabase Auth URL configuration includes deployed Cloudflare domain.
3. Confirm GitHub secrets exist:
   - CLOUDFLARE_ACCOUNT_ID
   - CLOUDFLARE_API_TOKEN
4. Push to main/master and verify workflow success.

## Suggested Prompt for Next Chat

"Read CHAT_HANDOFF.md and continue implementation from current state. First validate npm scripts, Cloudflare workflow, and Supabase auth/data flow end-to-end, then continue with map/report/admin feature completion."
