'use client'

import { useEffect, useState } from 'react'
import MapComponent from '@/components/MapComponent'
import { createClient } from '@/utils/supabase/client'

interface Report {
  id: string
  title: string
  description: string
  latitude: number
  longitude: number
  category: string
  status: string
  photo_url?: string
}

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        setReports(data || [])
      } catch (error) {
        console.error('Error fetching reports:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('reports_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReports([payload.new as Report, ...reports])
          } else if (payload.eventType === 'UPDATE') {
            setReports(
              reports.map((r) => (r.id === payload.new.id ? (payload.new as Report) : r))
            )
          } else if (payload.eventType === 'DELETE') {
            setReports(reports.filter((r) => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase])

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-2">Mapa Problema</h1>
        <p className="text-gray-600 mb-6">
          Pregledajte sve prijavljene probleme na infrastrukturi
        </p>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Učitavanje mape...</p>
          </div>
        ) : (
          <>
            <MapComponent reports={reports} />

            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Prijavljeni problemi ({reports.length})</h2>

              {reports.length === 0 ? (
                <p className="text-gray-600">Nema prijavljenih problema. Budite prvi i prijavite problem!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                      {report.photo_url && (
                        <img
                          src={report.photo_url}
                          alt={report.title}
                          className="w-full h-48 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h3 className="font-bold text-lg mb-2">{report.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{report.description.substring(0, 100)}...</p>

                      <div className="flex gap-2 mb-2">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {report.category}
                        </span>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            report.status === 'resolved'
                              ? 'bg-green-100 text-green-800'
                              : report.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

