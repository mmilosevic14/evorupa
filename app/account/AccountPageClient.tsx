'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReportViewsTracker from '@/components/ReportViewsTracker'
import {
  buildCategoryLabelMap,
  buildStatusLabelMap,
  DEFAULT_REPORT_CATEGORIES,
  DEFAULT_REPORT_STATUSES,
  sortCategories,
  sortStatuses,
} from '@/lib/reportMetadata'
import { createClient } from '@/utils/supabase/client'
import { syncUserProfile } from '@/utils/supabase/profile'
import type { Report } from '@/lib/supabase'
import { getReportPlaceLabel, parseReportLocation } from '@/lib/reportLocation'

type EditableReport = Pick<Report, 'id' | 'title' | 'description' | 'category' | 'status'>

type ProfileState = {
  fullName: string
  email: string
  showAuthorName: boolean
}

type CategoryOption = {
  code: string
  label_sr: string
  description: string | null
  sort_order: number
}

type StatusOption = {
  code: 'pending' | 'in_progress' | 'resolved' | 'rejected'
  label_sr: string
  description: string | null
  sort_order: number
}

export default function AccountPageClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<ProfileState>({ fullName: '', email: '', showAuthorName: false })
  const [reports, setReports] = useState<Report[]>([])
  const [engagementEnabled, setEngagementEnabled] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(() => sortCategories(DEFAULT_REPORT_CATEGORIES))
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>(() => sortStatuses(DEFAULT_REPORT_STATUSES))
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>(() => buildCategoryLabelMap())
  const [statusLabels, setStatusLabels] = useState<Record<string, string>>(() => buildStatusLabelMap())
  const [editingReportId, setEditingReportId] = useState<string | null>(null)
  const [editableReport, setEditableReport] = useState<EditableReport | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleReportCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, reportId: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    router.push(`/map?report=${reportId}`)
  }

  useEffect(() => {
    let isMounted = true

    const loadAccount = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const [
        { data: profileRow },
        { data: reportRows, error: reportsError },
        { data: categoryRows, error: categoryError },
        { data: statusRows, error: statusError },
      ] = await Promise.all([
        supabase
          .from('users')
          .select('full_name, email, is_public')
          .eq('id', authUser.id)
          .maybeSingle(),
        supabase
          .from('reports')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false }),
        supabase.from('report_categories').select('code, label_sr, description, sort_order'),
        supabase.from('report_statuses').select('code, label_sr, description, sort_order'),
      ])

      if (reportsError) {
        throw reportsError
      }

      if (!isMounted) {
        return
      }

      setUser({ id: authUser.id })
      if (categoryRows?.length) {
        setCategoryOptions(sortCategories(categoryRows))
        setCategoryLabels(buildCategoryLabelMap(categoryRows))
      }
      if (statusRows?.length) {
        setStatusOptions(sortStatuses(statusRows))
        setStatusLabels(buildStatusLabelMap(statusRows))
      }
      setEngagementEnabled(!categoryError && !statusError)
      setProfile({
        fullName: profileRow?.full_name ?? authUser.user_metadata?.full_name ?? '',
        email: profileRow?.email ?? authUser.email ?? '',
        showAuthorName: profileRow?.is_public ?? false,
      })
      setReports((reportRows as Report[] | null) ?? [])
      setLoading(false)
    }

    loadAccount().catch((loadError) => {
      if (!isMounted) {
        return
      }

      console.error(loadError)
      setError('Neuspešno učitavanje naloga i prijava.')
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [router])

  const startEditingReport = (report: Report) => {
    setEditingReportId(report.id)
    setEditableReport({
      id: report.id,
      title: report.title,
      description: report.description,
      category: report.category,
      status: report.status,
    })
    setError('')
    setSuccess('')
  }

  const saveProfile = async () => {
    if (!user) {
      return
    }

    setSavingProfile(true)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/auth/login')
        return
      }

      await syncUserProfile(supabase, authUser, {
        fullName: profile.fullName.trim(),
        showAuthorName: profile.showAuthorName,
      })

      setSuccess('Profil je sačuvan.')
    } catch (profileError) {
      console.error(profileError)
      setError('Neuspešno čuvanje profila.')
    } finally {
      setSavingProfile(false)
    }
  }

  const saveReport = async () => {
    if (!editableReport) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          title: editableReport.title,
          description: editableReport.description,
          category: editableReport.category,
          status: editableReport.status,
        })
        .eq('id', editableReport.id)

      if (updateError) {
        throw updateError
      }

      setReports((currentReports) =>
        currentReports.map((report) =>
          report.id === editableReport.id
            ? {
                ...report,
                title: editableReport.title,
                description: editableReport.description,
                category: editableReport.category,
                status: editableReport.status,
              }
            : report,
        ),
      )
      setEditingReportId(null)
      setEditableReport(null)
      setSuccess('Prijava je ažurirana.')
    } catch (reportError) {
      console.error(reportError)
      setError('Neuspešno ažuriranje prijave.')
    }
  }

  const deleteReport = async (reportId: string) => {
    if (!window.confirm('Da li sigurno želite da obrišete ovu prijavu?')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase.from('reports').delete().eq('id', reportId)

      if (deleteError) {
        throw deleteError
      }

      setReports((currentReports) => currentReports.filter((report) => report.id !== reportId))
      if (editingReportId === reportId) {
        setEditingReportId(null)
        setEditableReport(null)
      }
      setSuccess('Prijava je obrisana.')
    } catch (reportError) {
      console.error(reportError)
      setError('Neuspešno brisanje prijave.')
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-gray-100 px-4 py-10"><div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-md">Učitavanje naloga...</div></main>
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-2xl bg-white p-8 shadow-md">
          <h1 className="text-3xl font-bold text-gray-900">Moj profil</h1>
          <p className="mt-2 text-gray-600">Upravljajte svojim podacima i odaberite da li vaše ime treba javno da se prikazuje uz prijave.</p>

          {error && <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
          {success && <div className="mt-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-700">{success}</div>}

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input value={profile.email} disabled className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ime i prezime</label>
              <input
                value={profile.fullName}
                onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Kako želite da se potpisujete"
              />
            </div>
          </div>

          <label className="mt-6 flex items-start gap-3 rounded-xl border border-gray-200 p-4">
            <input
              type="checkbox"
              checked={profile.showAuthorName}
              onChange={(event) => setProfile((current) => ({ ...current, showAuthorName: event.target.checked }))}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-gray-900">Prikaži moje ime uz javne prijave</span>
              <span className="mt-1 block text-sm text-gray-600">Ako uključite ovu opciju, vaše ime će se prikazivati na karticama prijava gde je to podržano.</span>
            </span>
          </label>

          <button
            type="button"
            onClick={saveProfile}
            disabled={savingProfile}
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
          >
            {savingProfile ? 'Čuvanje...' : 'Sačuvaj profil'}
          </button>
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-md">
          {engagementEnabled && <ReportViewsTracker trackingKey="account:reports" reportIds={reports.map((report) => report.id)} />}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Moje prijave</h2>
              <p className="text-gray-600">Ovde možete menjati status, urediti tekst ili obrisati prijavu koju ste poslali.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">Ukupno: {reports.length}</div>
          </div>

          {reports.length === 0 ? (
            <p className="mt-6 text-gray-600">Još nemate prijava. Kada pošaljete problem, on će se pojaviti ovde.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {reports.map((report) => {
                const isEditing = editingReportId === report.id && editableReport
                const location = parseReportLocation(report.tags)

                return (
                  <div
                    key={report.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/map?report=${report.id}`)}
                    onKeyDown={(event) => handleReportCardKeyDown(event, report.id)}
                    className="rounded-xl border border-gray-200 p-5 cursor-pointer transition hover:border-secondary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <input
                          value={editableReport.title}
                          onChange={(event) => setEditableReport((current) => current ? { ...current, title: event.target.value } : current)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                        <textarea
                          value={editableReport.description}
                          onChange={(event) => setEditableReport((current) => current ? { ...current, description: event.target.value } : current)}
                          rows={4}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                        <div className="grid gap-4 md:grid-cols-2">
                          <select
                            value={editableReport.category}
                            onChange={(event) => setEditableReport((current) => current ? { ...current, category: event.target.value } : current)}
                            className="rounded-lg border border-gray-300 px-3 py-2"
                          >
                            {categoryOptions.map((option) => <option key={option.code} value={option.code}>{option.label_sr}</option>)}
                          </select>
                          <select
                            value={editableReport.status}
                            onChange={(event) => setEditableReport((current) => current ? { ...current, status: event.target.value as EditableReport['status'] } : current)}
                            className="rounded-lg border border-gray-300 px-3 py-2"
                          >
                            {statusOptions.map((option) => <option key={option.code} value={option.code}>{option.label_sr}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button type="button" onClick={saveReport} className="rounded-lg bg-primary px-4 py-2 font-medium text-white">Sačuvaj izmene</button>
                          <button type="button" onClick={() => { setEditingReportId(null); setEditableReport(null) }} className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700">Otkaži</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{report.title}</h3>
                            <p className="mt-2 text-gray-600">{report.description}</p>
                            <div className="mt-3 space-y-1 text-sm text-gray-500">
                              <p className="whitespace-nowrap">Mesto: {getReportPlaceLabel(report)}</p>
                              {location.municipality && <p className="whitespace-nowrap">Opština: {location.municipality}</p>}
                              {location.district && <p className="whitespace-nowrap">Okrug: {location.district}</p>}
                            </div>
                          </div>
                          <div className="flex flex-col items-start gap-2 md:items-end">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 whitespace-nowrap">{statusLabels[report.status] ?? report.status}</span>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 whitespace-nowrap">{categoryLabels[report.category] ?? report.category}</span>
                          </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              startEditingReport(report)
                            }}
                            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700"
                          >
                            Uredi
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              deleteReport(report.id)
                            }}
                            className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700"
                          >
                            Obriši
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
