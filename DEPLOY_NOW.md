# EvoRupa - Deploy Now (No Waiting!)

> Historical note: this document predates the July 2026 Supabase migration. If deployment or auth behavior looks inconsistent, verify current project settings against [AGENTS.md](c:/Users/mmilosev/gderupa/AGENTS.md) and [SUPABASE_MIGRATION_TODO.md](c:/Users/mmilosev/gderupa/SUPABASE_MIGRATION_TODO.md).

Your app is ready to deploy. Skip the local npm install - let's use the fast cloud path.

---

## 🚀 Deploy in 3 Steps

### Step 1: Push to GitHub (Run these commands)

```powershell
cd c:\Users\mmilosev\evorupa

# First time setup - add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/evorupa.git
git branch -M main

# Commit everything
git add .
git commit -m "Deploy EvoRupa - map and reporting app ready"

# Push to GitHub (will trigger auto-deploy)
git push -u origin main
```

**Note:** Replace `YOUR_USERNAME` with your actual GitHub username

---

### Step 2: GitHub Secrets (Do this in your browser)

1. Go to: `https://github.com/YOUR_USERNAME/evorupa/settings/secrets/actions`

2. Add **New repository secret**:
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: Get from https://dash.cloudflare.com/profile/api-tokens

3. Add another secret:
   - Name: `CLOUDFLARE_ACCOUNT_ID`  
   - Value: Get from https://dash.cloudflare.com/account/overview (top right)

---

### Step 3: Cloudflare Setup (Do this in your browser)

1. Go to https://dash.cloudflare.com
2. Click **Pages** (left sidebar)
3. Click **Create a project**
4. Click **Connect to Git**
5. Select your `evorupa` repository
6. **Build configuration:**
   - Framework: Next.js
   - Build command: `npm run build:cf`
   - Build output directory: `.vercel/output/static`
   - Root directory: `/`
7. **Environment variables** (add these):
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://hjbvdtaeqqlyabmklrmg.supabase.co`
   - Key: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  
   - Value: current publishable key from `.env.local`
8. Click **Save and Deploy**

---

## ⏱️ Timeline

- **Step 1 (Git push):** 30 seconds
- **Step 2 (GitHub secrets):** 2 minutes
- **Step 3 (Cloudflare setup):** 2 minutes
- **GitHub Actions building:** 2-3 minutes
- **Cloudflare deploying:** 1-2 minutes

**Total: ~8-10 minutes to live link** ✨

---

## 🔗 Your Test Link

Once deployed, visit:
```
https://evorupa.pages.dev
```

You can test:
- ✅ Landing page
- ✅ Interactive map
- ✅ Report form
- ✅ Photo upload
- ✅ Real-time map updates

---

## 🆘 Getting Your Credentials

### Cloudflare API Token:

1. Visit: https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers**
4. Click **Use template**
5. Leave defaults, click **Continue to summary**
6. Click **Create Token**
7. Copy the token (you won't see it again!)

### Cloudflare Account ID:

1. Visit: https://dash.cloudflare.com/account/overview
2. Copy **Account ID** (shown on the right side)

### GitHub:

If you don't have a GitHub account:
1. Go to https://github.com/signup
2. Create account (free)
3. Create new repository: https://github.com/new
4. Name: `evorupa`
5. Public or Private
6. Click Create Repository
7. Copy the URL (shown on the page)

---

## 📋 Checklist

Before running git commands, make sure:

- [ ] GitHub account created
- [ ] New repository created on GitHub
- [ ] Copied repository URL
- [ ] Cloudflare account created
- [ ] Have Cloudflare Account ID
- [ ] Have Cloudflare API Token

---

## ⚡ Quick Command Reference

```bash
# View current git status
git status

# See git remote
git remote -v

# Set remote (replace with your URL)
git remote set-url origin https://github.com/YOUR_USERNAME/evorupa.git

# Check what will be pushed
git log origin/main..main

# Push with verbose output
git push -u origin main -v
```

---

## 🎯 After Deployment

Your app is live! You can:

1. **Share the link:** `https://evorupa.pages.dev`
2. **Test on mobile:** Works on all devices
3. **Check Cloudflare dashboard:** See deployment status
4. **View GitHub Actions:** See build logs
5. **Monitor Supabase:** Check real-time database activity

---

## 🔍 Monitoring

- **Cloudflare Pages Dashboard:** See deployment status, logs, traffic
- **GitHub Actions:** See build logs, test results  
- **Supabase Dashboard:** See database, storage, API activity

---

## 📌 Important Notes

- App has NO authentication yet (as requested)
- Anyone can submit reports (no login required)
- Test with sample data
- Photos upload to Supabase (free tier includes storage)
- Real-time map updates work instantly

---

## 🚨 If Deployment Fails

Check GitHub Actions logs:
1. Go to your repository on GitHub
2. Click **Actions** tab
3. Click on the failed workflow
4. See error messages
5. Common issues:
   - Missing environment variables
   - Wrong Cloudflare credentials
   - Build step failing

---

**Ready? Let's go! 🚀**

Run the commands from Step 1 above and I'll help you troubleshoot if needed.
