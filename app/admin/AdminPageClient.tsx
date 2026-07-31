'use client'

import { useState, useCallback } from 'react'
import type { Report } from '@/lib/supabase'
import { getReportPlaceLabel } from '@/lib/reportLocation'

type ApprovalState = boolean | null

interface Props {
  initialReports: Report[]
}

function approvalLabel(approved: ApprovalState): string {
  if (approved === true) return 'Odobreno'
  if (approved === false) return 'Odbijeno'
  return 'Na pregledu'
}

function approvalBadgeClass(approved: ApprovalState): string {
  if (approved === true) return 'bg-green-100 text-green-800'
  if (approved === false) return 'bg-red-100 text-red-800'
  return 'bg-yellow-100 text-yellow-800'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sr-Latn-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function AdminPageClient({ initialReports }: Props) {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [busy, setBusy] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const pending = reports.filter((r) => r.approved === null || r.approved === undefined)
  const approved = reports.filter((r) => r.approved === true)
  const rejected = reports.filter((r) => r.approved === false)
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonth = reports.filter((r) => {
    const d = new Date(r.created_at)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })
  const resolved = reports.filter((r) => r.status === 'resolved')

  const setApproval = useCallback(async (reportId: string, value: boolean) => {
    setBusy((prev) => new Set(prev).add(reportId))
    setError(null)

    try {
      const res = await fetch(`/api/admin/reports/${reportId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: value }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Greška pri ažuriranju prijave.')
        return
      }

      const updated = (await res.json()) as { id: string; approved: boolean; updated_at: string }
      setReports((prev) =>
        prev.map((r) =>
          r.id === updated.id
            ? { ...r, approved: updated.approved, updated_at: updated.updated_at }
            : r,
        ),
      )
    } catch {
      setError('Mrežna greška. Pokušaj ponovo.')
    } finally {
      setBusy((prev) => {
        const next = new Set(prev)
        next.delete(reportId)
        return next
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin panel</h1>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="card">
            <h3 className="font-bold text-lg mb-4">📊 Statistika</h3>
            <div className="space-y-2 text-gray-600">
              <p>Ukupno prijava: <strong>{reports.length}</strong></p>
              <p>Trenutnog meseca: <strong>{thisMonth.length}</strong></p>
              <p>Rešeno: <strong>{resolved.length}</strong></p>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-lg mb-4">✅ Odobravanje</h3>
            <div className="space-y-2 text-gray-600">
              <p>Na pregledu: <strong className="text-yellow-700">{pending.length}</strong></p>
              <p>Odobreno: <strong className="text-green-700">{approved.length}</strong></p>
              <p>Odbijeno: <strong className="text-red-700">{rejected.length}</strong></p>
            </div>
          </div>
        </div>

        {/* Pending approval queue */}
        {pending.length > 0 && (
          <div className="card mb-8">
            <h3 className="font-bold text-lg mb-4">⏳ Čekaju odobravanje ({pending.length})</h3>
            <div className="space-y-3">
              {pending.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{report.title}</p>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{report.description}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>Kategorija: {report.category}</span>
                      <span>Mesto: {getReportPlaceLabel(report)}</span>
                      <span>Datum: {formatDate(report.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={busy.has(report.id)}
                      onClick={() => setApproval(report.id, true)}
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                      Odobri
                    </button>
                    <button
                      type="button"
                      disabled={busy.has(report.id)}
                      onClick={() => setApproval(report.id, false)}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      Odbij
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All reports table */}
        <div className="card">
          <h3 className="font-bold text-lg mb-4">📋 Sve prijave</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left">Naslov</th>
                  <th className="px-4 py-2 text-left">Kategorija</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Odobrenje</th>
                  <th className="px-4 py-2 text-left">Datum</th>
                  <th className="px-4 py-2 text-left">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr className="border-t">
                    <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                      Nema prijava
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium truncate">{report.title}</p>
                        <p className="text-xs text-gray-500 truncate">{getReportPlaceLabel(report)}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{report.category}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{report.status}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${approvalBadgeClass(report.approved ?? null)}`}>
                          {approvalLabel(report.approved ?? null)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy.has(report.id) || report.approved === true}
                            onClick={() => setApproval(report.id, true)}
                            className="rounded px-2.5 py-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            Odobri
                          </button>
                          <button
                            type="button"
                            disabled={busy.has(report.id) || report.approved === false}
                            onClick={() => setApproval(report.id, false)}
                            className="rounded px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            Odbij
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
