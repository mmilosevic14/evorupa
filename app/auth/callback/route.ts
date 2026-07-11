import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/supabaseConfig'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/map'
  const origin = requestUrl.origin
  const redirectUrl = new URL(next.startsWith('/') ? next : '/map', origin)

  if (!code) {
    return NextResponse.redirect(redirectUrl)
  }

  const cookieStore = await cookies()
  const { url, publishableKey } = getSupabaseConfig()
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })

  await supabase.auth.exchangeCodeForSession(code)

  return NextResponse.redirect(redirectUrl)
}
