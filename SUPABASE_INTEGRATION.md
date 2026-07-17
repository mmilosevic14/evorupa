# EvoRupa - Supabase Integration Guide

> Migration note: this project now uses the Supabase project `hjbvdtaeqqlyabmklrmg`. If you see `migrating+...` emails in `public.users`, that is a migration artifact from the July 2026 user-remap flow, not the intended steady state.

## ✅ What's Been Setup

Your project now has complete Supabase integration:

### Files Created/Modified

1. **`.env.local`** - Your Supabase credentials (already added)
   ```env
  NEXT_PUBLIC_SUPABASE_URL=https://hjbvdtaeqqlyabmklrmg.supabase.co
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<current publishable key>
   ```

2. **`utils/supabase/server.ts`** - Server-side Supabase client
   - Use in Server Components
   - Handles cookies for authentication
   - Example: `const supabase = await createClient(cookieStore)`

3. **`utils/supabase/client.ts`** - Browser Supabase client
   - Use in Client Components (`'use client'`)
   - Direct browser access
   - Example: `const supabase = createClient()`

4. **`middleware.ts`** - Session refresh middleware
   - Automatically refreshes user sessions
   - Keeps auth state in sync

5. **`app/auth/login/page.tsx`** - Login page (ready to use)
   - Email & password login
   - Error handling
   - Redirects to `/map` on success

6. **`app/auth/signup/page.tsx`** - Sign up page (ready to use)
   - User registration
   - Email verification
   - Full name capture

---

## 🔑 Your Supabase Credentials

✅ **URL:** `https://hjbvdtaeqqlyabmklrmg.supabase.co`
✅ **Key:** check `.env.local` or [lib/supabase-public-config.json](c:/Users/mmilosev/gderupa/lib/supabase-public-config.json)

These are already added to `.env.local`. Keep them safe!

---

## 🚀 Next Steps

### 1. Verify Email in Supabase Dashboard

1. Go to https://supabase.com and log in
2. Select your project
3. Go to **Authentication → Email Templates**
4. Verify that email templates are enabled (default is enabled)

### 2. Test Authentication

```bash
npm run dev
```

Then visit:
- http://localhost:3000/auth/signup - Sign up
- http://localhost:3000/auth/login - Sign in

### 3. Check User in Database

After signing up:
1. Go to Supabase Dashboard
2. **SQL Editor** → New query
3. Run:
```sql
SELECT id, email, created_at FROM auth.users;
```

You should see your new user!

---

## 📚 How to Use Supabase in Your Code

### Server-Side (Server Components)

```typescript
// app/page.tsx (Server Component)
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Fetch data
  const { data: reports } = await supabase
    .from('reports')
    .select()

  return <div>{/* Use reports */}</div>
}
```

### Client-Side (Client Components)

```typescript
// app/map/page.tsx (Client Component)
'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function MapPage() {
  const [reports, setReports] = useState([])
  const supabase = createClient()

  useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase
        .from('reports')
        .select()

      setReports(data || [])
    }

    fetchReports()
  }, [])

  return <div>{/* Use reports */}</div>
}
```

### Real-Time Subscriptions

```typescript
const subscription = supabase
  .from('reports')
  .on('*', (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()

// Cleanup
subscription.unsubscribe()
```

---

## 🔐 Security & Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore` ✅
2. **Use Row-Level Security (RLS)** - Limit what users can access
3. **Validate inputs** - Always validate on server
4. **Handle errors** - Check error responses
5. **Keep keys safe** - Publishable key is safe; never expose service role key

---

## 📦 Packages Installed

```bash
@supabase/supabase-js@^2.38.0   # Supabase client
@supabase/ssr@^0.0.13           # Supabase SSR support
```

These are already in your `package.json` after running `npm install`.

---

## 🆘 Troubleshooting

### Error: "Supabase environment variables are not set"
**Solution:** Check that `.env.local` has both variables:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

### Auth not working / Sessions not persisting
**Solution:** Make sure `middleware.ts` is in your root directory (it is ✅)

### Can't create users / Email not sending
**Solution:** 
1. Go to Supabase Dashboard
2. Authentication → Email Templates
3. Verify SMTP settings are configured

### CORS errors
**Solution:** Go to Supabase Dashboard → Authentication → URL Configuration
- Add your deployment URL
- Example: `http://localhost:3000` for local

---

## 📋 Database Schema Status

Next, you need to create tables in Supabase. Run the SQL from **SETUP_DATABASE.md** in:
1. Supabase Dashboard → SQL Editor
2. New Query
3. Paste SQL
4. Run

Tables to create:
- `users` - User profiles
- `reports` - Infrastructure reports
- `comments` - Comments on reports
- `votes` - Upvotes on reports
- `updates` - Status updates

---

## 🎯 Complete Integration Checklist

- [ ] Supabase project created
- [ ] `.env.local` configured with your keys
- [ ] `npm install` completed
- [ ] `npm run dev` works
- [ ] Can access http://localhost:3000/auth/signup
- [ ] Can sign up a test user
- [ ] User appears in Supabase dashboard
- [ ] Can login at http://localhost:3000/auth/login
- [ ] SQL tables created (from SETUP_DATABASE.md)
- [ ] Can fetch reports from database

---

## 📞 Support Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Auth Guide](https://supabase.com/docs/guides/auth)
- [Database Guide](https://supabase.com/docs/guides/database)

---

**Status:** 🟢 Supabase integration complete  
**Next:** Create database tables and test authentication
