import { describe, expect, it } from 'vitest'

import {
  EMBEDDED_SERBIA_SETTLEMENTS,
  findNearestSettlement,
  getDistanceInKilometers,
  settlementToLocationDetails,
} from '@/lib/serbiaGeo'

describe('serbiaGeo', () => {
  it('calculates geographic distance symmetrically', () => {
    const distance = getDistanceInKilometers(44.8176, 20.4633, 45.2671, 19.8335)
    const reverseDistance = getDistanceInKilometers(45.2671, 19.8335, 44.8176, 20.4633)

    expect(distance).toBeCloseTo(reverseDistance, 8)
    expect(distance).toBeGreaterThan(60)
    expect(distance).toBeLessThan(90)
  })

  it('finds the nearest settlement within the maximum distance', () => {
    const nearest = findNearestSettlement(44.82, 20.46, EMBEDDED_SERBIA_SETTLEMENTS)

    expect(nearest).not.toBeNull()

    if (!nearest) {
      throw new Error('Expected a nearby settlement match')
    }

    expect(nearest.name).toBe('Beograd')
    expect(nearest.district).toBe('Grad Beograd')
  })

  it('returns null when no settlement is close enough', () => {
    const nearest = findNearestSettlement(0, 0, EMBEDDED_SERBIA_SETTLEMENTS, 1)

    expect(nearest).toBeNull()
  })

  it('maps settlement data into location details', () => {
    const details = settlementToLocationDetails(EMBEDDED_SERBIA_SETTLEMENTS[0])

    expect(details).toEqual({
      placeName: 'Beograd',
      placeType: 'city',
      municipality: 'Beograd',
      district: 'Grad Beograd',
      region: 'Srbija',
    })
  })
})