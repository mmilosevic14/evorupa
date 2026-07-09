import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function getCurrentAdminState() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, isAdmin: false }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, is_admin')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = Boolean(
    profile?.is_admin ||
    profile?.role === 'admin' ||
    user.user_metadata?.is_admin === true ||
    user.app_metadata?.is_admin === true,
  )

  return { user, isAdmin }
}