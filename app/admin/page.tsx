import AdminPageClient from './AdminPageClient'
import { getCurrentAdminState } from '@/lib/adminAccess'

export const dynamic = 'force-dynamic'

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

  return <AdminPageClient />
}
