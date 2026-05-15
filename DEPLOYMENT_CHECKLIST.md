# GDeRupa - Deployment Checklist

Use this checklist to ensure everything is properly configured before deploying to Cloudflare Pages.

---

## ✅ Pre-Deployment Checklist

### 1. Supabase Configuration

- [ ] Supabase project created
- [ ] Database tables created (run SQL from SETUP_DATABASE.md)
- [ ] `report-photos` storage bucket created and set to Public
- [ ] RLS policies configured for storage bucket
- [ ] Project URL and anon key copied to `.env.local`
- [ ] Auth redirect URLs configured in Supabase Settings

**Auth Redirect URLs to Add:**
```
http://localhost:3000         # Development
https://gderupa.pages.dev    # Production (update with your domain)
https://*.pages.dev          # Cloudflare preview URLs
```

### 2. Local Development

- [ ] `.env.local` file created with Supabase credentials
- [ ] `npm install` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] Landing page (`/`) loads correctly
- [ ] Map page (`/map`) displays correctly
- [ ] Report form (`/report`) works
- [ ] Can upload test report with photo
- [ ] `npm run type-check` passes (no TypeScript errors)
- [ ] `npm run lint` passes (no linting errors)

### 3. GitHub Setup

- [ ] Repository created on GitHub
- [ ] Code pushed to main branch
- [ ] GitHub Secrets configured:
  - [ ] `CLOUDFLARE_ACCOUNT_ID`
  - [ ] `CLOUDFLARE_API_TOKEN`
- [ ] `.github/workflows/cloudflare-pages.yml` exists
- [ ] GitHub Actions are enabled

### 4. Cloudflare Configuration

- [ ] Cloudflare account created
- [ ] Domain added to Cloudflare (or using pages.dev subdomain)
- [ ] Account ID and API token obtained
- [ ] GitHub secrets configured with these values
- [ ] Cloudflare Pages project created
- [ ] Connected to GitHub repository
- [ ] Build settings configured:
  - [ ] Framework: Next.js
  - [ ] Build command: `npm run build:cf`
  - [ ] Build output: `.vercel/output/static`
- [ ] Environment variables added to Cloudflare:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 5. Features to Test Before Deploy

- [ ] Landing page has working navigation
- [ ] Map page:
  - [ ] Map loads with OpenStreetMap tiles
  - [ ] Reports display as markers
  - [ ] Click marker shows popup with details
  - [ ] Filtering works (if implemented)
- [ ] Report form:
  - [ ] Title/description input works
  - [ ] Category selection works
  - [ ] Photo upload with preview works
  - [ ] Geolocation displays latitude/longitude
  - [ ] Form submission works
  - [ ] Success message appears
  - [ ] Report appears on map after submission

### 6. Security Checks

- [ ] `.env.local` is in `.gitignore` (won't be committed)
- [ ] `.env.cloudflare.local` is in `.gitignore`
- [ ] No API tokens in code comments
- [ ] No passwords in version control
- [ ] HTTPS enforced for production
- [ ] RLS policies set up in Supabase
- [ ] Storage bucket has proper permission policies

### 7. Build & Deployment

- [ ] `npm run build:cf` completes successfully locally
- [ ] No console errors during build
- [ ] No TypeScript compilation errors
- [ ] GitHub Actions workflow runs successfully on push
- [ ] Cloudflare deployment shows "Success"
- [ ] Production URL is accessible

### 8. Post-Deployment Verification

- [ ] Visit production URL
- [ ] All pages load correctly
- [ ] Map displays without errors
- [ ] Can create a new report
- [ ] Photo upload to production storage works
- [ ] Real-time updates work (reports appear immediately)
- [ ] No console errors in browser
- [ ] Performance is acceptable (< 2s page load)

---

## 🚀 Deployment Steps

### Step 1: Final Local Testing

```bash
# Clear any build artifacts
rm -rf .next
rm -rf .vercel

# Install dependencies
npm install --legacy-peer-deps

# Type check
npm run type-check

# Lint
npm run lint

# Local dev test
npm run dev
# Test all pages, forms, and features
```

### Step 2: Build for Cloudflare

```bash
npm run build:cf
```

Check that build completes without errors.

### Step 3: Commit and Push

```bash
git add .
git commit -m "Deploy GDeRupa to Cloudflare Pages"
git push origin main
```

### Step 4: Monitor CI/CD

1. Go to GitHub repository
2. Click "Actions" tab
3. Watch the deployment workflow
4. Should see: install → type-check → lint → build → deploy

### Step 5: Verify Production

1. Visit your Cloudflare Pages URL
2. Test all features
3. Check browser console (F12) for errors
4. Test on mobile if possible

---

## 🔧 Troubleshooting Deployment

### Build Fails with "Cannot find module"

**Solution:** 
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build:cf
```

### "Environment variables are not set"

**Solution:** Check Cloudflare Pages → Settings → Environment variables
- Should have `NEXT_PUBLIC_SUPABASE_URL`
- Should have `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Map doesn't load in production

**Solution:** Check browser console for errors
- Verify Leaflet CDN URLs are accessible
- Check Supabase connection
- Verify CORS settings

### Photo upload fails in production

**Solution:**
- Verify `report-photos` bucket exists in Supabase
- Check storage RLS policies allow authenticated uploads
- Verify bucket is public

### "unauthorized" or 403 errors

**Solution:**
- Check Supabase API keys in environment variables
- Verify RLS policies in Supabase
- Check auth redirect URLs include production domain

---

## 📊 Performance Targets

After deployment, verify:

- [ ] Page load: < 2 seconds
- [ ] API response: < 500ms
- [ ] Map initialization: < 1 second
- [ ] Report submission: < 5 seconds
- [ ] Mobile responsiveness: Works on 320px width
- [ ] Browser compatibility: Chrome, Firefox, Safari, Edge

---

## 🔄 Rollback Procedure

If deployment breaks production:

1. **Revert commit:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Redeploy from previous version**
   - GitHub Actions will auto-trigger
   - Cloudflare will deploy previous build

3. **Check deployment status:**
   - GitHub Actions tab
   - Cloudflare Pages deployments

---

## 📞 Post-Deployment Support

After going live:

1. **Monitor for errors:**
   - Check Cloudflare dashboard for 5xx errors
   - Monitor Supabase logs for database errors
   - Check GitHub Actions for workflow failures

2. **Performance monitoring:**
   - Use Cloudflare Analytics
   - Monitor database query times
   - Check API response times

3. **User feedback:**
   - Collect bug reports
   - Monitor error logs
   - Track feature requests

---

## 🎉 You're Live!

After successful deployment:

1. Share your Cloudflare Pages URL
2. Test with real users
3. Gather feedback
4. Plan Phase 2 improvements

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for next features to implement.

---

**Deployment Date: ___________**
**Production URL: ___________**
**Notes: ___________**
