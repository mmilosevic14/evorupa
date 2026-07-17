'use client'

import { useEffect, useState } from 'react'

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

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

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const standalone = isStandaloneDisplayMode()
    setInstalled(standalone)
    setShowIosHint(isIosDevice() && !standalone)

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setShowIosHint(false)
    }

    const handleAppInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      setShowIosHint(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptToInstall = async () => {
    if (!deferredPrompt) {
      return null
    }

    await deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice

    if (result.outcome === 'accepted') {
      setInstalled(true)
    }

    setDeferredPrompt(null)
    return result
  }

  return {
    deferredPrompt,
    installed,
    showIosHint,
    promptToInstall,
  }
}