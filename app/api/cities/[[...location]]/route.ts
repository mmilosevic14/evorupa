import { NextRequest, NextResponse } from 'next/server'

import { findCities, normalizeLocation } from '@/lib/cities'

type RouteContext = {
  params: Promise<{
    location?: string[]
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { location = [] } = await params
  const searchParams = request.nextUrl.searchParams

  if (location.length > 2) {
    return NextResponse.json(
      {
        error:
          'Use /api/cities, /api/cities/{country} (for example /api/cities/serbia), or /api/cities/{country}/{region} (for example /api/cities/serbia/vojvodina).',
      },
      { status: 400 },
    )
  }

  const queryCountry = searchParams.get('country') || undefined
  const queryRegion = searchParams.get('region') || undefined
  const pathCountry = location[0]
  const pathRegion = location[1]

  if (
    (queryCountry &&
      pathCountry &&
      normalizeLocation(queryCountry) !== normalizeLocation(pathCountry)) ||
    (queryRegion &&
      pathRegion &&
      normalizeLocation(queryRegion) !== normalizeLocation(pathRegion))
  ) {
    return NextResponse.json(
      {
        error:
          'Country and region filters must match between the path and query string when both are provided.',
      },
      { status: 400 },
    )
  }

  const country = queryCountry || pathCountry
  const region = queryRegion || pathRegion
  const matchedCities = findCities({
    country,
    region,
  })

  return NextResponse.json({
    country: country ?? null,
    region: region ?? null,
    count: matchedCities.length,
    cities: matchedCities.map((city) => city.name),
  })
}
