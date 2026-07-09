'use client'

import ModerationPlaceholder from '@/components/admin/ModerationPlaceholder'

export default function AdminPageClient() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin panel</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="card">
            <h3 className="font-bold text-lg mb-4">📊 Statistika</h3>
            <div className="space-y-2 text-gray-600">
              <p>Ukupno prijava: 0</p>
              <p>Trenutnog meseca: 0</p>
              <p>Rešeno: 0</p>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-lg mb-4">⏳ Čekajući zahtevi</h3>
            <p className="text-gray-600">Nema zahteva koji čekaju na rešavanje</p>
          </div>

          <div className="card md:col-span-2">
            <h3 className="font-bold text-lg mb-4">📋 Sve prijave</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Naslov</th>
                    <th className="px-4 py-2 text-left">Kategorija</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                      Nema prijava
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <ModerationPlaceholder />
        </div>
      </div>
    </div>
  )
}