'use client'

import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig } from '@/lib/supabaseConfig'

const { url: supabaseUrl, publishableKey: supabaseKey } = getSupabaseConfig()

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey)
