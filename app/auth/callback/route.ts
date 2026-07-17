import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { syncUserProfile } from '@/utils/supabase/profile'
import { getSupabaseConfig } from '@/lib/supabaseConfig'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const authError = requestUrl.searchParams.get('error')
  const authErrorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') ?? '/map'
  const origin = requestUrl.origin
  const redirectUrl = new URL(next.startsWith('/') ? next : '/map', origin)
  const loginUrl = new URL('/auth/login', origin)

  if (authError || authErrorDescription) {
    loginUrl.searchParams.set('error', authErrorDescription ?? authError ?? 'Google prijava nije uspela.')
    return NextResponse.redirect(loginUrl)
  }

  if (!code) {
    return NextResponse.redirect(redirectUrl)
  }

  const cookieStore = await cookies()
  const cookiesToSet: Array<{
    name: string
    value: string
    options?: Parameters<NextResponse['cookies']['set']>[2]
  }> = []
  const { url, publishableKey } = getSupabaseConfig()
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(nextCookiesToSet) {
        nextCookiesToSet.forEach(({ name, value, options }) => {
          cookiesToSet.push({ name, value, options })
          cookieStore.set(name, value, options)
        })
      },
    },
  })

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    loginUrl.searchParams.set('error', error.message)
    const errorResponse = NextResponse.redirect(loginUrl)
    cookiesToSet.forEach(({ name, value, options }) => {
      errorResponse.cookies.set(name, value, options)
    })
    return errorResponse
  }

  const authUser = data.user ?? (await supabase.auth.getUser()).data.user

  if (authUser) {
    await syncUserProfile(supabase, authUser).catch(() => undefined)
  }

  const response = NextResponse.redirect(redirectUrl)
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
