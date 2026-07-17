import { afterEach, describe, expect, it } from 'vitest'

import { getSupabaseConfig } from '@/lib/supabaseConfig'

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalPublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalPublishableKey
})

describe('supabaseConfig', () => {
  it('uses environment overrides when provided', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ' https://example.supabase.co '
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = ' custom-key '

    expect(getSupabaseConfig()).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'custom-key',
    })
  })

  it('falls back to the bundled public config when env vars are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    const config = getSupabaseConfig()

    expect(config.url).toBe('https://hjbvdtaeqqlyabmklrmg.supabase.co')
    expect(config.publishableKey.startsWith('sb_publishable_')).toBe(true)
  })
})