# EvoRupa - Cloudflare Pages Hosting

This guide explains how to build and deploy the project to Cloudflare Pages in advanced mode, where Pages remains the public host and the generated OpenNext worker handles dynamic routes.

## 1. Required Secrets

Store these as GitHub repository secrets:

- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_API_TOKEN

The project includes a local helper file:

- .env.cloudflare.local (local only, ignored by git)

## 1.1 Wrangler and Cloudflare Access

There are two separate access paths in this project:

- Cloudflare Pages automatic builds from GitHub
- local/manual Cloudflare deploys through Wrangler

Automatic builds from Cloudflare Pages do not use your local Wrangler session. They require:

- the Cloudflare Pages project to be connected to `mmilosevic14/evorupa`
- GitHub access authorized in Cloudflare
- `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` available where local helper scripts or GitHub-secret sync need them

Manual local deploys do require Wrangler authentication. Recommended options:

1. Interactive login:

```bash
npx wrangler login
npx wrangler whoami
```

2. API token via environment or local helper file:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```

Minimum token access for manual Pages deploys:

- `Account` / `Cloudflare Pages` / `Edit`
- `Account` / `Workers Scripts` / `Edit` if you also use the Worker fallback flow

You can create the token in Cloudflare Dashboard:

- `My Profile` -> `API Tokens` -> `Create Token`

This repo's helper script `npm run sync:cf:secrets` reads `.env.cloudflare.local` and writes `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` into GitHub repository secrets.

## 2. One-Time Setup

1. Ensure dependencies are installed:

```bash
npm install
```

2. Ensure Cloudflare scripts exist in package scripts:

- build:cf
- build:pages
- deploy:pages
- sync:cf:secrets

3. Sync secrets to GitHub (after gh auth login):

```bash
npm run sync:cf:secrets
```

## 3. CI/CD Lifecycle

Workflow file:

- .github/workflows/cloudflare-pages.yml

Behavior:

- pull_request to main/master: install, type-check, lint, build
- push to main/master: install, type-check, lint, build
- deployment is handled by Cloudflare Pages native GitHub integration, not by GitHub Actions
- workflow_dispatch: manual trigger

CI validation target:

- `npm run build:pages`
- this must produce a `.pages-deploy` bundle with `_worker.js` for Pages advanced mode

Important:

- Cloudflare Pages must be connected to the active GitHub repository slug.
- This repository has moved from `mmilosevic14/gderupa` to `mmilosevic14/evorupa`.
- If Pages is still connected to the old repository slug, pushes can succeed on GitHub while `evorupa.pages.dev` keeps serving a stale deployment.

## 4. Local Build and Deploy

Build the Cloudflare Pages output:

```bash
npm run build:pages
```

Manual deploy to Cloudflare Pages from local machine:

```bash
npm run deploy:pages
```

Local preview of the exact Pages bundle:

```bash
npm run preview:pages
```

## 5. Supabase + Cloudflare Runtime Notes

After deployment, configure Auth redirect URLs in Supabase:

- Site URL: your Cloudflare Pages production URL
- Redirect URLs: production URL and preview URLs if needed

Also keep local URL during development:

- http://localhost:3000

## 6. Troubleshooting

### gh command not found

Install GitHub CLI and authenticate:

```bash
gh auth login
```

### wrangler authentication issues

Check the right auth path for the operation you are performing:

- for local deploys: run `npx wrangler whoami` and verify `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN`
- for `npm run sync:cf:secrets`: verify `.env.cloudflare.local` exists locally and `gh auth login` is already done
- for automatic production builds: verify the Pages project is connected to `mmilosevic14/evorupa` in Cloudflare

### Build succeeds but production stays stale

Check two things first:

- Cloudflare Pages project is connected to `mmilosevic14/evorupa`
- Cloudflare Pages build settings match the current OpenNext Pages flow instead of the old `.vercel/output/static` output

### Auth works local but not in production

Update Supabase Auth URL configuration to include the deployed Cloudflare domain.

## 7. Operational Checklist

- [ ] GitHub secrets configured
- [ ] Cloudflare workflow present
- [ ] Supabase auth redirect URLs updated
- [ ] npm run build:pages passes
- [ ] push to main/master triggers successful deploy
