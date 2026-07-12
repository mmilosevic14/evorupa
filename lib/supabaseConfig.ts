import bundledSupabaseConfig from '@/lib/supabase-public-config.json'

export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || bundledSupabaseConfig.url,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      bundledSupabaseConfig.publishableKey,
  }
}
