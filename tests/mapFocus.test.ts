import { describe, expect, it } from 'vitest'

import {
  getPendingFocusAction,
  isPendingFocusReady,
  type PendingFocusRequest,
} from '@/lib/mapFocus'

const pendingFocusRequest: PendingFocusRequest = {
  reportId: 'report-2',
  districtKey: 'grad-beograd|srbija',
  placeKey: 'jajinci|beograd-vozdovac|grad beograd',
  nonce: 1,
}

describe('mapFocus', () => {
  it('models the report focus sequence step by step', () => {
    expect(
      getPendingFocusAction(
        pendingFocusRequest,
        'all',
        'all',
        [{ id: 'report-2' }],
      ),
    ).toBe('wait')

    expect(
      getPendingFocusAction(
        pendingFocusRequest,
        pendingFocusRequest.districtKey,
        'all',
        [{ id: 'report-2' }],
      ),
    ).toBe('select-place')

    expect(
      getPendingFocusAction(
        pendingFocusRequest,
        pendingFocusRequest.districtKey,
        pendingFocusRequest.placeKey,
        [{ id: 'report-1' }],
      ),
    ).toBe('wait')

    expect(
      getPendingFocusAction(
        pendingFocusRequest,
        pendingFocusRequest.districtKey,
        pendingFocusRequest.placeKey,
        [{ id: 'report-1' }, { id: 'report-2' }],
      ),
    ).toBe('focus-report')
  })

  it('waits until district, place, and selected reports all match the pending focus request', () => {
    expect(
      isPendingFocusReady(
        pendingFocusRequest,
        'all',
        'all',
        [{ id: 'report-2' }],
      ),
    ).toBe(false)

    expect(
      isPendingFocusReady(
        pendingFocusRequest,
        pendingFocusRequest.districtKey,
        'all',
        [{ id: 'report-2' }],
      ),
    ).toBe(false)

    expect(
      isPendingFocusReady(
        pendingFocusRequest,
        pendingFocusRequest.districtKey,
        pendingFocusRequest.placeKey,
        [{ id: 'report-1' }],
      ),
    ).toBe(false)

    expect(
      isPendingFocusReady(
        pendingFocusRequest,
        pendingFocusRequest.districtKey,
        pendingFocusRequest.placeKey,
        [{ id: 'report-1' }, { id: 'report-2' }],
      ),
    ).toBe(true)
  })

  it('returns false when there is no pending focus request', () => {
    expect(isPendingFocusReady(null, 'all', 'all', [{ id: 'report-2' }])).toBe(false)
  })
})