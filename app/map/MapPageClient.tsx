'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import ReportViewsTracker from '@/components/ReportViewsTracker'
import { incrementReportViews, toggleReportUpvote } from '@/lib/reportEngagement'
import { buildCategoryLabelMap, buildStatusLabelMap, derivePriorityFromUpvotes, sortCategories, sortStatuses } from '@/lib/reportMetadata'
import { buildVisibleAuthorMap, getVisibleAuthorName } from '@/lib/reportAuthors'
import { createClient } from '@/utils/supabase/client'
import { getReportPhotoUrl } from '@/lib/reportMedia'
import type { Database, Report } from '@/lib/supabase'
import { getReportPlaceLabel, groupReportsByDistrict, groupReportsByPlace, isOpenReport, parseReportLocation, type PlaceGroup } from '@/lib/reportLocation'

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Mapa se učitava...</span>
    </div>
  ),
})

const REPORTS_PAGE_SIZE = 6
const PLACE_GROUPS_PAGE_SIZE = 6
const OPEN_REPORTS_PAGE_SIZE = 6

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('button, a, input, select, textarea, summary, [role="button"], [role="link"]'))
}

function getCategoryLabel(category: string) {
  return category
}

function getStatusLabel(status: string) {
  return status
}

function getPriorityLabel(upvotes: number | null | undefined) {
  const priority = derivePriorityFromUpvotes(upvotes)

  if (priority === 'high') {
    return 'Visok'
  }

  if (priority === 'medium') {
    return 'Srednji'
  }

  return 'Nizak'
}

function MetadataIcon({ type }: { type: 'category' | 'status' | 'location' }) {
  if (type === 'category') {
    return (
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2.75 4.25h10.5" />
        <path d="M2.75 8h10.5" />
        <path d="M2.75 11.75h6.5" />
      </svg>
    )
  }

  if (type === 'status') {
    return (
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="5.25" />
        <path d="M8 5.25v3.1l2.15 1.4" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 13.25s3.5-3.2 3.5-6.25A3.5 3.5 0 0 0 4.5 7c0 3.05 3.5 6.25 3.5 6.25Z" />
      <circle cx="8" cy="7" r="1.4" />
    </svg>
  )
}

function MetadataItem({ type, label }: { type: 'category' | 'status' | 'location'; label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-gray-700 print-tag">
      <MetadataIcon type={type} />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  )
}

export default function MapPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reports, setReports] = useState<Report[]>([])
  const [authorNames, setAuthorNames] = useState<Map<string, string>>(new Map())
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>(() => buildCategoryLabelMap())
  const [statusLabels, setStatusLabels] = useState<Record<string, string>>(() => buildStatusLabelMap())
  const [engagementEnabled, setEngagementEnabled] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [upvotedReportIds, setUpvotedReportIds] = useState<Set<string>>(new Set())
  const [upvotePendingId, setUpvotePendingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDistrictKey, setSelectedDistrictKey] = useState('all')
  const [selectedPlaceKey, setSelectedPlaceKey] = useState('all')
  const [focusedReportRequest, setFocusedReportRequest] = useState<{ id: string; nonce: number } | null>(null)
  const [pendingFocusRequest, setPendingFocusRequest] = useState<{
    reportId: string
    districtKey: string
    placeKey: string
    nonce: number
  } | null>(null)
  const [reportsPage, setReportsPage] = useState(1)
  const [reportsPerPage, setReportsPerPage] = useState<number | 'all'>(REPORTS_PAGE_SIZE)
  const [placeGroupsPage, setPlaceGroupsPage] = useState(1)
  const [placeGroupsPerPage, setPlaceGroupsPerPage] = useState<number | 'all'>(PLACE_GROUPS_PAGE_SIZE)
  const [openReportsPage, setOpenReportsPage] = useState(1)
  const [openReportsPerPage, setOpenReportsPerPage] = useState<number | 'all'>(OPEN_REPORTS_PAGE_SIZE)
  const mapSectionRef = useRef<HTMLDivElement | null>(null)
  const skipPlaceResetRef = useRef(false)
  const pendingFocusRequestRef = useRef(pendingFocusRequest)
  const handledQueryReportIdRef = useRef<string | null>(null)
  const handleReportFocusRef = useRef<(report: Report) => void>(() => {})

  useEffect(() => {
    pendingFocusRequestRef.current = pendingFocusRequest
  }, [pendingFocusRequest])

  useEffect(() => {
    const supabase = createClient()

    const fetchReports = async () => {
      try {
        const [
          { data: reportRows, error: reportsError },
          { data: categoryRows, error: categoryError },
          { data: statusRows, error: statusError },
          { data: authResult },
        ] = await Promise.all([
          supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase.from('report_categories').select('code, label_sr, description, sort_order'),
          supabase.from('report_statuses').select('code, label_sr, description, sort_order'),
          supabase.auth.getUser(),
        ])

        if (reportsError) throw reportsError

        setReports(reportRows || [])

        if (categoryRows?.length) {
          setCategoryLabels(buildCategoryLabelMap(sortCategories(categoryRows)))
        }

        if (statusRows?.length) {
          setStatusLabels(buildStatusLabelMap(sortStatuses(statusRows)))
        }

        setCurrentUserId(authResult.user?.id ?? null)
        setEngagementEnabled(!categoryError && !statusError)
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

  useEffect(() => {
    if (!engagementEnabled || !currentUserId || reports.length === 0) {
      setUpvotedReportIds(new Set())
      return
    }

    let ignore = false
    const supabase = createClient()
    const reportIds = Array.from(new Set(reports.map((report) => report.id)))

    const loadCurrentUserUpvotes = async () => {
      const { data, error } = await supabase
        .from('report_upvotes')
        .select('report_id')
        .eq('user_id', currentUserId)
        .in('report_id', reportIds)

      if (error) {
        throw error
      }

      if (!ignore) {
        setUpvotedReportIds(new Set((data ?? []).map((row) => row.report_id)))
      }
    }

    loadCurrentUserUpvotes().catch((error) => {
      console.error('Error loading current user upvotes:', error)
      if (!ignore) {
        setUpvotedReportIds(new Set())
      }
    })

    return () => {
      ignore = true
    }
  }, [currentUserId, engagementEnabled, reports])

  useEffect(() => {
    const supabase = createClient()
    const userIds = Array.from(new Set(reports.map((report) => report.user_id)))

    if (userIds.length === 0) {
      setAuthorNames(new Map())
      return
    }

    let ignore = false

    const loadAuthors = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, is_public')
        .in('id', userIds)

      if (!ignore) {
        setAuthorNames(buildVisibleAuthorMap((data ?? []) as Pick<Database['public']['Tables']['users']['Row'], 'id' | 'full_name' | 'is_public'>[]))
      }
    }

    loadAuthors().catch((authorError) => {
      console.error('Error fetching report authors:', authorError)
      if (!ignore) {
        setAuthorNames(new Map())
      }
    })

    return () => {
      ignore = true
    }
  }, [reports])

  const districtGroups = useMemo(
    () => groupReportsByDistrict(reports, 'name-asc'),
    [reports],
  )
  const selectedDistrict = selectedDistrictKey === 'all'
    ? null
    : districtGroups.find((group) => group.key === selectedDistrictKey) ?? null
  const districtFilteredReports = useMemo(() => {
    if (!selectedDistrict) {
      return reports
    }

    return selectedDistrict.reports
  }, [reports, selectedDistrict])
  const placeGroups = useMemo(
    () => groupReportsByPlace(districtFilteredReports, 'report-count-desc'),
    [districtFilteredReports],
  )
  const placeDropdownGroups = useMemo(
    () => groupReportsByPlace(districtFilteredReports, 'name-asc'),
    [districtFilteredReports],
  )
  const selectedReports = useMemo(() => {
    if (selectedPlaceKey === 'all') {
      return districtFilteredReports
    }

    const selectedPlaceGroup = placeGroups.find((group) => group.key === selectedPlaceKey)
      ?? placeDropdownGroups.find((group) => group.key === selectedPlaceKey)

    return selectedPlaceGroup?.reports ?? []
  }, [districtFilteredReports, placeDropdownGroups, placeGroups, selectedPlaceKey])
  const openReports = useMemo(
    () => selectedReports.filter((report) => isOpenReport(report)),
    [selectedReports],
  )
  const selectedPlace = useMemo(() => {
    if (selectedPlaceKey === 'all') {
      return null
    }

    return placeGroups.find((group) => group.key === selectedPlaceKey)
      ?? placeDropdownGroups.find((group) => group.key === selectedPlaceKey)
      ?? null
  }, [placeDropdownGroups, placeGroups, selectedPlaceKey])
  const totalPlaceGroupPages = useMemo(() => {
    if (placeGroupsPerPage === 'all') {
      return 1
    }

    return Math.max(1, Math.ceil(placeGroups.length / placeGroupsPerPage))
  }, [placeGroups.length, placeGroupsPerPage])
  const pagedPlaceGroups = useMemo(() => {
    if (placeGroupsPerPage === 'all') {
      return placeGroups
    }

    const startIndex = (placeGroupsPage - 1) * placeGroupsPerPage

    return placeGroups.slice(startIndex, startIndex + placeGroupsPerPage)
  }, [placeGroups, placeGroupsPage, placeGroupsPerPage])
  const visiblePlaceGroupsRange = useMemo(() => {
    if (placeGroups.length === 0) {
      return null
    }

    if (placeGroupsPerPage === 'all') {
      return {
        start: 1,
        end: placeGroups.length,
      }
    }

    const start = (placeGroupsPage - 1) * placeGroupsPerPage + 1
    const end = Math.min(placeGroups.length, placeGroupsPage * placeGroupsPerPage)

    return { start, end }
  }, [placeGroups.length, placeGroupsPage, placeGroupsPerPage])
  const totalOpenReportPages = useMemo(() => {
    if (openReportsPerPage === 'all') {
      return 1
    }

    return Math.max(1, Math.ceil(openReports.length / openReportsPerPage))
  }, [openReports.length, openReportsPerPage])
  const pagedOpenReports = useMemo(() => {
    if (openReportsPerPage === 'all') {
      return openReports
    }

    const startIndex = (openReportsPage - 1) * openReportsPerPage

    return openReports.slice(startIndex, startIndex + openReportsPerPage)
  }, [openReports, openReportsPage, openReportsPerPage])
  const visibleOpenReportsRange = useMemo(() => {
    if (openReports.length === 0) {
      return null
    }

    if (openReportsPerPage === 'all') {
      return {
        start: 1,
        end: openReports.length,
      }
    }

    const start = (openReportsPage - 1) * openReportsPerPage + 1
    const end = Math.min(openReports.length, openReportsPage * openReportsPerPage)

    return { start, end }
  }, [openReports.length, openReportsPage, openReportsPerPage])
  const totalReportPages = useMemo(() => {
    if (reportsPerPage === 'all') {
      return 1
    }

    return Math.max(1, Math.ceil(selectedReports.length / reportsPerPage))
  }, [reportsPerPage, selectedReports.length])
  const pagedSelectedReports = useMemo(() => {
    if (reportsPerPage === 'all') {
      return selectedReports
    }

    const startIndex = (reportsPage - 1) * reportsPerPage

    return selectedReports.slice(startIndex, startIndex + reportsPerPage)
  }, [reportsPage, reportsPerPage, selectedReports])
  const visibleReportsRange = useMemo(() => {
    if (selectedReports.length === 0) {
      return null
    }

    if (reportsPerPage === 'all') {
      return {
        start: 1,
        end: selectedReports.length,
      }
    }

    const start = (reportsPage - 1) * reportsPerPage + 1
    const end = Math.min(selectedReports.length, reportsPage * reportsPerPage)

    return { start, end }
  }, [reportsPage, reportsPerPage, selectedReports.length])

  useEffect(() => {
    if (skipPlaceResetRef.current) {
      skipPlaceResetRef.current = false
      return
    }

    if (pendingFocusRequestRef.current) {
      return
    }

    setSelectedPlaceKey('all')
  }, [selectedDistrictKey])

  useEffect(() => {
    if (!pendingFocusRequest) {
      return
    }

    if (selectedDistrictKey !== pendingFocusRequest.districtKey) {
      return
    }

    if (selectedPlaceKey !== pendingFocusRequest.placeKey) {
      setSelectedPlaceKey(pendingFocusRequest.placeKey)
      return
    }

    setFocusedReportRequest({
      id: pendingFocusRequest.reportId,
      nonce: pendingFocusRequest.nonce,
    })
    setPendingFocusRequest(null)
  }, [pendingFocusRequest, selectedDistrictKey, selectedPlaceKey])

  useEffect(() => {
    setPlaceGroupsPage(1)
  }, [selectedDistrictKey, placeGroupsPerPage])

  useEffect(() => {
    setPlaceGroupsPage((currentPage) => Math.min(currentPage, totalPlaceGroupPages))
  }, [totalPlaceGroupPages])

  useEffect(() => {
    setOpenReportsPage(1)
  }, [selectedDistrictKey, selectedPlaceKey, openReportsPerPage])

  useEffect(() => {
    setOpenReportsPage((currentPage) => Math.min(currentPage, totalOpenReportPages))
  }, [totalOpenReportPages])

  useEffect(() => {
    setReportsPage(1)
  }, [selectedDistrictKey, selectedPlaceKey, reportsPerPage])

  useEffect(() => {
    setReportsPage((currentPage) => Math.min(currentPage, totalReportPages))
  }, [totalReportPages])

  const handlePlaceGroupSelect = (group: PlaceGroup) => {
    if (selectedDistrictKey !== 'all' && group.district) {
      const matchingDistrict = districtGroups.find((districtGroup) => districtGroup.district === group.district)

      if (matchingDistrict && matchingDistrict.key !== selectedDistrictKey) {
        setSelectedDistrictKey(matchingDistrict.key)
      }
    }

    setSelectedPlaceKey(group.key)
  }

  const handleReportCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, report: Report) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    handleReportFocus(report)
  }

  const handleReportFocus = useCallback((report: Report) => {
    const allDistrictGroups = groupReportsByDistrict(reports, 'name-asc')
    const allPlaceGroups = groupReportsByPlace(reports, 'name-asc')
    const matchingDistrict = allDistrictGroups.find((group) => group.reports.some((groupReport) => groupReport.id === report.id))
    const matchingPlace = allPlaceGroups.find((group) => group.reports.some((groupReport) => groupReport.id === report.id))

    const nextDistrictKey = matchingDistrict?.key ?? 'all'
    const nextPlaceKey = matchingPlace?.key ?? 'all'
    const nextNonce = (focusedReportRequest?.nonce ?? 0) + 1

    setPendingFocusRequest({
      reportId: report.id,
      districtKey: nextDistrictKey,
      placeKey: nextPlaceKey,
      nonce: nextNonce,
    })

    skipPlaceResetRef.current = true
    setSelectedDistrictKey(nextDistrictKey)
    setSelectedPlaceKey(nextPlaceKey)

    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [focusedReportRequest?.nonce, reports])

  useEffect(() => {
    handleReportFocusRef.current = handleReportFocus
  }, [handleReportFocus])

  useEffect(() => {
    const queryReportId = searchParams.get('report')

    if (!queryReportId) {
      handledQueryReportIdRef.current = null
      return
    }

    if (handledQueryReportIdRef.current === queryReportId) {
      return
    }

    const report = reports.find((currentReport) => currentReport.id === queryReportId)

    if (!report) {
      return
    }

    handledQueryReportIdRef.current = queryReportId
    handleReportFocusRef.current(report)
  }, [reports, searchParams])

  const handleReportsViewed = (reportIds: string[]) => {
    if (!engagementEnabled) {
      return
    }

    const supabase = createClient()

    incrementReportViews(supabase, reportIds).catch((error) => {
      console.error('Error tracking popup report views:', error)
    })
  }

  const handleUpvote = async (reportId: string) => {
    if (!engagementEnabled) {
      return
    }

    if (!currentUserId) {
      router.push('/auth/login')
      return
    }

    setUpvotePendingId(reportId)

    try {
      const supabase = createClient()
      const result = await toggleReportUpvote(supabase, reportId)

      setReports((currentReports) =>
        currentReports.map((report) =>
          report.id === reportId
            ? {
                ...report,
                upvotes: result.upvotes,
                priority: result.priority,
              }
            : report,
        ),
      )
      setUpvotedReportIds((currentIds) => {
        const nextIds = new Set(currentIds)

        if (result.has_upvoted) {
          nextIds.add(reportId)
        } else {
          nextIds.delete(reportId)
        }

        return nextIds
      })
    } catch (error) {
      console.error('Error toggling report upvote:', error)
    } finally {
      setUpvotePendingId(null)
    }
  }

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
                  <label className="block text-sm font-medium mb-2">Filtriraj po okrugu</label>
                  <select
                    value={selectedDistrictKey}
                    onChange={(event) => setSelectedDistrictKey(event.target.value)}
                    className="w-full md:max-w-md"
                  >
                    <option value="all">Svi okruzi</option>
                    {districtGroups.map((group) => (
                      <option key={group.key} value={group.key}>
                        {group.district} ({group.reportCount})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Filtriraj po mestu / naselju</label>
                  <select
                    value={selectedPlaceKey}
                    onChange={(event) => setSelectedPlaceKey(event.target.value)}
                    className="w-full md:max-w-md"
                  >
                    <option value="all">Sva mesta</option>
                    {placeDropdownGroups.map((group) => (
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

            <div ref={mapSectionRef}>
              <MapComponent
                reports={selectedReports}
                selectedDistrict={selectedDistrict?.district ?? null}
                focusedReportId={focusedReportRequest?.id ?? null}
                focusedReportNonce={focusedReportRequest?.nonce ?? 0}
                onPlaceGroupSelect={handlePlaceGroupSelect}
                onReportsViewed={handleReportsViewed}
                statusLabels={statusLabels}
              />
            </div>

            {!selectedPlace && !selectedDistrict && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6 no-print">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Pregled po mestu</h2>
                  {visiblePlaceGroupsRange && (
                    <p className="mt-1 text-sm text-gray-600">
                      Prikaz {visiblePlaceGroupsRange.start}-{visiblePlaceGroupsRange.end} od {placeGroups.length}
                    </p>
                  )}
                </div>

                {placeGroups.length > PLACE_GROUPS_PAGE_SIZE && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600">Prikaži:</span>
                    <button
                      type="button"
                      onClick={() => setPlaceGroupsPerPage(PLACE_GROUPS_PAGE_SIZE)}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                        placeGroupsPerPage === PLACE_GROUPS_PAGE_SIZE
                          ? 'bg-secondary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      6 po strani
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaceGroupsPerPage(PLACE_GROUPS_PAGE_SIZE * 2)}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                        placeGroupsPerPage === PLACE_GROUPS_PAGE_SIZE * 2
                          ? 'bg-secondary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Prikaži više
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaceGroupsPerPage('all')}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                        placeGroupsPerPage === 'all'
                          ? 'bg-secondary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Sve
                    </button>
                  </div>
                )}
              </div>

              {placeGroups.length === 0 ? (
                <p className="text-gray-600">Još nema podataka za grupisanje po mestu.</p>
              ) : (
                <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {pagedPlaceGroups.map((group) => (
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
                {placeGroupsPerPage !== 'all' && totalPlaceGroupPages > 1 && (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-600">
                      Strana {placeGroupsPage} od {totalPlaceGroupPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPlaceGroupsPage((currentPage) => Math.max(1, currentPage - 1))}
                        disabled={placeGroupsPage === 1}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Prethodna
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlaceGroupsPage((currentPage) => Math.min(totalPlaceGroupPages, currentPage + 1))}
                        disabled={placeGroupsPage === totalPlaceGroupPages}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Sledeća
                      </button>
                    </div>
                  </div>
                )}
                </>
              )}
            </div>
            )}

            <div className="mt-8 bg-white rounded-lg shadow-md p-6 print-area print-card">
              {engagementEnabled && (
                <ReportViewsTracker
                  trackingKey={`print:${selectedDistrictKey}:${selectedPlaceKey}`}
                  reportIds={openReports.map((report) => report.id)}
                />
              )}
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between print-header">
                <div>
                  <h2 className="text-2xl font-bold">Otvoreni problemi za slanje</h2>
                  {visibleOpenReportsRange && (
                    <p className="mt-1 text-sm text-gray-600 no-print">
                      Prikaz {visibleOpenReportsRange.start}-{visibleOpenReportsRange.end} od {openReports.length}
                    </p>
                  )}
                  <p className="text-gray-600 mt-1 print-subtitle">
                    {selectedPlace
                      ? `Mesto: ${selectedPlace.label}${selectedPlace.municipality ? `, ${selectedPlace.municipality}` : ''}`
                      : selectedDistrict
                        ? `Okrug: ${selectedDistrict.district}`
                      : 'Prikaz svih mesta'}
                  </p>
                </div>
                <p className="text-sm text-gray-500 print-summary">
                  Broj otvorenih problema: <strong>{openReports.length}</strong>
                </p>
              </div>

              {openReports.length > OPEN_REPORTS_PAGE_SIZE && (
                <div className="mt-4 flex flex-wrap items-center gap-2 no-print">
                  <span className="text-sm text-gray-600">Prikaži:</span>
                  <button
                    type="button"
                    onClick={() => setOpenReportsPerPage(OPEN_REPORTS_PAGE_SIZE)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                      openReportsPerPage === OPEN_REPORTS_PAGE_SIZE
                        ? 'bg-secondary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    6 po strani
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenReportsPerPage(OPEN_REPORTS_PAGE_SIZE * 2)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                      openReportsPerPage === OPEN_REPORTS_PAGE_SIZE * 2
                        ? 'bg-secondary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Prikaži više
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenReportsPerPage('all')}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                      openReportsPerPage === 'all'
                        ? 'bg-secondary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Sve
                  </button>
                </div>
              )}

              {openReports.length === 0 ? (
                <p className="text-gray-600 mt-4">Nema otvorenih problema za izabrano mesto.</p>
              ) : (
                <>
                <div className="mt-4 space-y-4">
                  {pagedOpenReports.map((report) => {
                    const location = parseReportLocation(report.tags)
                    const showPlaceLine = !selectedPlace
                    const showMunicipalityLine =
                      !!location.municipality &&
                      (!selectedPlace ||
                        normalizeValue(location.municipality) !== normalizeValue(selectedPlace.municipality))
                    const showDistrictLine =
                      !!location.district &&
                      (!selectedPlace ||
                        normalizeValue(location.district) !== normalizeValue(selectedPlace.district))

                    return (
                      <div
                        key={report.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleReportFocus(report)}
                        onKeyDown={(event) => handleReportCardKeyDown(event, report)}
                        className="border border-gray-200 rounded-lg p-4 print-card print-item cursor-pointer transition hover:border-secondary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between print-item-layout">
                          <div>
                            <h3 className="font-bold text-lg">{report.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 print-description">{report.description}</p>
                            <div className="mt-3 flex flex-wrap gap-3 print-tags">
                              <MetadataItem type="category" label={categoryLabels[report.category] ?? getCategoryLabel(report.category)} />
                              <MetadataItem type="status" label={statusLabels[report.status] ?? getStatusLabel(report.status)} />
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 md:text-right print-meta">
                            {showPlaceLine && <p className="whitespace-nowrap"><strong>Mesto:</strong> {getReportPlaceLabel(report)}</p>}
                            {showMunicipalityLine && <p className="whitespace-nowrap"><strong>Opština:</strong> {location.municipality}</p>}
                            {showDistrictLine && <p className="whitespace-nowrap"><strong>Okrug:</strong> {location.district}</p>}
                            {getVisibleAuthorName(report, authorNames) && <p className="whitespace-nowrap"><strong>Autor:</strong> {getVisibleAuthorName(report, authorNames)}</p>}
                            <p className="inline-flex items-center gap-1.5 whitespace-nowrap"><MetadataIcon type="location" /><span className="whitespace-nowrap"><strong>Koordinate:</strong> {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span></p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {openReportsPerPage !== 'all' && totalOpenReportPages > 1 && (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
                    <p className="text-sm text-gray-600">
                      Strana {openReportsPage} od {totalOpenReportPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenReportsPage((currentPage) => Math.max(1, currentPage - 1))}
                        disabled={openReportsPage === 1}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Prethodna
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenReportsPage((currentPage) => Math.min(totalOpenReportPages, currentPage + 1))}
                        disabled={openReportsPage === totalOpenReportPages}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Sledeća
                      </button>
                    </div>
                  </div>
                )}
                </>
              )}
            </div>

            <div className="mt-8 bg-white rounded-lg shadow-md p-6 no-print">
              {engagementEnabled && (
                <ReportViewsTracker
                  trackingKey={`grid:${selectedDistrictKey}:${selectedPlaceKey}:${reportsPage}:${reportsPerPage}`}
                  reportIds={pagedSelectedReports.map((report) => report.id)}
                />
              )}
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    Prijavljeni problemi ({selectedReports.length})
                  </h2>
                  {visibleReportsRange && (
                    <p className="text-sm text-gray-600 mt-1">
                      Prikaz {visibleReportsRange.start}-{visibleReportsRange.end} od {selectedReports.length}
                    </p>
                  )}
                </div>

                {selectedReports.length > REPORTS_PAGE_SIZE && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600">Prikaži:</span>
                    <button
                      type="button"
                      onClick={() => setReportsPerPage(REPORTS_PAGE_SIZE)}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                        reportsPerPage === REPORTS_PAGE_SIZE
                          ? 'bg-secondary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      6 po strani
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportsPerPage(REPORTS_PAGE_SIZE * 2)}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                        reportsPerPage === REPORTS_PAGE_SIZE * 2
                          ? 'bg-secondary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Prikaži više
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportsPerPage('all')}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                        reportsPerPage === 'all'
                          ? 'bg-secondary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Sve
                    </button>
                  </div>
                )}
              </div>

              {selectedReports.length === 0 ? (
                <p className="text-gray-600">Nema prijavljenih problema. Budite prvi i prijavite problem!</p>
              ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pagedSelectedReports.map((report) => {
                    const location = parseReportLocation(report.tags)
                    const showPlaceLine = !selectedPlace
                    const showMunicipalityLine =
                      !!location.municipality &&
                      (!selectedPlace ||
                        normalizeValue(location.municipality) !== normalizeValue(selectedPlace.municipality))

                    return (
                    <div
                      key={report.id}
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        if (isInteractiveTarget(event.target)) {
                          return
                        }

                        handleReportFocus(report)
                      }}
                      onKeyDown={(event) => handleReportCardKeyDown(event, report)}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer hover:border-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                    >
                      <div className="relative w-full h-48 mb-3 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={getReportPhotoUrl(report.photo_url)}
                          alt={report.title}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{report.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{report.description.substring(0, 100)}...</p>

                      <div className="flex flex-wrap gap-3 mb-3">
                        <MetadataItem type="category" label={categoryLabels[report.category] ?? getCategoryLabel(report.category)} />
                        <MetadataItem type="status" label={statusLabels[report.status] ?? getStatusLabel(report.status)} />
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        {showPlaceLine && <p className="whitespace-nowrap"><strong>Mesto:</strong> {getReportPlaceLabel(report)}</p>}
                        {showMunicipalityLine && <p className="whitespace-nowrap"><strong>Opština:</strong> {location.municipality}</p>}
                        {getVisibleAuthorName(report, authorNames) && <p className="whitespace-nowrap"><strong>Autor:</strong> {getVisibleAuthorName(report, authorNames)}</p>}
                      </div>
                      {engagementEnabled && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 whitespace-nowrap">
                            Glasovi: {report.upvotes ?? 0}
                          </span>
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 whitespace-nowrap">
                            Prioritet: {getPriorityLabel(report.upvotes)}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleUpvote(report.id)
                            }}
                            disabled={upvotePendingId === report.id}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                              upvotedReportIds.has(report.id)
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {upvotePendingId === report.id ? 'Čuvanje...' : upvotedReportIds.has(report.id) ? 'Ukloni glas' : 'Podrži problem'}
                          </button>
                        </div>
                      )}
                    </div>
                    )
                  })}
                </div>
                {reportsPerPage !== 'all' && totalReportPages > 1 && (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-600">
                      Strana {reportsPage} od {totalReportPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReportsPage((currentPage) => Math.max(1, currentPage - 1))}
                        disabled={reportsPage === 1}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Prethodna
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportsPage((currentPage) => Math.min(totalReportPages, currentPage + 1))}
                        disabled={reportsPage === totalReportPages}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Sledeća
                      </button>
                    </div>
                  </div>
                )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}