import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import ReportViewsTracker from '@/components/ReportViewsTracker'
import { buildVisibleAuthorMap, getVisibleAuthorName } from '@/lib/reportAuthors'
import { buildStatusLabelMap, sortStatuses } from '@/lib/reportMetadata'
import { getReportPhotoUrl } from '@/lib/reportMedia'
import { getSupabaseConfig } from '@/lib/supabaseConfig'
import { getReportPlaceLabel, groupReportsByPlace, isOpenReport } from '@/lib/reportLocation'
import type { Report } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function loadReports() {
  const { url, publishableKey } = getSupabaseConfig()
  const supabase = createClient(url, publishableKey)
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) {
    console.error('Home page reports load failed:', error)
    return [] as Report[]
  }

  return data as Report[]
}

async function loadAuthorNames(reports: Report[]) {
  const userIds = Array.from(new Set(reports.map((report) => report.user_id)))

  if (userIds.length === 0) {
    return new Map<string, string>()
  }

  const { url, publishableKey } = getSupabaseConfig()
  const supabase = createClient(url, publishableKey)
  const { data } = await supabase
    .from('users')
    .select('id, full_name, is_public')
    .in('id', userIds)

  return buildVisibleAuthorMap(data ?? [])
}

async function loadStatusLabels() {
  const { url, publishableKey } = getSupabaseConfig()
  const supabase = createClient(url, publishableKey)
  const { data, error } = await supabase
    .from('report_statuses')
    .select('code, label_sr, description, sort_order')

  return {
    labels: buildStatusLabelMap(data?.length ? sortStatuses(data) : undefined),
    enabled: !error,
  }
}

export default async function Home() {
  const reports = await loadReports()
  const authorNames = await loadAuthorNames(reports)
  const { labels: statusLabels, enabled: engagementEnabled } = await loadStatusLabels()
  const openReports = reports.filter((report) => isOpenReport(report))
  const placeGroups = groupReportsByPlace(reports, 'report-count-desc')
  const featuredPlaces = placeGroups.slice(0, 6)
  const featuredReports = openReports.slice(0, 6)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary text-white">
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-4">
          Unapredi infrastrukturu Srbije
        </h2>
        <p className="text-xl text-gray-200 mb-8">
          EvoRupa pomaže da prijaviš rupe i druge probleme na putevima i infrastrukturi direktno lokalnoj upravi.
        </p>
        <p className="mx-auto mb-8 max-w-2xl text-sm text-blue-100">
          Za povratne informacije, predloge i učešće u razvoju koristi naš GitHub:
          {' '}
          <a
            href="https://github.com/mmilosevic14/evorupa/issues"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-white underline underline-offset-4"
          >
            Issues
          </a>
          {' '}
          i
          {' '}
          <a
            href="https://github.com/mmilosevic14/evorupa/discussions"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-white underline underline-offset-4"
          >
            Discussions
          </a>
          .
        </p>
        <div className="space-x-4">
          <Link href="/map" className="btn-primary inline-block">
            Pogledaj mapu
          </Link>
          <Link href="/report" className="btn-secondary inline-block">
            Prijavi problem
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 text-left md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm text-blue-100">Ukupno prijava</p>
            <p className="mt-2 text-4xl font-bold">{reports.length}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm text-blue-100">Otvoreni problemi</p>
            <p className="mt-2 text-4xl font-bold">{openReports.length}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm text-blue-100">Mesta sa prijavama</p>
            <p className="mt-2 text-4xl font-bold">{placeGroups.length}</p>
          </div>
        </div>
      </section>

      <section className="bg-white text-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold mb-12 text-center">
            Kako funkcioniše?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card">
              <div className="text-4xl mb-4">📸</div>
              <h4 className="font-bold text-lg mb-2">1. Slikaj</h4>
              <p>Slikaj problem na putu ili infrastrukturi</p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">📍</div>
              <h4 className="font-bold text-lg mb-2">2. Locira</h4>
              <p>Označi lokaciju na mapi gde se nalazi problem</p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">✓</div>
              <h4 className="font-bold text-lg mb-2">3. Prijavi</h4>
              <p>Pošalji detaljan izveštaj lokalnoj upravi</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-100 text-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-3xl font-bold">Pregled prijava</h3>
              <p className="text-gray-600 mt-2">
                Najaktivnija mesta i najnoviji otvoreni problemi direktno sa mape.
              </p>
            </div>
            <Link href="/map" className="text-primary font-semibold hover:underline">
              Otvori celu mapu
            </Link>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <h4 className="text-xl font-bold">Najaktivnija mesta</h4>
              {featuredPlaces.length === 0 ? (
                <p className="mt-4 text-gray-600">Još nema prijava za prikaz.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {featuredPlaces.map((group) => (
                    <div key={group.key} className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4">
                      <div>
                        <p className="font-semibold">{group.label}</p>
                        {group.municipality && (
                          <p className="text-sm text-gray-600">Opština/grad: {group.municipality}</p>
                        )}
                        {group.district && (
                          <p className="text-sm text-gray-600">Okrug: {group.district}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Ukupno</p>
                        <p className="text-2xl font-bold">{group.reportCount}</p>
                        <p className="text-sm text-red-700">Otvoreno: {group.openCount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md">
              {engagementEnabled && <ReportViewsTracker trackingKey="home:featured-reports" reportIds={featuredReports.map((report) => report.id)} />}
              <h4 className="text-xl font-bold">Otvoreni problemi</h4>
              {featuredReports.length === 0 ? (
                <p className="mt-4 text-gray-600">Nema otvorenih problema za prikaz.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {featuredReports.map((report) => (
                    <Link
                      key={report.id}
                      href={`/map?report=${report.id}`}
                      className="block rounded-xl border border-gray-200 p-4 transition hover:border-secondary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start">
                          <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:w-36">
                            <Image
                              src={getReportPhotoUrl(report.photo_url)}
                              alt={report.title}
                              fill
                              unoptimized
                              sizes="(max-width: 640px) 100vw, 144px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                          <p className="font-semibold">{report.title}</p>
                          <p className="mt-1 text-sm text-gray-600">{report.description}</p>
                          <p className="mt-2 text-sm text-gray-500 whitespace-nowrap">
                            Mesto: {getReportPlaceLabel(report)}
                          </p>
                          {getVisibleAuthorName(report, authorNames) && (
                            <p className="mt-1 text-sm text-gray-500 whitespace-nowrap">
                              Autor: {getVisibleAuthorName(report, authorNames)}
                            </p>
                          )}
                          </div>
                        </div>
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 whitespace-nowrap">
                          {statusLabels[report.status] ?? report.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 text-center">
          <h3 className="text-3xl font-bold">Uključi se preko GitHub-a</h3>
          <p className="max-w-2xl text-slate-300">
            Prijavi bag, predloži poboljšanje ili učestvuj u planiranju narednih koraka kroz GitHub Issues i Discussions.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/mmilosevic14/evorupa/issues"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              Otvori issue
            </a>
            <a
              href="https://github.com/mmilosevic14/evorupa/discussions"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/30 px-5 py-3 font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Otvori diskusiju
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
