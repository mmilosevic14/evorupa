import serbiaDistrictsGeoJson from '@/data/serbia-districts.json'

type GeoJsonPosition = [number, number]
type GeoJsonLinearRing = GeoJsonPosition[]
type GeoJsonPolygonCoordinates = GeoJsonLinearRing[]
type GeoJsonMultiPolygonCoordinates = GeoJsonPolygonCoordinates[]

interface SerbiaDistrictFeature {
  properties: {
    name: string
  }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: GeoJsonPolygonCoordinates | GeoJsonMultiPolygonCoordinates
  }
}

interface SerbiaDistrictGeoJson {
  features: SerbiaDistrictFeature[]
}

export interface SerbiaDistrictBoundaryFeature {
  district: string
  polygons: GeoJsonMultiPolygonCoordinates
  bounds: {
    south: number
    west: number
    north: number
    east: number
  }
}

const DISTRICT_NAME_ALIASES: Record<string, string> = {
  severnobacki: 'Severnobački upravni okrug',
  zapadnobacki: 'Zapadnobački upravni okrug',
  severnobanatski: 'Severnobanatski upravni okrug',
  pcinjski: 'Pčinjski upravni okrug',
  borski: 'Borski upravni okrug',
  zajecarski: 'Zaječarski upravni okrug',
  pirotski: 'Pirotski upravni okrug',
  jablanicki: 'Jablanički upravni okrug',
  raski: 'Raški upravni okrug',
  pomoravski: 'Pomoravski upravni okrug',
  toplicki: 'Toplički upravni okrug',
  zlatiborski: 'Zlatiborski upravni okrug',
  sremski: 'Sremski upravni okrug',
  macvanski: 'Mačvanski upravni okrug',
  juznobacki: 'Južnobački upravni okrug',
  srednjebanatski: 'Srednjobanatski upravni okrug',
  juznobanatski: 'Južnobanatski upravni okrug',
  branicevski: 'Braničevski upravni okrug',
  gradbeograd: 'Grad Beograd',
  podunavski: 'Podunavski upravni okrug',
  nisavski: 'Nišavski upravni okrug',
  sumadijski: 'Šumadijski upravni okrug',
  moravicki: 'Moravički upravni okrug',
  kolubarski: 'Kolubarski upravni okrug',
}

const districtGeoJson = serbiaDistrictsGeoJson as unknown as SerbiaDistrictGeoJson

function toDistrictKey(rawName: string) {
  return rawName
    .trim()
    .replace(/Å¡/g, 'š')
    .replace(/Å¾/g, 'ž')
    .replace(/Å /g, 'Š')
    .replace(/Ä/g, 'č')
    .replace(/Ä/g, 'ć')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase()
}

function normalizeDistrictName(rawName: string) {
  return DISTRICT_NAME_ALIASES[toDistrictKey(rawName)] ?? rawName
}

function pointIsInsideRing(latitude: number, longitude: number, ring: GeoJsonLinearRing) {
  let isInside = false

  for (let currentIndex = 0, previousIndex = ring.length - 1; currentIndex < ring.length; previousIndex = currentIndex++) {
    const [currentLongitude, currentLatitude] = ring[currentIndex]
    const [previousLongitude, previousLatitude] = ring[previousIndex]

    const intersects =
      currentLatitude > latitude !== previousLatitude > latitude &&
      longitude <
        ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) /
          (previousLatitude - currentLatitude) +
          currentLongitude

    if (intersects) {
      isInside = !isInside
    }
  }

  return isInside
}

function pointIsInsidePolygon(latitude: number, longitude: number, polygon: GeoJsonPolygonCoordinates) {
  if (polygon.length === 0 || !pointIsInsideRing(latitude, longitude, polygon[0])) {
    return false
  }

  for (let holeIndex = 1; holeIndex < polygon.length; holeIndex += 1) {
    if (pointIsInsideRing(latitude, longitude, polygon[holeIndex])) {
      return false
    }
  }

  return true
}

function toMultiPolygonCoordinates(feature: SerbiaDistrictFeature): GeoJsonMultiPolygonCoordinates {
  return feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates as GeoJsonPolygonCoordinates]
    : (feature.geometry.coordinates as GeoJsonMultiPolygonCoordinates)
}

function getBounds(polygons: GeoJsonMultiPolygonCoordinates) {
  let south = Number.POSITIVE_INFINITY
  let west = Number.POSITIVE_INFINITY
  let north = Number.NEGATIVE_INFINITY
  let east = Number.NEGATIVE_INFINITY

  polygons.forEach((polygon) => {
    polygon.forEach((ring) => {
      ring.forEach(([longitude, latitude]) => {
        south = Math.min(south, latitude)
        west = Math.min(west, longitude)
        north = Math.max(north, latitude)
        east = Math.max(east, longitude)
      })
    })
  })

  return { south, west, north, east }
}

export interface SerbiaDistrictMatch {
  district: string
  region: string
}

export const SERBIA_DISTRICT_BOUNDARIES: SerbiaDistrictBoundaryFeature[] = districtGeoJson.features.map((feature) => {
  const polygons = toMultiPolygonCoordinates(feature)

  return {
    district: normalizeDistrictName(feature.properties.name),
    polygons,
    bounds: getBounds(polygons),
  }
})

export function findSerbiaDistrictByPoint(
  latitude: number,
  longitude: number,
): SerbiaDistrictMatch | null {
  for (const feature of SERBIA_DISTRICT_BOUNDARIES) {
    const isMatch = feature.polygons.some((polygon) => pointIsInsidePolygon(latitude, longitude, polygon))

    if (isMatch) {
      return {
        district: feature.district,
        region: 'Srbija',
      }
    }
  }

  return null
}