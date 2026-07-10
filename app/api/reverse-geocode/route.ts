import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from '@/lib/supabaseConfig'
import { findSerbiaDistrictByPoint } from '@/lib/serbiaDistricts'
import {
  EMBEDDED_SERBIA_SETTLEMENTS,
  findNearestSettlement,
  settlementToLocationDetails,
  type SerbiaSettlement,
} from '@/lib/serbiaGeo'


function firstString(...values: Array<string | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''
}

let cachedSettlements: SerbiaSettlement[] | null = null

async function loadDatabaseSettlements() {
  if (cachedSettlements) {
    return cachedSettlements
  }

  const { url: supabaseUrl, publishableKey: supabaseKey } = getSupabaseConfig()

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data, error } = await supabase
    .from('settlements')
    .select('name, municipality, district, region, place_type, latitude, longitude')

  if (error || !data) {
    return []
  }

  cachedSettlements = data.map((settlement) => ({
    name: settlement.name,
    municipality: settlement.municipality,
    district: settlement.district ?? '',
    region: settlement.region,
    placeType: settlement.place_type,
    latitude: Number(settlement.latitude),
    longitude: Number(settlement.longitude),
  }))

  return cachedSettlements
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const latitude = Number(searchParams.get('latitude'))
  const longitude = Number(searchParams.get('longitude'))

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 })
  }

  const districtMatch = findSerbiaDistrictByPoint(latitude, longitude)

  const databaseSettlements = await loadDatabaseSettlements()
  const nearestDatabaseSettlement = findNearestSettlement(
    latitude,
    longitude,
    databaseSettlements,
  )

  if (nearestDatabaseSettlement) {
    const nearestDatabaseLocation = settlementToLocationDetails(nearestDatabaseSettlement)

    return NextResponse.json({
      ...nearestDatabaseLocation,
      district: districtMatch?.district ?? nearestDatabaseLocation.district,
      region: districtMatch?.region ?? nearestDatabaseLocation.region,
    })
  }

  const nominatimUrl = new URL('https://nominatim.openstreetmap.org/reverse')
  nominatimUrl.searchParams.set('format', 'jsonv2')
  nominatimUrl.searchParams.set('lat', latitude.toString())
  nominatimUrl.searchParams.set('lon', longitude.toString())
  nominatimUrl.searchParams.set('zoom', '14')
  nominatimUrl.searchParams.set('addressdetails', '1')
  nominatimUrl.searchParams.set('accept-language', 'sr')

  try {
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'EvoRupa/1.0 (location grouping)',
      },
      cache: 'force-cache',
      next: {
        revalidate: 86400,
      },
    })

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed with status ${response.status}`)
    }

    const data = await response.json()
    const address = data.address ?? {}
    const placeName = firstString(
      address.city,
      address.town,
      address.village,
      address.hamlet,
      address.suburb,
      address.municipality,
      address.county,
    )
    const placeType =
      (placeName && (
        address.city
          ? 'city'
          : address.town
            ? 'town'
            : address.village
              ? 'village'
              : address.hamlet
                ? 'hamlet'
                : address.suburb
                  ? 'suburb'
                  : address.municipality
                    ? 'municipality'
                    : 'county'
      )) || 'unknown'

    return NextResponse.json({
      placeName,
      placeType,
      municipality: firstString(address.city, address.town, address.municipality, address.county, placeName),
      district: districtMatch?.district ?? firstString(address.state_district, address.county),
      region: districtMatch?.region ?? firstString(address.state, address.region, address.country, 'Srbija'),
    })
  } catch (error) {
    console.error('Reverse geocoding error:', error)

    const nearestEmbeddedSettlement = findNearestSettlement(
      latitude,
      longitude,
      EMBEDDED_SERBIA_SETTLEMENTS,
    )

    if (nearestEmbeddedSettlement) {
      const nearestEmbeddedLocation = settlementToLocationDetails(nearestEmbeddedSettlement)

      return NextResponse.json({
        ...nearestEmbeddedLocation,
        district: districtMatch?.district ?? nearestEmbeddedLocation.district,
        region: districtMatch?.region ?? nearestEmbeddedLocation.region,
      })
    }

    return NextResponse.json({
      placeName: '',
      placeType: 'unknown',
      municipality: '',
      district: districtMatch?.district ?? '',
      region: districtMatch?.region ?? 'Srbija',
    })
  }
}