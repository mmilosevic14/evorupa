# Quick Deploy to Cloudflare Pages

## Option 1: Fast Cloud Deployment (Recommended - 5 minutes)

### Step 1: Create GitHub Repository

```bash
# Initialize if needed (you have .git already)
# Go to https://github.com/new
# Create a new repository (name: gderupa)
# Copy the repository URL
```

### Step 2: Add GitHub Remote & Push

```bash
git remote add origin https://github.com/YOUR_USERNAME/gderupa.git
git branch -M main
git add .
git commit -m "Deploy GDeRupa to Cloudflare Pages"
git push -u origin main
```

### Step 3: Set Up GitHub Secrets

1. Go to: https://github.com/YOUR_USERNAME/gderupa/settings/secrets/actions
2. Create two new secrets:
   - Name: `CLOUDFLARE_ACCOUNT_ID` → Value: (from Cloudflare dashboard)
   - Name: `CLOUDFLARE_API_TOKEN` → Value: (from Cloudflare API tokens)

**How to get Cloudflare credentials:**
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create API Token with "Edit Cloudflare Workers" template
3. Copy the token
4. Go to Account Settings, copy Account ID

### Step 4: Create Cloudflare Pages Project

1. Go to https://dash.cloudflare.com
2. Click "Pages" → "Create a project"
3. Connect GitHub → Select your repository
4. Build settings:
   - Framework: Next.js
   - Build command: `npm run build:cf`
   - Build output: `.vercel/output/static`
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Step 5: Deploy!

Just push to GitHub - CI/CD handles everything:
```bash
git push origin main
```

Your app will be live at: `https://gderupa.pages.dev` in ~2-3 minutes

---

## Option 2: Local Build (If You Prefer - 15 minutes)

```bash
# Wait for npm install to finish
# Then run:
npm run build:cf
npm run deploy:cf
```

(Requires Wrangler authentication)

---

## Your Current Setup Status

✅ Next.js 14 configured  
✅ Supabase credentials in .env.local  
✅ GitHub repo initialized (.git exists)  
✅ GitHub Actions workflow ready  
✅ Code ready to deploy  

❌ GitHub remote not set up yet  
❌ GitHub secrets not configured  
❌ Cloudflare Pages project not created  

---

## Next Steps

Tell me:
1. Do you have GitHub account? (What username?)
2. Do you have Cloudflare account?
3. Want me to generate the GitHub push commands?

Or just provide your GitHub repository URL and I'll give you exact commands to run.
