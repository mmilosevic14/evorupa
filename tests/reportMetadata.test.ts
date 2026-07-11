import { describe, expect, it } from 'vitest'

import {
  buildCategoryLabelMap,
  buildStatusLabelMap,
  DEFAULT_REPORT_CATEGORIES,
  DEFAULT_REPORT_STATUSES,
  derivePriorityFromUpvotes,
  sortCategories,
  sortStatuses,
} from '@/lib/reportMetadata'

describe('reportMetadata', () => {
  it('builds Serbian category and status label maps', () => {
    const categoryLabels = buildCategoryLabelMap(DEFAULT_REPORT_CATEGORIES)
    const statusLabels = buildStatusLabelMap(DEFAULT_REPORT_STATUSES)

    expect(categoryLabels.road_damage).toBe('Oštećenje puta')
    expect(categoryLabels.pothole).toBe('Rupa na putu')
    expect(statusLabels.pending).toBe('Na čekanju')
    expect(statusLabels.in_progress).toBe('U radu')
  })

  it('derives priority from upvote totals', () => {
    expect(derivePriorityFromUpvotes(null)).toBe('low')
    expect(derivePriorityFromUpvotes(0)).toBe('low')
    expect(derivePriorityFromUpvotes(4)).toBe('low')
    expect(derivePriorityFromUpvotes(5)).toBe('medium')
    expect(derivePriorityFromUpvotes(19)).toBe('medium')
    expect(derivePriorityFromUpvotes(20)).toBe('high')
  })

  it('sorts metadata rows by configured sort order', () => {
    const categories = sortCategories([
      { code: 'other', label_sr: 'Ostalo', description: null, sort_order: 30 },
      { code: 'road_damage', label_sr: 'Oštećenje puta', description: null, sort_order: 10 },
    ])
    const statuses = sortStatuses([
      { code: 'resolved', label_sr: 'Rešeno', description: null, sort_order: 30 },
      { code: 'pending', label_sr: 'Na čekanju', description: null, sort_order: 10 },
    ])

    expect(categories.map((category) => category.code)).toEqual(['road_damage', 'other'])
    expect(statuses.map((status) => status.code)).toEqual(['pending', 'resolved'])
  })
})