'use client'

import { useEffect, useState } from 'react'
import { usePwaInstall } from '@/lib/usePwaInstall'

const DISMISS_KEY = 'evorupa:pwa-install-dismissed'
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7

function isDismissed() {
  if (typeof window === 'undefined') {
    return false
  }

  const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY))

  if (!Number.isFinite(dismissedAt) || dismissedAt <= 0) {
    window.localStorage.removeItem(DISMISS_KEY)
    return false
  }

  if (Date.now() - dismissedAt > DISMISS_TTL_MS) {
    window.localStorage.removeItem(DISMISS_KEY)
    return false
  }

  return true
}

export default function PwaInstallPrompt() {
  const { deferredPrompt, installed, showIosHint, promptToInstall } = usePwaInstall()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setDismissed(isDismissed())
  }, [])

  useEffect(() => {
    if (!installed || typeof window === 'undefined') {
      return
    }

    window.localStorage.removeItem(DISMISS_KEY)
  }, [installed])

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    }
  }

  const handleInstall = async () => {
    const result = await promptToInstall()

    if (!result) {
      return
    }

    if (result.outcome === 'accepted') {
      setDismissed(false)
    }
  }

  if (installed || dismissed) {
    return null
  }

  if (!deferredPrompt && !showIosHint) {
    return null
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl bg-slate-900/95 p-4 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Instaliraj EvoRupa</p>
          <p className="mt-1 text-sm text-slate-300">
            {deferredPrompt
              ? 'Dodaj aplikaciju na telefon radi bržeg otvaranja i rada preko celog ekrana.'
              : 'Na iPhone/iPad uređaju otvorite Share meni u Safari-ju i izaberite Add to Home Screen.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Zatvori predlog za instalaciju"
          className="rounded-full p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          ×
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {deferredPrompt && (
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary-dark"
          >
            Instaliraj
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Kasnije
        </button>
      </div>
    </div>
  )
}