# GDeRupa - Complete Build & Deploy Guide

## Prerequisites

Before you start, you need:

1. **Supabase Account** - Create one at https://supabase.com
2. **GitHub Account** - For CI/CD pipeline
3. **Cloudflare Account** - For hosting (free tier available)
4. **Node.js** - v18+ installed

---

## Step 1: Supabase Setup

### Create a Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Select a region (EU - Frankfurt recommended for Serbia)
4. Set a strong database password
5. Wait 2-3 minutes for creation

### Create Database Tables

1. In Supabase Dashboard, go to **SQL Editor**
2. Copy the entire SQL from `SETUP_DATABASE.md`
3. Run the SQL script

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

**How to get these values:**

1. Go to Cloudflare dashboard at https://dash.cloudflare.com
2. Go to **Account Settings** (bottom left)
3. Copy your **Account ID**
4. Go to **API Tokens** tab
5. Click **Create Token**
6. Use "Edit Cloudflare Workers" template
7. Create and copy the token

### Push to GitHub

```bash
git add .
git commit -m "Initial commit: GDeRupa project with map and reporting"
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
6. Select your `gderupa` repository
7. Configure build settings:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build:cf`
   - **Build output directory**: `.vercel/output/static`

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
   - Your production URL (e.g., `https://gderupa.pages.dev`)
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
4. Build for Cloudflare
5. Deploy to Cloudflare Pages

Check the build status in GitHub → Actions.

### Manual Deployment

If needed, deploy locally:

```bash
npm run build:cf
npm run deploy:cf
```

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
- Verify all environment variables are set
- Run `npm run build:cf` locally to reproduce

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
