'use client'

import { useEffect } from 'react'

const CACHE_RESET_VERSION = '2026-07-17-supabase-project-cutover'
const CACHE_RESET_KEY = 'evorupa-cache-reset-version'

export default function ClientCacheReset() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const run = async () => {
      const appliedVersion = window.localStorage.getItem(CACHE_RESET_KEY)

      if (appliedVersion === CACHE_RESET_VERSION) {
        return
      }

      let changed = false

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()

        if (registrations.length > 0) {
          await Promise.all(registrations.map((registration) => registration.unregister()))
          changed = true
        }
      }

      if ('caches' in window) {
        const cacheKeys = await caches.keys()

        if (cacheKeys.length > 0) {
          await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)))
          changed = true
        }
      }

      window.localStorage.setItem(CACHE_RESET_KEY, CACHE_RESET_VERSION)

      if (changed) {
        window.location.reload()
      }
    }

    run().catch(() => undefined)
  }, [])

  return null
}