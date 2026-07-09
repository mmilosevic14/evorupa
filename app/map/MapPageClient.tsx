'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'
import { getReportPhotoUrl } from '@/lib/reportMedia'
import type { Report } from '@/lib/supabase'
import { getReportPlaceLabel, groupReportsByPlace, isOpenReport, parseReportLocation } from '@/lib/reportLocation'

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Mapa se učitava...</span>
    </div>
  ),
})

export default function MapPageClient() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlaceKey, setSelectedPlaceKey] = useState('all')

  useEffect(() => {
    const supabase = createClient()

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

    const channel = supabase
      .channel('reports_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReports((prev) => [payload.new as Report, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setReports((prev) =>
              prev.map((r) =>
                r.id === payload.new.id ? (payload.new as Report) : r,
              ),
            )
          } else if (payload.eventType === 'DELETE') {
            setReports((prev) => prev.filter((r) => r.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const placeGroups = useMemo(() => groupReportsByPlace(reports), [reports])
  const selectedReports = useMemo(() => {
    if (selectedPlaceKey === 'all') {
      return reports
    }

    return placeGroups.find((group) => group.key === selectedPlaceKey)?.reports ?? []
  }, [placeGroups, reports, selectedPlaceKey])
  const openReports = useMemo(
    () => selectedReports.filter((report) => isOpenReport(report)),
    [selectedReports],
  )
  const selectedPlace = selectedPlaceKey === 'all'
    ? null
    : placeGroups.find((group) => group.key === selectedPlaceKey) ?? null

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 print-shell">
        <h1 className="text-4xl font-bold mb-2 print-page-title">Mapa Problema</h1>
        <p className="text-gray-600 mb-6 print-page-intro">
          Pregledajte sve prijavljene probleme na infrastrukturi
        </p>

        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3 no-print">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-500">Ukupno prijava</p>
            <p className="text-3xl font-bold">{reports.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-500">Otvoreni problemi</p>
            <p className="text-3xl font-bold text-red-600">{reports.filter((report) => isOpenReport(report)).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-500">Mesta sa prijavama</p>
            <p className="text-3xl font-bold">{placeGroups.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Učitavanje mape...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 no-print">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Filtriraj po mestu / naselju</label>
                  <select
                    value={selectedPlaceKey}
                    onChange={(event) => setSelectedPlaceKey(event.target.value)}
                    className="w-full md:max-w-md"
                  >
                    <option value="all">Sva mesta</option>
                    {placeGroups.map((group) => (
                      <option key={group.key} value={group.key}>
                        {group.label} ({group.reportCount})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary"
                >
                  Štampaj otvorene probleme
                </button>
              </div>
            </div>

            <MapComponent reports={selectedReports} />

            <div className="mt-8 bg-white rounded-lg shadow-md p-6 no-print">
              <h2 className="text-2xl font-bold mb-4">Pregled po mestu</h2>

              {placeGroups.length === 0 ? (
                <p className="text-gray-600">Još nema podataka za grupisanje po mestu.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {placeGroups.map((group) => (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => setSelectedPlaceKey(group.key)}
                      className={`rounded-lg border p-4 text-left transition ${
                        selectedPlaceKey === group.key
                          ? 'border-primary bg-red-50 shadow-md'
                          : 'border-gray-200 bg-white hover:shadow-md'
                      }`}
                    >
                      <h3 className="font-bold text-lg">{group.label}</h3>
                      {group.municipality && (
                        <p className="text-sm text-gray-600 mt-1">Opština/grad: {group.municipality}</p>
                      )}
                      {group.district && (
                        <p className="text-sm text-gray-600">Okrug: {group.district}</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          Ukupno: {group.reportCount}
                        </span>
                        <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          Otvoreno: {group.openCount}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 bg-white rounded-lg shadow-md p-6 print-area print-card">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between print-header">
                <div>
                  <h2 className="text-2xl font-bold">Otvoreni problemi za slanje</h2>
                  <p className="text-gray-600 mt-1 print-subtitle">
                    {selectedPlace
                      ? `Mesto: ${selectedPlace.label}${selectedPlace.municipality ? `, ${selectedPlace.municipality}` : ''}`
                      : 'Prikaz svih mesta'}
                  </p>
                </div>
                <p className="text-sm text-gray-500 print-summary">
                  Broj otvorenih problema: <strong>{openReports.length}</strong>
                </p>
              </div>

              {openReports.length === 0 ? (
                <p className="text-gray-600 mt-4">Nema otvorenih problema za izabrano mesto.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {openReports.map((report) => {
                    const location = parseReportLocation(report.tags)

                    return (
                      <div key={report.id} className="border border-gray-200 rounded-lg p-4 print-card print-item">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between print-item-layout">
                          <div>
                            <h3 className="font-bold text-lg">{report.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 print-description">{report.description}</p>
                            <div className="mt-3 flex flex-wrap gap-2 print-tags">
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs print-tag">
                                {report.category}
                              </span>
                              <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs print-tag">
                                {report.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 md:text-right print-meta">
                            <p><strong>Mesto:</strong> {getReportPlaceLabel(report)}</p>
                            {location.municipality && <p><strong>Opština:</strong> {location.municipality}</p>}
                            {location.district && <p><strong>Okrug:</strong> {location.district}</p>}
                            <p><strong>Koordinate:</strong> {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-8 bg-white rounded-lg shadow-md p-6 no-print">
              <h2 className="text-2xl font-bold mb-4">
                Prijavljeni problemi ({selectedReports.length})
              </h2>

              {selectedReports.length === 0 ? (
                <p className="text-gray-600">Nema prijavljenih problema. Budite prvi i prijavite problem!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedReports.map((report) => {
                    const location = parseReportLocation(report.tags)

                    return (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                      <div className="relative w-full h-48 mb-3 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={getReportPhotoUrl(report.photo_url)}
                          alt={report.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
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

                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Mesto:</strong> {getReportPlaceLabel(report)}</p>
                        {location.municipality && <p><strong>Opština:</strong> {location.municipality}</p>}
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}