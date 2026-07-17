'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

import ShareButton from '@/components/ShareButton'
import { usePwaInstall } from '@/lib/usePwaInstall'
import { createClient } from '@/utils/supabase/client'

const APP_URL = 'https://evorupa.pages.dev/'

type AdminState = {
  isAdmin: boolean
  isAuthenticated: boolean
}

export default function AppNavLinks() {
  const router = useRouter()
  const pathname = usePathname()
  const { deferredPrompt, installed, showIosHint, promptToInstall } = usePwaInstall()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const [adminState, setAdminState] = useState<AdminState>({
    isAdmin: false,
    isAuthenticated: false,
  })

  useEffect(() => {
    setMobileMenuOpen(false)
    setShowInstallHelp(false)
  }, [pathname])

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    async function loadAdminState() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (isMounted) {
          setAdminState({ isAdmin: false, isAuthenticated: false })
        }
        return
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

      if (isMounted) {
        setAdminState({ isAdmin, isAuthenticated: true })
      }
    }

    loadAdminState().catch(() => {
      if (isMounted) {
        setAdminState({ isAdmin: false, isAuthenticated: false })
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadAdminState().catch(() => {
        if (isMounted) {
          setAdminState({ isAdmin: false, isAuthenticated: false })
        }
      })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    setMobileMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await promptToInstall()
      setMobileMenuOpen(false)
      return
    }

    if (showIosHint) {
      setShowInstallHelp((prev) => !prev)
    }
  }

  const navLinks = [
    { href: '/map', label: 'Mapa' },
    { href: '/report', label: 'Prijavi problem' },
  ]

  const showInstallAction = !installed && (Boolean(deferredPrompt) || showIosHint)

  return (
    <div className="relative">
      <div className="hidden items-center gap-4 md:flex">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-blue-100 transition">
            {link.label}
          </Link>
        ))}
        {adminState.isAuthenticated && (
          <Link href="/account" className="whitespace-nowrap hover:text-blue-100 transition">
            Moj profil
          </Link>
        )}
        {adminState.isAdmin && (
          <Link href="/admin" className="whitespace-nowrap hover:text-blue-100 transition">
            Admin
          </Link>
        )}
        {adminState.isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            className="whitespace-nowrap hover:text-blue-100 transition"
          >
            Odjavi se
          </button>
        ) : (
          <Link href="/auth/login" className="whitespace-nowrap hover:text-blue-100 transition">
            Uloguj se
          </Link>
        )}
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={mobileMenuOpen ? 'Zatvori meni' : 'Otvori meni'}
          className="inline-flex items-center justify-center rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <span className="sr-only">Meni</span>
          <span className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-current"></span>
            <span className="block h-0.5 w-5 bg-current"></span>
            <span className="block h-0.5 w-5 bg-current"></span>
          </span>
        </button>

        {mobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="absolute right-0 top-full z-50 mt-3 min-w-56 overflow-hidden rounded-xl bg-white text-gray-900 shadow-xl ring-1 ring-black/10"
          >
            <div className="flex flex-col py-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 text-sm font-medium transition hover:bg-gray-50"
                >
                  {link.label}
                </Link>
              ))}
              {adminState.isAuthenticated && (
                <Link href="/account" className="px-4 py-3 text-sm font-medium transition hover:bg-gray-50">
                  Moj profil
                </Link>
              )}
              {adminState.isAdmin && (
                <Link href="/admin" className="px-4 py-3 text-sm font-medium transition hover:bg-gray-50">
                  Admin
                </Link>
              )}
              <div className="my-1 border-t border-gray-100" />
              <ShareButton
                href={APP_URL}
                title="EvoRupa"
                text="Prijavi rupe i infrastrukturne probleme preko EvoRupa aplikacije."
                label="Podeli aplikaciju"
                className="px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-50"
                onSuccess={() => setMobileMenuOpen(false)}
              />
              {showInstallAction && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-50"
                >
                  {deferredPrompt ? 'Instaliraj aplikaciju' : 'Kako da instaliram aplikaciju'}
                </button>
              )}
              {showInstallHelp && showIosHint && (
                <div className="px-4 pb-3 text-xs leading-5 text-gray-600">
                  U Safari-ju otvori Share meni i izaberi Add to Home Screen.
                </div>
              )}
              {adminState.isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-50"
                >
                  Odjavi se
                </button>
              ) : (
                <Link href="/auth/login" className="px-4 py-3 text-sm font-medium transition hover:bg-gray-50">
                  Uloguj se
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}