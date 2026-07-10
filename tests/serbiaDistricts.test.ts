import { describe, expect, it } from 'vitest'

import {
  SERBIA_DISTRICT_BOUNDARIES,
  findSerbiaDistrictByPoint,
} from '@/lib/serbiaDistricts'

describe('serbiaDistricts', () => {
  it('loads district boundary data', () => {
    expect(SERBIA_DISTRICT_BOUNDARIES.length).toBeGreaterThan(20)
  })

  it('matches a point in Belgrade to Grad Beograd', () => {
    expect(findSerbiaDistrictByPoint(44.8176, 20.4633)).toEqual({
      district: 'Grad Beograd',
      region: 'Srbija',
    })
  })

  it('returns null for points outside Serbia', () => {
    expect(findSerbiaDistrictByPoint(0, 0)).toBeNull()
  })
})