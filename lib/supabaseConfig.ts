const FALLBACK_SUPABASE_URL = 'https://wqnrywhafxutgginzbvk.supabase.co'
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_VND7l9H4nAxQvlubQQ_hNQ_GbwIZYdK'

export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      FALLBACK_SUPABASE_PUBLISHABLE_KEY,
  }
}
