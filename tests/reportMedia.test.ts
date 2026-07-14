import { describe, expect, it } from 'vitest'

import {
  DEFAULT_REPORT_PHOTO_URL,
  LEGACY_DEFAULT_REPORT_PHOTO_URL,
  getReportPhotoUrl,
} from '@/lib/reportMedia'
import {
  getCenteredSquareCrop,
  getScaledImageDimensions,
  MAX_IMAGE_DIMENSION,
  WEBP_QUALITY,
} from '@/lib/reportImageProcessing'

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

  it('limits converted images to 800px while preserving aspect ratio', () => {
    expect(MAX_IMAGE_DIMENSION).toBe(800)
    expect(getScaledImageDimensions(2400, 1200)).toEqual({ width: 800, height: 400 })
    expect(getScaledImageDimensions(1200, 2400)).toEqual({ width: 400, height: 800 })
    expect(getScaledImageDimensions(640, 480)).toEqual({ width: 640, height: 480 })
  })

  it('uses a centered square crop before resizing report images', () => {
    expect(getCenteredSquareCrop(1200, 2400)).toEqual({
      sourceX: 0,
      sourceY: 600,
      sourceSize: 1200,
    })
    expect(getCenteredSquareCrop(2400, 1200)).toEqual({
      sourceX: 600,
      sourceY: 0,
      sourceSize: 1200,
    })
  })

  it('uses a non-premium webp quality setting to save space', () => {
    expect(WEBP_QUALITY).toBe(0.72)
  })
})