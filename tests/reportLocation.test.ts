import { describe, expect, it } from 'vitest'

import type { Report } from '@/lib/supabase'
import {
  buildLocationTags,
  getReportPlaceLabel,
  groupReportsByDistrict,
  groupReportsByPlace,
  isOpenReport,
  parseReportLocation,
} from '@/lib/reportLocation'

function createReport(overrides: Partial<Report> = {}): Report {
  return {
    id: overrides.id ?? 'report-1',
    user_id: overrides.user_id ?? 'user-1',
    title: overrides.title ?? 'Pothole',
    description: overrides.description ?? 'Road damage on a busy street',
    category: overrides.category ?? 'road_damage',
    latitude: overrides.latitude ?? 44.8,
    longitude: overrides.longitude ?? 20.4,
    photo_url: overrides.photo_url ?? null,
    photo_path: overrides.photo_path ?? null,
    photo_object_id: overrides.photo_object_id ?? null,
    status: overrides.status ?? 'pending',
    priority: overrides.priority ?? null,
    tags: overrides.tags ?? null,
    upvotes: overrides.upvotes ?? 0,
    views: overrides.views ?? 0,
    created_at: overrides.created_at ?? '2026-07-10T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-07-10T00:00:00.000Z',
    resolved_at: overrides.resolved_at ?? null,
  }
}

describe('reportLocation', () => {
  it('builds and parses normalized location tags', () => {
    const tags = buildLocationTags({
      placeName: ' Novi | Sad ',
      placeType: ' city ',
      municipality: ' Novi   Sad ',
      district: ' Južnobački upravni okrug ',
      region: ' Srbija ',
    })

    expect(tags).toEqual([
      'place:Novi / Sad',
      'placeType:city',
      'municipality:Novi Sad',
      'district:Južnobački upravni okrug',
      'region:Srbija',
    ])

    expect(parseReportLocation(tags)).toEqual({
      placeName: 'Novi / Sad',
      placeType: 'city',
      municipality: 'Novi Sad',
      district: 'Južnobački upravni okrug',
      region: 'Srbija',
    })
  })

  it('falls back to municipality or coordinates for the place label', () => {
    const municipalityOnly = createReport({
      tags: ['municipality:Kraljevo'],
    })
    const coordinateOnly = createReport({
      latitude: 43.72345,
      longitude: 20.68765,
      tags: null,
    })

    expect(getReportPlaceLabel(municipalityOnly)).toBe('Kraljevo')
    expect(getReportPlaceLabel(coordinateOnly)).toBe('43.723, 20.688')
  })

  it('identifies open and closed reports', () => {
    expect(isOpenReport(createReport({ status: 'pending' }))).toBe(true)
    expect(isOpenReport(createReport({ status: 'resolved' }))).toBe(false)
    expect(isOpenReport(createReport({ status: 'rejected' }))).toBe(false)
  })

  it('groups reports by place with averaged coordinates and open counts', () => {
    const reports = [
      createReport({
        id: '1',
        latitude: 44.81,
        longitude: 20.46,
        status: 'pending',
        tags: ['place:Beograd', 'municipality:Beograd', 'district:Grad Beograd', 'region:Srbija'],
      }),
      createReport({
        id: '2',
        latitude: 44.83,
        longitude: 20.48,
        status: 'resolved',
        tags: ['place:Beograd', 'municipality:Beograd', 'district:Grad Beograd', 'region:Srbija'],
      }),
      createReport({
        id: '3',
        latitude: 45.26,
        longitude: 19.84,
        status: 'in_progress',
        tags: ['place:Novi Sad', 'municipality:Novi Sad', 'district:Južnobački upravni okrug', 'region:Srbija'],
      }),
    ]

    const groups = groupReportsByPlace(reports)

    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({
      label: 'Beograd',
      reportCount: 2,
      openCount: 1,
      municipality: 'Beograd',
      district: 'Grad Beograd',
    })
    expect(groups[0].latitude).toBeCloseTo(44.82, 5)
    expect(groups[0].longitude).toBeCloseTo(20.47, 5)
    expect(groups[1]).toMatchObject({
      label: 'Novi Sad',
      reportCount: 1,
      openCount: 1,
    })
  })

  it('groups reports by district and provides fallback names for missing metadata', () => {
    const reports = [
      createReport({
        id: '1',
        status: 'pending',
        tags: ['district:Grad Beograd', 'region:Srbija'],
      }),
      createReport({
        id: '2',
        status: 'resolved',
        tags: ['district:Grad Beograd', 'region:Srbija'],
      }),
      createReport({
        id: '3',
        status: 'pending',
        tags: null,
      }),
    ]

    const groups = groupReportsByDistrict(reports)

    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({
      district: 'Grad Beograd',
      region: 'Srbija',
      reportCount: 2,
      openCount: 1,
    })
    expect(groups[1]).toMatchObject({
      district: 'Nepoznati okrug',
      region: 'Srbija',
      reportCount: 1,
      openCount: 1,
    })
  })
})