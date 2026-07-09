import { NextResponse } from 'next/server'

function firstString(...values: Array<string | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const latitude = Number(searchParams.get('latitude'))
  const longitude = Number(searchParams.get('longitude'))

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 })
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
      district: firstString(address.state_district, address.county),
      region: firstString(address.state, address.region, address.country, 'Srbija'),
    })
  } catch (error) {
    console.error('Reverse geocoding error:', error)

    return NextResponse.json({
      placeName: '',
      placeType: 'unknown',
      municipality: '',
      district: '',
      region: 'Srbija',
    })
  }
}