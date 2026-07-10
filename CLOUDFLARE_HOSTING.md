# EvoRupa - Cloudflare Pages and Workers Hosting

This guide explains how to build and deploy the project to Cloudflare Pages with Workers runtime support.

## 1. Required Secrets

Store these as GitHub repository secrets:

- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_API_TOKEN

The project includes a local helper file:

- .env.cloudflare.local (local only, ignored by git)

## 2. One-Time Setup

1. Ensure dependencies are installed:

```bash
npm install
```

2. Ensure Cloudflare scripts exist in package scripts:

- build:cf
- deploy:cf
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

Important:

- Cloudflare Pages must be connected to the active GitHub repository slug.
- This repository has moved from `mmilosevic14/gderupa` to `mmilosevic14/evorupa`.
- If Pages is still connected to the old repository slug, pushes can succeed on GitHub while `evorupa.pages.dev` keeps serving a stale deployment.

## 4. Local Build and Deploy

Build for Cloudflare output:

```bash
npm run build:cf
```

Manual deploy from local machine:

```bash
npm run deploy:cf
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

Verify CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN secrets exist in GitHub.

### Build succeeds but production stays stale

Check two things first:

- Cloudflare Pages project is connected to `mmilosevic14/evorupa`
- Cloudflare Pages build settings still use `npm run build:cf` and `.vercel/output/static`

### Auth works local but not in production

Update Supabase Auth URL configuration to include the deployed Cloudflare domain.

## 7. Operational Checklist

- [ ] GitHub secrets configured
- [ ] Cloudflare workflow present
- [ ] Supabase auth redirect URLs updated
- [ ] npm run build:cf passes
- [ ] push to main/master triggers successful deploy
