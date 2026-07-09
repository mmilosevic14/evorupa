# EvoRupa - Quick Start Guide

## 📋 What is EvoRupa?

EvoRupa is a citizen-driven infrastructure problem reporting app for Serbia. Users can:
- 🗺️ View problems on an interactive map
- 📝 Report infrastructure issues (potholes, damaged roads, broken signs, etc.)
- 📷 Upload photos of problems
- 💬 Comment on and upvote problems
- 📊 Track status of reported issues

---

## 🚀 Quick Setup (5 minutes)

### 1. Environment Setup

Create `.env.local` in project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Get these from [Supabase Dashboard](https://app.supabase.com) → Settings → API

### 2. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 3. Create Supabase Storage Bucket

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Storage**
4. Create new bucket: `report-photos` (Public)
5. Set up RLS policies (see below)

### 4. Set Up RLS Policies

In Supabase SQL Editor, run:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND bucket_id = 'report-photos'
);

-- Allow public read access
CREATE POLICY "Public can read photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'report-photos');
```

---

## 🎯 Features

### Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Project overview |
| Map | `/map` | View all reported problems |
| Report | `/report` | Submit a new problem |
| Admin | `/admin` | Admin panel (coming soon) |

### Report Form Features

- 📍 Auto-detects your location (GPS)
- 📷 Photo upload with preview
- 🏷️ Category selection
- 📝 Detailed description
- 🔄 Real-time map updates

### Map Features

- 🗺️ Interactive Leaflet map
- 📌 Problem markers with status
- 🖱️ Click markers for details
- 🔴 Status indicators (pending/in-progress/resolved)

---

## 📦 Available Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:3000

# Building
npm run build            # Build for production
npm run build:cf         # Build for Cloudflare Pages
npm run deploy:cf        # Deploy to Cloudflare (manual)

# Code Quality
npm run type-check       # TypeScript check
npm run lint             # ESLint check
npm run sync:cf:secrets  # Sync Cloudflare secrets to GitHub

# Cleanup
npm run clean            # Remove build outputs
```

---

## 🌐 Deployment to Cloudflare

See [BUILD_AND_DEPLOY.md](./BUILD_AND_DEPLOY.md) for detailed instructions:

1. Set up GitHub repository
2. Add GitHub secrets (Cloudflare API token)
3. Configure Cloudflare Pages project
4. Push to main branch (auto-deploy via CI/CD)

---

## 🐛 Troubleshooting

### Map not showing

```
❌ Error: "Cannot read property 'container' of null"
✅ Solution: Make sure component is mounted. Check browser console for errors.
```

### Photo upload fails

```
❌ Error: "Bucket not found"
✅ Solution: Create 'report-photos' bucket in Supabase Storage
```

### Location not auto-detecting

```
❌ No GPS data
✅ Solution: Allow location permission in browser. Works on HTTPS only (production).
```

### "Supabase environment variables not set"

```
❌ Error in console
✅ Solution: Check .env.local has correct values from Supabase dashboard
```

---

## 📁 Project Structure

```
evorupa/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   ├── map/                 # Map page
│   ├── report/              # Report form page
│   ├── admin/               # Admin panel
│   └── auth/                # Authentication pages
├── components/
│   └── MapComponent.tsx      # Leaflet map component
├── lib/
│   └── supabase.ts         # Supabase client exports
├── utils/
│   └── supabase/           # Supabase utilities
├── public/                  # Static files
├── .github/workflows/       # CI/CD configuration
├── BUILD_AND_DEPLOY.md     # Deployment guide
└── SETUP_DATABASE.md       # SQL setup script
```

---

## 🔐 Security Notes

- `.env.local` is git-ignored (not committed)
- API keys are public (anon key is safe)
- Use Row-Level Security (RLS) in Supabase
- Passwords hashed with bcrypt
- HTTPS enforced in production

---

## 📚 Documentation

- [BUILD_AND_DEPLOY.md](./BUILD_AND_DEPLOY.md) - Full deployment guide
- [SETUP_DATABASE.md](./SETUP_DATABASE.md) - Database schema SQL
- [REQUIREMENTS.md](./REQUIREMENTS.md) - Feature requirements
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) - 14-week development roadmap
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Initial setup guide

---

## 🤝 Contributing

The project follows these conventions:

- TypeScript for all code
- Tailwind CSS for styling  
- React Server Components where possible
- Supabase for backend
- Leaflet for maps

---

## 📞 Support

For issues:

1. Check browser console (F12) for errors
2. Review [Supabase logs](https://app.supabase.com) for API errors
3. Check GitHub Actions for CI/CD failures
4. Read troubleshooting section above

---

## 📄 License

This project is open source. Check LICENSE file for details.

---

**Happy reporting! Together we improve Serbia's infrastructure. 🇷🇸**
