# GDeRupa - Cloudflare Pages and Workers Hosting

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
- push to main/master: install, type-check, lint, build, deploy to Cloudflare Pages
- workflow_dispatch: manual trigger

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

### Build succeeds but deploy fails in CI

Check workflow run logs for the deploy step in cloudflare-pages.yml.

### Auth works local but not in production

Update Supabase Auth URL configuration to include the deployed Cloudflare domain.

## 7. Operational Checklist

- [ ] GitHub secrets configured
- [ ] Cloudflare workflow present
- [ ] Supabase auth redirect URLs updated
- [ ] npm run build:cf passes
- [ ] push to main/master triggers successful deploy
