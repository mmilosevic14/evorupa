import { NextRequest, NextResponse } from 'next/server'

import { findCities } from '@/lib/cities'

type RouteContext = {
  params: Promise<{
    location?: string[]
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { location = [] } = await params

  if (location.length > 2) {
    return NextResponse.json(
      {
        error:
          'Use /api/cities, /api/cities/serbia, or /api/cities/serbia/vojvodina.',
      },
      { status: 400 },
    )
  }

  const searchParams = request.nextUrl.searchParams
  const country = searchParams.get('country') || location[0]
  const region = searchParams.get('region') || location[1]
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
