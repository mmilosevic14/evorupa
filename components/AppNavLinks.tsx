'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/utils/supabase/client'

type AdminState = {
  isAdmin: boolean
  isAuthenticated: boolean
}

export default function AppNavLinks() {
  const router = useRouter()
  const [adminState, setAdminState] = useState<AdminState>({
    isAdmin: false,
    isAuthenticated: false,
  })

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
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="space-x-4">
      <Link href="/map" className="hover:text-blue-100 transition">
        Mapa
      </Link>
      <Link href="/report" className="hover:text-blue-100 transition">
        Prijavi problem
      </Link>
      {adminState.isAuthenticated && (
        <Link href="/account" className="hover:text-blue-100 transition">
          Moj profil
        </Link>
      )}
      {adminState.isAdmin && (
        <Link href="/admin" className="hover:text-blue-100 transition">
          Admin
        </Link>
      )}
      {adminState.isAuthenticated ? (
        <button
          type="button"
          onClick={handleLogout}
          className="hover:text-blue-100 transition"
        >
          Odjavi se
        </button>
      ) : (
        <Link href="/auth/login" className="hover:text-blue-100 transition">
          Uloguj se
        </Link>
      )}
    </div>
  )
}