import { describe, expect, it } from 'vitest'

import {
  DEFAULT_REPORT_PHOTO_URL,
  LEGACY_DEFAULT_REPORT_PHOTO_URL,
  getReportPhotoUrl,
} from '@/lib/reportMedia'

describe('reportMedia', () => {
  it('returns the bundled default image when photo is missing', () => {
    expect(getReportPhotoUrl()).toBe(DEFAULT_REPORT_PHOTO_URL)
    expect(getReportPhotoUrl(null)).toBe(DEFAULT_REPORT_PHOTO_URL)
  })

  it('replaces the legacy fallback URL with the local default image', () => {
    expect(getReportPhotoUrl(LEGACY_DEFAULT_REPORT_PHOTO_URL)).toBe(DEFAULT_REPORT_PHOTO_URL)
  })

  it('preserves valid uploaded image URLs', () => {
    expect(getReportPhotoUrl('https://example.com/report.webp')).toBe('https://example.com/report.webp')
  })
})