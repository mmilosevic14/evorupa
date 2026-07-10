'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { createClient } from '@/utils/supabase/client'

type AdminState = {
  isAdmin: boolean
}

export default function AppNavLinks() {
  const [adminState, setAdminState] = useState<AdminState>({ isAdmin: false })

  useEffect(() => {
    let isMounted = true

    async function loadAdminState() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (isMounted) {
          setAdminState({ isAdmin: false })
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
        setAdminState({ isAdmin })
      }
    }

    loadAdminState().catch(() => {
      if (isMounted) {
        setAdminState({ isAdmin: false })
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-x-4">
      <Link href="/map" className="hover:text-blue-100 transition">
        Mapa
      </Link>
      <Link href="/report" className="hover:text-blue-100 transition">
        Prijavi problem
      </Link>
      {adminState.isAdmin && (
        <Link href="/admin" className="hover:text-blue-100 transition">
          Admin
        </Link>
      )}
    </div>
  )
}