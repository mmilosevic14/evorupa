# GitHub Copilot repository instructions

Use these instructions for GitHub Copilot coding agent, Copilot Chat, and VS Code agent mode when working in this repository. Also read and follow the repository-root `AGENTS.md`; it is the authoritative source for operational details and takes precedence if these instructions diverge.

## Project overview

- `evorupa` is a citizen-driven infrastructure reporting PWA for Serbia.
- The application uses Next.js 15, React 18, TypeScript, Supabase, Zustand, Vitest, and Cloudflare Pages through OpenNext.
- Use Node.js 22 and npm. Do not change the expected Node version or perform unrelated dependency upgrades.
- Prefer focused, minimal changes that preserve the existing architecture and user-facing Serbian terminology.

## Working environment

Prefer environments in this order:

1. WSL checkout on the Linux filesystem, normally `~/src/evorupa`.
2. Native Windows checkout.
3. WSL on a Windows-mounted path such as `/mnt/d/Git/evorupa` only as a last resort.

Install dependencies with:

```bash
. "$HOME/.nvm/nvm.sh"
nvm use 22
npm ci
```

Do not commit generated output or local environment files, including `.next`, `.open-next`, `.pages-deploy`, `.vercel`, `.env.local`, and `.env.cloudflare.local`.

## Secrets and environment variables

Never print, commit, or expose secret values. It is acceptable to report only variable names and whether they are present.

The main local application variables are:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SESSION_DATABASE_URL`

Cloudflare operations require:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Optional database fallbacks are documented in `AGENTS.md`. Before Wrangler commands, load `.env.cloudflare.local` as described there.

## Implementation guidance

- Follow existing TypeScript, React, Next.js, lint, and formatting conventions in nearby files.
- Prefer typed solutions; do not introduce `any`, unsafe assertions, or lint suppressions unless there is a documented need.
- Preserve server/client component boundaries and avoid exposing server-only Supabase credentials to browser code.
- Keep changes Cloudflare/OpenNext compatible; do not assume a traditional long-running Node.js server.
- Add or update Vitest coverage for changed behavior where practical.
- Do not modify generated artifacts to fix source problems.
- Keep authentication, ownership, and profile behavior compatible with the Supabase migration notes in `AGENTS.md`; legacy or partially remapped users may still exist.
- The active GTM container is app-gated by explicit analytics consent. Do not add another hardcoded GTM snippet or load analytics before opt-in.
- Before changing dependencies or Node versions, consult `UPGRADE_MIGRATION_PLAN.md` and keep migrations separate from unrelated work.

## Required validation

Run the smallest relevant checks while iterating. Before handing off a completed code change, run all of:

```bash
npm run test
npm run type-check
npm run lint
npm run build:pages
```

Do not claim a check passed unless it was actually run. If a check cannot run, state the exact reason and what remains unverified.

## Deployment guidance

- GitHub Actions is the source of truth for production deployments.
- The primary Cloudflare Pages project is `evorupa`; `gderupa` is the legacy target.
- Do not enable native Cloudflare Git deployments.
- Do not deploy, rotate secrets, change production data, or run destructive Supabase operations unless the user explicitly asks.
- For deployment-related work, follow the post-push verification checklist in `AGENTS.md`, including matching the Cloudflare deployment commit, checking `https://evorupa.pages.dev/`, and verifying production Supabase-backed data.

## Agent workflow

1. Read `AGENTS.md` and any task-relevant documentation before editing.
2. Inspect nearby implementation and tests; do not guess repository conventions.
3. Make the smallest coherent change that solves the task.
4. Update documentation and tests when behavior or operational steps change.
5. Run the required validation commands.
6. Summarize changed files, behavior, validation results, and any remaining risks without exposing secrets.
