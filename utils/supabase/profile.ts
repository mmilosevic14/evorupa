import type { SupabaseClient, User } from '@supabase/supabase-js'

type SyncProfileOptions = {
  fullName?: string
  showAuthorName?: boolean
}

export const syncUserProfile = async (
  supabase: SupabaseClient,
  user: User,
  options: SyncProfileOptions = {},
) => {
  const fullName =
    options.fullName ??
    (typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : null)

  const payload: {
    id: string
    email: string | undefined
    full_name: string | null
    role: 'citizen'
    is_public?: boolean
  } = {
    id: user.id,
    email: user.email,
    full_name: fullName,
    role: 'citizen',
  }

  if (typeof options.showAuthorName === 'boolean') {
    payload.is_public = options.showAuthorName
  }

  const { error } = await supabase.from('users').upsert(
    payload,
    {
      onConflict: 'id',
      ignoreDuplicates: false,
    },
  )

  if (error) {
    throw error
  }
}