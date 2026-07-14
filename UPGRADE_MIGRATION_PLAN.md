# Upgrade Migration Plan

This plan is for agents migrating framework and dependency versions. Keep migrations small and verify production after every push.

## Ground Rules

- Work from latest `origin/main`.
- Use Node 22 from `.nvmrc` unless running a dedicated Node migration phase.
- Do not mix unrelated major migrations.
- Keep Cloudflare Pages native Git deployments disabled for both `evorupa` and `gderupa`.
- GitHub Actions is the deploy source of truth.
- Do not treat a green GitHub build alone as enough. Verify the deployed Cloudflare commit and live Supabase-backed UI.
- Do not print secrets. It is safe to report variable names and whether they are present.

## Verification Cycle

Run this cycle for every migration step:

```bash
npm ci
npm run lint
npm run type-check
npm run test
npm run build:pages
```

Then:

```bash
git status --short --branch
git add <changed files>
git commit -m "<focused migration message>"
git push origin main
```

After push:

```bash
gh run list --repo mmilosevic14/evorupa --limit 5
gh run view <run-id> --repo mmilosevic14/evorupa --json status,conclusion,url,jobs

npx wrangler pages deployment list --project-name evorupa
npx wrangler pages deployment list --project-name gderupa

curl -I https://evorupa.pages.dev/
curl -I https://gderupa.pages.dev/
```

The successful GitHub Actions run must include:

- `Deploy to Cloudflare Pages`
- `Verify Cloudflare Pages deployment`
- verified deployment for `evorupa`
- verified deployment for `gderupa`
- `Supabase reports count` greater than zero
- `rendered home count` greater than zero

The home page currently limits the rendered count to 100, so a database count above 100 and rendered count 100 is acceptable.

## Phase 0: Baseline

Before changing dependencies:

```bash
git pull --ff-only
npm ci
npm run lint
npm run type-check
npm run test
npm run build:pages
```

Verify current automation and live sites:

```bash
gh run list --repo mmilosevic14/evorupa --limit 5
npx wrangler pages deployment list --project-name evorupa
npx wrangler pages deployment list --project-name gderupa
curl -I https://evorupa.pages.dev/
curl -I https://gderupa.pages.dev/
```

## Phase 1: Safe Patch And Minor Dependencies

Upgrade only:

```text
@supabase/ssr
@supabase/supabase-js
axios
pg
postcss
autoprefixer
@types/node@20
@types/react@18
@types/react-dom@18
```

Do not touch in this phase:

```text
next
react
react-dom
eslint
eslint-config-next
tailwindcss
next-pwa
react-leaflet
zustand
mapbox-gl
typescript major
```

Expected commands:

```bash
npm install @supabase/ssr@latest @supabase/supabase-js@latest axios@latest
npm install -D pg@latest postcss@latest autoprefixer@latest @types/node@20 @types/react@18 @types/react-dom@18
```

Run the full verification cycle before continuing.

## Phase 2: Next 16 Preparation Without Upgrading Next

Try config-only preparation on current Next 15:

- Remove `eslint.ignoreDuringBuilds` from `next.config.ts` if current Next accepts it without regressions.
- Test whether `"build": "next build --webpack"` works on current Next 15.

If current Next 15 rejects `--webpack`, do not force it. Leave the build script change for the Next 16 phase.

Run the full verification cycle.

## Phase 3: ESLint 9 Migration

Goal: make lint compatible with Next 16 before upgrading Next.

Upgrade:

```text
eslint@^9
@eslint/eslintrc
```

Fix `eslint.config.mjs`.

Known issue from the probe:

```text
FlatCompat + next/core-web-vitals can fail with:
TypeError: Converting circular structure to JSON
```

Do not upgrade Next in this phase. Run the full verification cycle.

## Phase 4: Next 16 Migration

Upgrade:

```text
next@16.2.x
eslint-config-next@16.2.x
```

Keep unchanged:

```text
react@18
react-dom@18
next-pwa@5.6.0
```

Required changes observed in the probe:

- Remove the `eslint` field from `next.config.ts`; Next 16 rejects it in `NextConfig`.
- Build with webpack explicitly because Next 16 defaults to Turbopack and `next-pwa` injects webpack config:

```json
"build": "next build --webpack"
```

- Accept and review the `tsconfig.json` change from `jsx: "preserve"` to `jsx: "react-jsx"` if Next applies it.
- Review added type includes for the configured dist directory.
- Note the `middleware` to `proxy` deprecation. Do not rename it unless needed for a green build/runtime.

Probe result:

- `npm run test` passed.
- `npm run type-check` passed after removing `eslint` from `next.config.ts`.
- `next build --webpack` passed.
- `npm run build:pages` failed under default Turbopack before adding explicit webpack mode.
- `npm run lint` failed until ESLint config is migrated.

Run the full verification cycle, especially `npm run build:pages` through OpenNext.

## Phase 5: PWA / next-pwa Decision

Investigate `next-pwa` separately after Next 16 is stable.

Current audit pressure includes `next-pwa` transitive dependencies through Workbox and `rollup-plugin-terser` / `serialize-javascript`.

Options:

- Keep `next-pwa` temporarily if production works.
- Replace `next-pwa` with a maintained PWA setup.
- Remove PWA if it is not required for the MVP.

Do not combine this with the Next 16 migration.

## Phase 6: React 19 Stack

Only after Next 16 is stable.

Upgrade together:

```text
react@19
react-dom@19
@types/react@19
@types/react-dom@19
react-leaflet@5
```

Manual smoke required:

- map renders
- popup opens
- report focus flow works
- report list works
- login/signup pages render
- account page renders
- report submission page renders

Run the full verification cycle.

## Phase 7: Remaining Major Upgrades

Separate pull requests / commits only:

```text
tailwindcss 4
zustand 5
mapbox-gl 3
react-map-gl 8
typescript latest major
```

Each major gets its own verification cycle and live deployment check.

## Node Version Migration

Current project baseline is Node 22:

- `.nvmrc` contains `22`
- GitHub Actions uses `node-version: 22`
- WSL primary development environment uses Node `v22.23.1`

Do not move to a newer Node version as part of dependency upgrades. Treat Node migration as a separate phase after dependency migrations are stable.

### Node Phase A: Local Probe

Use an isolated worktree:

```bash
git fetch origin
git worktree add ../evorupa-node-probe origin/main
cd ../evorupa-node-probe
```

Install and select the candidate Node version using `nvm`. For example:

```bash
nvm install 24
nvm use 24
node --version
npm --version
npm ci
```

Run the full local checks:

```bash
npm run lint
npm run type-check
npm run test
npm run build:pages
```

Also run a local Cloudflare preview:

```bash
set -a
. ./.env.cloudflare.local
set +a
npx wrangler pages dev .pages-deploy --port 8788 --ip 127.0.0.1
curl -I http://127.0.0.1:8788/
```

Do not proceed if native packages such as `sharp`, `esbuild`, or `workerd` fail install or runtime checks.

### Node Phase B: CI Matrix Probe

Add a temporary GitHub Actions matrix, but keep deploy only on Node 22:

```yaml
strategy:
  matrix:
    node-version: [22, 24]
```

Guard deploy steps:

```yaml
if: github.event_name == 'push' && matrix.node-version == 22
```

The Node 24 job must pass:

- install
- lint
- type-check
- test
- build:pages

Do not deploy from Node 24 yet.

### Node Phase C: Deploy From New Node

Only after the matrix is green on multiple pushes:

- update `.nvmrc`
- update GitHub Actions `node-version`
- remove the matrix or make the new version the sole deploy version
- push
- verify GitHub Actions
- verify both Cloudflare projects
- verify both live sites
- verify Supabase-backed rendered counts

Rollback plan:

- revert `.nvmrc`
- revert GitHub Actions `node-version`
- redeploy from Node 22

## Recommended First Task

Start with Phase 1 only. It has the lowest risk and validates that the CI/deploy/live smoke gates catch regressions before any framework major migration.
