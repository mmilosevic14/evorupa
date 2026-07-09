const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const repoRoot = path.resolve(__dirname, '..')
const envFile = path.join(repoRoot, '.env.local')
const TEST_BATCH_TAG = 'seed-batch:serbia-100'
const TEST_SOURCE_TAG = 'seed-source:automated-serbia'
const TEST_USER_EMAIL = 'test@example.com'
const TEST_USER_PASSWORD = '12345678'
const REPORTS_PER_PLACE = 4
const JITTER_SCALE = 0.015

const places = [
  { name: 'Beograd', latitude: 44.8176, longitude: 20.4633, type: 'city', municipality: 'Beograd', district: 'Grad Beograd', region: 'Srbija' },
  { name: 'Novi Sad', latitude: 45.2671, longitude: 19.8335, type: 'city', municipality: 'Novi Sad', district: 'Južnobački upravni okrug', region: 'Srbija' },
  { name: 'Niš', latitude: 43.3209, longitude: 21.8958, type: 'city', municipality: 'Niš', district: 'Nišavski upravni okrug', region: 'Srbija' },
  { name: 'Kragujevac', latitude: 44.0128, longitude: 20.9114, type: 'city', municipality: 'Kragujevac', district: 'Šumadijski upravni okrug', region: 'Srbija' },
  { name: 'Subotica', latitude: 46.1000, longitude: 19.6667, type: 'city', municipality: 'Subotica', district: 'Severnobački upravni okrug', region: 'Srbija' },
  { name: 'Zrenjanin', latitude: 45.3836, longitude: 20.3819, type: 'city', municipality: 'Zrenjanin', district: 'Srednjobanatski upravni okrug', region: 'Srbija' },
  { name: 'Pančevo', latitude: 44.8718, longitude: 20.6413, type: 'city', municipality: 'Pančevo', district: 'Južnobanatski upravni okrug', region: 'Srbija' },
  { name: 'Sombor', latitude: 45.7742, longitude: 19.1122, type: 'city', municipality: 'Sombor', district: 'Zapadnobački upravni okrug', region: 'Srbija' },
  { name: 'Kraljevo', latitude: 43.7258, longitude: 20.6894, type: 'city', municipality: 'Kraljevo', district: 'Raški upravni okrug', region: 'Srbija' },
  { name: 'Čačak', latitude: 43.8914, longitude: 20.3497, type: 'city', municipality: 'Čačak', district: 'Moravički upravni okrug', region: 'Srbija' },
  { name: 'Užice', latitude: 43.8556, longitude: 19.8425, type: 'city', municipality: 'Užice', district: 'Zlatiborski upravni okrug', region: 'Srbija' },
  { name: 'Valjevo', latitude: 44.2751, longitude: 19.8982, type: 'city', municipality: 'Valjevo', district: 'Kolubarski upravni okrug', region: 'Srbija' },
  { name: 'Smederevo', latitude: 44.6644, longitude: 20.9276, type: 'city', municipality: 'Smederevo', district: 'Podunavski upravni okrug', region: 'Srbija' },
  { name: 'Požarevac', latitude: 44.6213, longitude: 21.1878, type: 'city', municipality: 'Požarevac', district: 'Braničevski upravni okrug', region: 'Srbija' },
  { name: 'Pirot', latitude: 43.1531, longitude: 22.5861, type: 'city', municipality: 'Pirot', district: 'Pirotski upravni okrug', region: 'Srbija' },
  { name: 'Vranje', latitude: 42.5514, longitude: 21.9003, type: 'city', municipality: 'Vranje', district: 'Pčinjski upravni okrug', region: 'Srbija' },
  { name: 'Zlatibor', latitude: 43.7297, longitude: 19.6990, type: 'town', municipality: 'Čajetina', district: 'Zlatiborski upravni okrug', region: 'Srbija' },
  { name: 'Vrnjačka Banja', latitude: 43.6217, longitude: 20.8968, type: 'town', municipality: 'Vrnjačka Banja', district: 'Raški upravni okrug', region: 'Srbija' },
  { name: 'Aranđelovac', latitude: 44.3069, longitude: 20.5603, type: 'town', municipality: 'Aranđelovac', district: 'Šumadijski upravni okrug', region: 'Srbija' },
  { name: 'Bajina Bašta', latitude: 43.9708, longitude: 19.5675, type: 'town', municipality: 'Bajina Bašta', district: 'Zlatiborski upravni okrug', region: 'Srbija' },
  { name: 'Guča', latitude: 43.7762, longitude: 20.2253, type: 'village', municipality: 'Lučani', district: 'Moravički upravni okrug', region: 'Srbija' },
  { name: 'Mokra Gora', latitude: 43.7944, longitude: 19.5226, type: 'village', municipality: 'Čajetina', district: 'Zlatiborski upravni okrug', region: 'Srbija' },
  { name: 'Tršić', latitude: 44.4983, longitude: 19.2818, type: 'village', municipality: 'Loznica', district: 'Mačvanski upravni okrug', region: 'Srbija' },
  { name: 'Sirogojno', latitude: 43.6818, longitude: 19.8936, type: 'village', municipality: 'Čajetina', district: 'Zlatiborski upravni okrug', region: 'Srbija' },
  { name: 'Topola', latitude: 44.2525, longitude: 20.6775, type: 'town', municipality: 'Topola', district: 'Šumadijski upravni okrug', region: 'Srbija' },
]

const categories = [
  'pothole',
  'road_damage',
  'traffic_sign',
  'lighting',
  'sidewalk',
  'other',
]

const titles = [
  'Oštećen asfalt',
  'Duboka rupa na kolovozu',
  'Neispravno ulično osvetljenje',
  'Oštećen trotoar',
  'Nedostaje saobraćajni znak',
  'Neobeležen infrastrukturni problem',
]

const descriptions = [
  'Građani prijavljuju da problem traje duže vreme i otežava bezbedno kretanje kroz naselje.',
  'Potrebna je hitna intervencija jer problem utiče na saobraćaj i svakodnevni prolaz pešaka.',
  'Na lokaciji je uočeno više prijava i potrebno je planirati sanaciju u narednom budžetskom ciklusu.',
  'Problem je evidentiran kao deo test podataka za proveru grupisanja po mestu i regionu.',
]

function loadEnv() {
  if (!fs.existsSync(envFile)) {
    return
  }

  const envLines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/)

  for (const rawLine of envLines) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const name = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[name]) {
      process.env[name] = value
    }
  }
}

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || null,
  }
}

function normalizeTagValue(value) {
  return value.trim().replace(/\|/g, '/').replace(/\s+/g, ' ')
}

function buildLocationTags(location) {
  return [
    `place:${normalizeTagValue(location.placeName)}`,
    `placeType:${normalizeTagValue(location.placeType)}`,
    `municipality:${normalizeTagValue(location.municipality)}`,
    `district:${normalizeTagValue(location.district)}`,
    `region:${normalizeTagValue(location.region)}`,
    TEST_BATCH_TAG,
    TEST_SOURCE_TAG,
  ].filter((tag) => !tag.endsWith(':'))
}

function createJitter(index) {
  const angle = (index * 137.5 * Math.PI) / 180
  const radius = ((index % REPORTS_PER_PLACE) + 1) * JITTER_SCALE * 0.25

  return {
    latitudeOffset: Math.sin(angle) * radius,
    longitudeOffset: Math.cos(angle) * radius,
  }
}

async function reverseGeocode(latitude, longitude) {
  const nominatimUrl = new URL('https://nominatim.openstreetmap.org/reverse')
  nominatimUrl.searchParams.set('format', 'jsonv2')
  nominatimUrl.searchParams.set('lat', latitude.toString())
  nominatimUrl.searchParams.set('lon', longitude.toString())
  nominatimUrl.searchParams.set('zoom', '14')
  nominatimUrl.searchParams.set('addressdetails', '1')
  nominatimUrl.searchParams.set('accept-language', 'sr')

  const response = await fetch(nominatimUrl, {
    headers: {
      'User-Agent': 'EvoRupa/1.0 test data seeder',
    },
  })

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed for ${latitude},${longitude} with status ${response.status}`)
  }

  const data = await response.json()
  const address = data.address || {}
  const placeName =
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.suburb ||
    address.municipality ||
    address.county ||
    ''

  return {
    placeName,
    placeType:
      (address.city && 'city') ||
      (address.town && 'town') ||
      (address.village && 'village') ||
      (address.hamlet && 'hamlet') ||
      (address.suburb && 'suburb') ||
      (address.municipality && 'municipality') ||
      'unknown',
    municipality: address.city || address.town || address.municipality || address.county || placeName,
    district: address.state_district || address.county || '',
    region: address.state || address.region || address.country || 'Srbija',
  }
}

function buildFallbackLocation(place) {
  return {
    placeName: place.name,
    placeType: place.type,
    municipality: place.municipality || place.name,
    district: place.district || '',
    region: place.region || 'Srbija',
  }
}

async function resolvePlaceLocation(place) {
  const fallback = buildFallbackLocation(place)

  try {
    const remote = await reverseGeocode(place.latitude, place.longitude)

    return {
      placeName: fallback.placeName,
      placeType: fallback.placeType,
      municipality: remote.municipality || fallback.municipality,
      district: remote.district || fallback.district,
      region: remote.region || fallback.region,
    }
  } catch (error) {
    console.warn(`${error.message}. Falling back to embedded metadata for ${place.name}.`)
    return fallback
  }
}

function pick(array, index) {
  return array[index % array.length]
}

function createReport({ place, placeIndex, reportIndex, userId, location }) {
  const statusIndex = (placeIndex + reportIndex) % 5
  const status = statusIndex === 0 ? 'resolved' : statusIndex === 1 ? 'in_progress' : 'pending'
  const jitter = createJitter(placeIndex * REPORTS_PER_PLACE + reportIndex)
  const latitude = Number((place.latitude + jitter.latitudeOffset).toFixed(6))
  const longitude = Number((place.longitude + jitter.longitudeOffset).toFixed(6))

  return {
    id: crypto.randomUUID(),
    user_id: userId,
    title: `${pick(titles, placeIndex + reportIndex)} - ${place.name} #${reportIndex + 1}`,
    description: `${pick(descriptions, placeIndex * 2 + reportIndex)} Lokacija pripada mestu ${location.placeName || place.name}.`,
    category: pick(categories, placeIndex + reportIndex),
    latitude,
    longitude,
    photo_url: '/default-report-photo.jpg',
    status,
    priority: status === 'pending' ? 'high' : 'medium',
    tags: buildLocationTags(location),
    upvotes: reportIndex * 2,
    views: reportIndex * 5,
  }
}

async function ensureSeedUser(supabase, user) {
  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email,
      full_name: 'EvoRupa Test Seeder',
      role: 'citizen',
      city: 'Beograd',
      municipality: 'Beograd',
      bio: 'Automated test seeder for Serbia report data.',
      is_verified: true,
    },
    {
      onConflict: 'id',
      ignoreDuplicates: false,
    },
  )

  if (error) {
    throw error
  }

  return user.id
}

async function main() {
  loadEnv()

  const { url, key } = getSupabaseConfig()

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.')
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  })

  if (signInError) {
    throw signInError
  }

  if (!signInData.user) {
    throw new Error('Authenticated test user was not returned by Supabase.')
  }

  try {
    const userId = await ensureSeedUser(supabase, signInData.user)
    console.log(`Using seed user ${userId}`)

    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .contains('tags', [TEST_BATCH_TAG])

    if (deleteError) {
      throw deleteError
    }

    const placeLocations = []

    for (const place of places) {
      const location = await resolvePlaceLocation(place)
      placeLocations.push({ place, location })
      console.log(`Resolved ${place.name} -> ${location.placeName || 'unknown'} / ${location.region}`)
    }

    const reports = []

    placeLocations.forEach(({ place, location }, placeIndex) => {
      for (let reportIndex = 0; reportIndex < REPORTS_PER_PLACE; reportIndex += 1) {
        reports.push(
          createReport({
            place,
            placeIndex,
            reportIndex,
            userId,
            location,
          }),
        )
      }
    })

    const { error: insertError } = await supabase.from('reports').insert(reports)

    if (insertError) {
      throw insertError
    }

    const { data: insertedReports, error: summaryError } = await supabase
      .from('reports')
      .select('id,status,tags')
      .contains('tags', [TEST_BATCH_TAG])

    if (summaryError) {
      throw summaryError
    }

    const distinctPlaces = new Set(
      (insertedReports || [])
        .map((report) => report.tags?.find((tag) => tag.startsWith('place:')))
        .filter(Boolean),
    ).size

    console.log('Seed complete.')
    console.log(
      JSON.stringify(
        {
          total_reports: insertedReports?.length || 0,
          open_reports:
            insertedReports?.filter((report) => report.status === 'pending' || report.status === 'in_progress').length || 0,
          distinct_places: distinctPlaces,
        },
        null,
        2,
      ),
    )
  } finally {
    await supabase.auth.signOut()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})