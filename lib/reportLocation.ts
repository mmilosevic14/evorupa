import type { Report } from '@/lib/supabase'

export interface ReportLocationDetails {
  placeName: string
  placeType: string
  municipality: string
  district: string
  region: string
}

export interface PlaceGroup {
  key: string
  label: string
  placeName: string
  municipality: string
  district: string
  reportCount: number
  openCount: number
  latitude: number
  longitude: number
  reports: Report[]
}

export interface DistrictGroup {
  key: string
  district: string
  region: string
  reportCount: number
  openCount: number
  reports: Report[]
}

type PlaceGroupSortMode = 'name-asc' | 'report-count-desc'
type DistrictGroupSortMode = 'name-asc' | 'report-count-desc'

const LOCATION_TAG_PREFIXES = {
  placeName: 'place:',
  placeType: 'placeType:',
  municipality: 'municipality:',
  district: 'district:',
  region: 'region:',
} as const

const SERBIAN_COLLATOR = new Intl.Collator('sr', {
  sensitivity: 'base',
  numeric: true,
})

function compareText(left: string, right: string) {
  return SERBIAN_COLLATOR.compare(left, right)
}

function comparePlaceGroupNames(left: PlaceGroup, right: PlaceGroup) {
  return (
    compareText(left.label, right.label) ||
    compareText(left.municipality, right.municipality) ||
    compareText(left.district, right.district)
  )
}

function compareDistrictGroupNames(left: DistrictGroup, right: DistrictGroup) {
  return compareText(left.district, right.district) || compareText(left.region, right.region)
}

function sortPlaceGroups(groups: PlaceGroup[], sortMode: PlaceGroupSortMode) {
  if (sortMode === 'name-asc') {
    return groups.sort(comparePlaceGroupNames)
  }

  return groups.sort(
    (left, right) =>
      right.reportCount - left.reportCount || comparePlaceGroupNames(left, right),
  )
}

function sortDistrictGroups(groups: DistrictGroup[], sortMode: DistrictGroupSortMode) {
  if (sortMode === 'name-asc') {
    return groups.sort(compareDistrictGroupNames)
  }

  return groups.sort(
    (left, right) =>
      right.reportCount - left.reportCount || compareDistrictGroupNames(left, right),
  )
}

function normalizeTagValue(value: string) {
  return value.trim().replace(/\|/g, '/').replace(/\s+/g, ' ')
}

function readTagValue(tags: string[] | null | undefined, prefix: string) {
  const match = tags?.find((tag) => tag.startsWith(prefix))

  return match ? match.slice(prefix.length) : ''
}

export function buildLocationTags(location: ReportLocationDetails) {
  return [
    `${LOCATION_TAG_PREFIXES.placeName}${normalizeTagValue(location.placeName)}`,
    `${LOCATION_TAG_PREFIXES.placeType}${normalizeTagValue(location.placeType)}`,
    `${LOCATION_TAG_PREFIXES.municipality}${normalizeTagValue(location.municipality)}`,
    `${LOCATION_TAG_PREFIXES.district}${normalizeTagValue(location.district)}`,
    `${LOCATION_TAG_PREFIXES.region}${normalizeTagValue(location.region)}`,
  ].filter((tag) => !tag.endsWith(':'))
}

export function parseReportLocation(tags: string[] | null | undefined): ReportLocationDetails {
  const placeName = readTagValue(tags, LOCATION_TAG_PREFIXES.placeName)
  const placeType = readTagValue(tags, LOCATION_TAG_PREFIXES.placeType)
  const municipality = readTagValue(tags, LOCATION_TAG_PREFIXES.municipality)
  const district = readTagValue(tags, LOCATION_TAG_PREFIXES.district)
  const region = readTagValue(tags, LOCATION_TAG_PREFIXES.region)

  return {
    placeName,
    placeType,
    municipality,
    district,
    region,
  }
}

export function isOpenReport(report: Report) {
  return report.status !== 'resolved' && report.status !== 'rejected'
}

export function getReportPlaceLabel(report: Report) {
  const location = parseReportLocation(report.tags)

  if (location.placeName) {
    return location.placeName
  }

  if (location.municipality) {
    return location.municipality
  }

  return `${report.latitude.toFixed(3)}, ${report.longitude.toFixed(3)}`
}

export function groupReportsByPlace(
  reports: Report[],
  sortMode: PlaceGroupSortMode = 'report-count-desc',
) {
  const groups = new Map<string, PlaceGroup>()

  reports.forEach((report) => {
    const location = parseReportLocation(report.tags)
    const label = getReportPlaceLabel(report)
    const key = `${label.toLowerCase()}|${location.municipality.toLowerCase()}|${location.district.toLowerCase()}`
    const current = groups.get(key)

    if (!current) {
      groups.set(key, {
        key,
        label,
        placeName: location.placeName,
        municipality: location.municipality,
        district: location.district,
        reportCount: 1,
        openCount: isOpenReport(report) ? 1 : 0,
        latitude: report.latitude,
        longitude: report.longitude,
        reports: [report],
      })
      return
    }

    current.reportCount += 1
    current.openCount += isOpenReport(report) ? 1 : 0
    current.latitude =
      (current.latitude * (current.reportCount - 1) + report.latitude) / current.reportCount
    current.longitude =
      (current.longitude * (current.reportCount - 1) + report.longitude) / current.reportCount
    current.reports.push(report)
  })

  return sortPlaceGroups(Array.from(groups.values()), sortMode)
}

export function groupReportsByDistrict(
  reports: Report[],
  sortMode: DistrictGroupSortMode = 'report-count-desc',
) {
  const groups = new Map<string, DistrictGroup>()

  reports.forEach((report) => {
    const location = parseReportLocation(report.tags)
    const district = location.district || 'Nepoznati okrug'
    const region = location.region || 'Srbija'
    const key = `${district.toLowerCase()}|${region.toLowerCase()}`
    const current = groups.get(key)

    if (!current) {
      groups.set(key, {
        key,
        district,
        region,
        reportCount: 1,
        openCount: isOpenReport(report) ? 1 : 0,
        reports: [report],
      })
      return
    }

    current.reportCount += 1
    current.openCount += isOpenReport(report) ? 1 : 0
    current.reports.push(report)
  })

  return sortDistrictGroups(Array.from(groups.values()), sortMode)
}