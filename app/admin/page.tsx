import AdminPageClient from './AdminPageClient'
import { getCurrentAdminState } from '@/lib/adminAccess'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import type { Report } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function loadReports(): Promise<Report[]> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('Admin reports load failed:', error)
    return []
  }

  return data as Report[]
}

export default async function AdminPage() {
  const { isAdmin } = await getCurrentAdminState()

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold mb-3">Admin panel</h1>
            <p className="text-gray-600">Pristup ovoj stranici je dozvoljen samo korisnicima sa uključenim <strong>is_admin</strong> privilegijama.</p>
          </div>
        </div>
      </div>
    )
  }

  const reports = await loadReports()

  return <AdminPageClient initialReports={reports} />
}
