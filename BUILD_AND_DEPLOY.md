# EvoRupa - Complete Build & Deploy Guide

## Prerequisites

Before you start, you need:

1. **Supabase Account** - Create one at https://supabase.com
2. **GitHub Account** - For CI/CD pipeline
3. **Cloudflare Account** - For hosting (free tier available)
4. **Node.js** - v18+ installed

---

## Step 1: Supabase Setup

### Create a Supabase Project

1. This repo is already migrated to Supabase project `hjbvdtaeqqlyabmklrmg`
2. If you are provisioning a new environment, create or select the target Supabase project
3. Select a region (EU - Frankfurt recommended for Serbia)
4. Set a strong database password
5. Wait 2-3 minutes for creation

### Create Database Tables

Use the repo-managed Supabase scaffold as the default workflow:

```bash
supabase db reset
supabase db push
```

Primary database sources:

- `supabase/migrations/`
- `supabase/seed.sql`
- `supabase/manual/`

Use `SETUP_DATABASE.md` only for recovery, dashboard-only execution, or historical reference.

### Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click **Create a new bucket**
3. Bucket name: `report-photos`
4. Make it **Public**
5. Click **Create bucket**

### Get API Credentials

1. Go to **Settings → API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

---

## Step 2: Local Setup

### Create Environment File

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_URL.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY_HERE
```

### Install Dependencies

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

**Test the following:**
- Landing page loads
- Navigate to `/map` page
- Navigate to `/report` page
- Try uploading a report with a photo

---

## Step 3: GitHub Setup

### Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository
3. Clone it locally or push existing code

### Add GitHub Secrets

In your GitHub repository:

1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret** and add:

```
Name: CLOUDFLARE_ACCOUNT_ID
Value: [Your Cloudflare Account ID]

Name: CLOUDFLARE_API_TOKEN  
Value: [Your Cloudflare API Token]
```

The GitHub Actions workflow reads the public Supabase URL and publishable key from [lib/supabase-public-config.json](lib/supabase-public-config.json), so those public values do not need to be duplicated in GitHub Actions secrets for the default production setup.

**How to get these values:**

1. Go to Cloudflare dashboard at https://dash.cloudflare.com
2. Go to **Account Settings** (bottom left)
3. Copy your **Account ID**
4. Go to **API Tokens** tab
5. Click **Create Token**
6. Use "Edit Cloudflare Workers" template
7. Create and copy the token

Wrangler access note:

- Cloudflare Pages automatic builds from GitHub do not depend on a local `wrangler login` session.
- Local commands such as `npm run deploy:pages` and `npm run deploy:worker` do depend on Wrangler authentication.

For local/manual deploy access, validate Wrangler before deploying:

```bash
npx wrangler login
npx wrangler whoami
```

If you prefer token-based local access, set these values in `.env.cloudflare.local` for helper scripts and in your shell for direct Wrangler usage:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```

Recommended token permissions:

- `Account` / `Cloudflare Pages` / `Edit`
- `Account` / `Workers Scripts` / `Edit` if you use the Worker fallback deploy

### Push to GitHub

```bash
git add .
git commit -m "Initial commit: EvoRupa project with map and reporting"
git push origin main
```

---

## Step 4: Cloudflare Pages Setup

### Create Cloudflare Pages Project

1. Go to https://dash.cloudflare.com
2. Select your domain (or create one)
3. Go to **Pages** → **Create a project**
4. Select **Connect to Git**
5. Authorize GitHub
6. Select your `evorupa` repository
7. Configure build settings:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build:pages`
   - **Build output directory**: `.pages-deploy`

### Set Environment Variables in Cloudflare

1. In Cloudflare Pages project settings
2. Go to **Settings → Environment variables**
3. Add production variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

4. Add preview environment variables (same as production)

### Configure Supabase Auth

After getting your Cloudflare Pages URL:

1. Go to **Supabase Dashboard → Settings → Auth**
2. Under **Authorized redirect URLs**, add:
   - Your production URL (e.g., `https://evorupa.pages.dev`)
   - Any preview URLs you'll use
   - Keep `http://localhost:3000` for local development

---

## Step 5: Deploy

### Automatic Deployment (CI/CD)

The GitHub Actions workflow is already configured. Simply push to main:

```bash
git push origin main
```

The CI/CD pipeline will:
1. Install dependencies
2. Run type checks
3. Run linting
4. Run tests
5. Build the Pages advanced-mode bundle
6. Deploy the verified `.pages-deploy` artifact to both Cloudflare Pages projects

Deployment note:

- GitHub Actions is the deployment path for production.
- The workflow deploys the built `.pages-deploy` artifact directly with Wrangler.
- Native Cloudflare Git builds are not the source of truth for production.
- Cloudflare Pages source settings may still show legacy Git metadata, but the successful production signal is the deployment record for the pushed commit hash.

### Why Builds Were Broken Before

The July 2026 production deploy failure was not caused by Cloudflare Pages failing to build the app from source.

- The real blocker was the GitHub Actions workflow failing in `npm ci` before the Pages artifact was built.
- Because production deploys come from GitHub Actions uploading `.pages-deploy` with Wrangler, Cloudflare had nothing new to deploy when CI stopped at dependency install.
- Public Cloudflare project settings were misleading during diagnosis because they still showed legacy Git metadata, even though production was already driven by the GitHub Actions artifact deploy.
- Local Wrangler commands on this workstation were also a poor primary signal because `wrangler whoami` and local deploy attempts hit a TLS or proxy-style `fetch failed` error unrelated to the GitHub-hosted CI environment.

### What To Check First If It Happens Again

Use this order instead of starting in the Cloudflare dashboard:

1. Check the latest GitHub Actions run for `.github/workflows/cloudflare-pages.yml`.
2. If the run failed in `Install dependencies`, download the `npm-debug-logs-run-*` artifact and inspect the captured npm debug logs.
3. Confirm whether the failing commit ever produced `.pages-deploy`; if not, Cloudflare is downstream and not the root cause.
4. Confirm the workflow still has Node 22, `npm ci --no-audit`, retry logic, and npm cache cleanup between attempts.
5. Confirm `package.json` still pins the transitive `cloudflare` dependency to the known-good version used by this repo.
6. Only after CI is green, check Cloudflare Pages deployments for the pushed commit hash on both `evorupa` and `gderupa`.
7. If local Wrangler commands fail but GitHub Actions succeeds, treat the local machine as an environment-specific auth or TLS problem rather than a production deploy failure.

Check the build status in GitHub → Actions.

### Manual Deployment

If needed, deploy locally to Pages:

```bash
npx wrangler whoami
npm run build:pages
npm run deploy:pages
```

If `npx wrangler whoami` fails, fix Cloudflare authentication first. A successful local build alone is not enough for manual deployment.

---

## Step 6: Verify Deployment

After deployment completes:

1. Visit your Cloudflare Pages URL
2. Test the map page
3. Try creating a report
4. Verify photo upload works
5. Check that report appears on map

---

## Troubleshooting

### Map shows but no reports appear

- Check Supabase connection in browser console (F12)
- Verify database tables were created
- Check RLS policies in Supabase

### Photo upload fails

- Verify `report-photos` bucket exists in Supabase Storage
- Check bucket is set to Public
- Verify storage RLS policies allow uploads

### "Unauthorized" errors

- Check Supabase API keys in `.env.local`
- Verify auth redirect URLs in Supabase
- Check browser console for specific error messages

### Build fails on Cloudflare

- Check GitHub Actions logs
- Check Cloudflare Pages deployment logs in the Cloudflare dashboard
- Verify all environment variables are set
- Run `npm run build:pages` locally to reproduce
- Verify Cloudflare Pages is connected to `mmilosevic14/evorupa` and not an older repository slug

### Supabase not connecting

- Verify `.env.local` has correct credentials
- Check no typos in project URL
- Try restarting dev server: `npm run dev`

---

## Next Steps

After deployment:

1. **Add Authentication** - Set up login/signup pages
2. **Create Admin Panel** - Manage reports and users
3. **Add Real-time Updates** - Use Supabase subscriptions
4. **Set Up Notifications** - Email/push notifications
5. **Performance Optimization** - Add caching and CDN

See `DEVELOPMENT_PLAN.md` for detailed roadmap.

---

## Quick Reference Commands

```bash
# Local development
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Build for Cloudflare
npm run build:cf

# Deploy to Cloudflare (manual)
npm run deploy:cf

# Sync Cloudflare secrets to GitHub
npm run sync:cf:secrets
```

---

## Important Files

- `.env.local` - Local environment variables (git-ignored)
- `.github/workflows/cloudflare-pages.yml` - CI/CD configuration
- `SETUP_DATABASE.md` - SQL to set up Supabase
- `app/map/page.tsx` - Map display page
- `app/report/page.tsx` - Report form page
- `components/MapComponent.tsx` - Leaflet map component
- `lib/supabase.ts` - Supabase client exports
- `utils/supabase/client.ts` - Browser client
- `utils/supabase/server.ts` - Server client
- `utils/supabase/middleware.ts` - Session middleware

---

## Support

For issues, check:
1. GitHub Actions logs for build errors
2. Browser console (F12) for client errors
3. Supabase logs for database errors
4. Cloudflare Pages build logs
