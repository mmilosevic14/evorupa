'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'evorupa:pwa-install-dismissed'

function isIosDevice() {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') {
    return false
  }

  const iosNavigator = window.navigator as Navigator & { standalone?: boolean }

  return window.matchMedia('(display-mode: standalone)').matches || iosNavigator.standalone === true
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setDismissed(window.localStorage.getItem(DISMISS_KEY) === 'true')
    setInstalled(isStandaloneDisplayMode())
    setShowIosHint(isIosDevice() && !isStandaloneDisplayMode())

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setShowIosHint(false)
    }

    const handleAppInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      setShowIosHint(false)
      window.localStorage.removeItem(DISMISS_KEY)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, 'true')
    }
  }

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return
    }

    await deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice

    if (result.outcome === 'accepted') {
      setInstalled(true)
      setDismissed(false)
    }

    setDeferredPrompt(null)
  }

  if (installed || dismissed) {
    return null
  }

  if (!deferredPrompt && !showIosHint) {
    return null
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl bg-slate-900 p-4 text-white shadow-2xl ring-1 ring-white/10">
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
      <div className="mt-4 flex gap-3">
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