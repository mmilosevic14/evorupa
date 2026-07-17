import type { Report } from '@/lib/supabase'

export interface PendingFocusRequest {
  reportId: string
  districtKey: string
  placeKey: string
  nonce: number
}

export type PendingFocusAction = 'wait' | 'select-place' | 'focus-report'

export function getPendingFocusAction(
  pendingFocusRequest: PendingFocusRequest | null,
  selectedDistrictKey: string,
  selectedPlaceKey: string,
  selectedReports: Pick<Report, 'id'>[],
) : PendingFocusAction {
  if (!pendingFocusRequest) {
    return 'wait'
  }

  if (selectedDistrictKey !== pendingFocusRequest.districtKey) {
    return 'wait'
  }

  if (selectedPlaceKey !== pendingFocusRequest.placeKey) {
    return 'select-place'
  }

  if (!selectedReports.some((report) => report.id === pendingFocusRequest.reportId)) {
    return 'wait'
  }

  return 'focus-report'
}

export function isPendingFocusReady(
  pendingFocusRequest: PendingFocusRequest | null,
  selectedDistrictKey: string,
  selectedPlaceKey: string,
  selectedReports: Pick<Report, 'id'>[],
) {
  return getPendingFocusAction(
    pendingFocusRequest,
    selectedDistrictKey,
    selectedPlaceKey,
    selectedReports,
  ) === 'focus-report'
}