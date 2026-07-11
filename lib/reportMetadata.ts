import type { Database } from '@/lib/supabase'

type CategoryRow = Database['public']['Tables']['report_categories']['Row']
type StatusRow = Database['public']['Tables']['report_statuses']['Row']

export const DEFAULT_REPORT_CATEGORIES: CategoryRow[] = [
  { code: 'road_damage', label_sr: 'Oštećenje puta', description: 'Oštećenja kolovoza i bankina.', sort_order: 10 },
  { code: 'pothole', label_sr: 'Rupa na putu', description: 'Udarne rupe i lokalna oštećenja.', sort_order: 20 },
  { code: 'traffic_sign', label_sr: 'Saobraćajna signalizacija', description: 'Nedostajuća ili oštećena signalizacija.', sort_order: 30 },
  { code: 'lighting', label_sr: 'Javna rasveta', description: 'Problemi sa uličnom rasvetom.', sort_order: 40 },
  { code: 'sidewalk', label_sr: 'Pločnik i pešačke staze', description: 'Oštećenja pešačke infrastrukture.', sort_order: 50 },
  { code: 'other', label_sr: 'Ostalo', description: 'Drugi infrastrukturni problemi.', sort_order: 60 },
]

export const DEFAULT_REPORT_STATUSES: StatusRow[] = [
  { code: 'pending', label_sr: 'Na čekanju', description: 'Prijava je zaprimljena i čeka obradu.', sort_order: 10 },
  { code: 'in_progress', label_sr: 'U radu', description: 'Radovi ili obrada su u toku.', sort_order: 20 },
  { code: 'resolved', label_sr: 'Rešeno', description: 'Problem je rešen.', sort_order: 30 },
  { code: 'rejected', label_sr: 'Odbačeno', description: 'Prijava je odbijena ili zatvorena bez akcije.', sort_order: 40 },
]

export function buildCategoryLabelMap(categories: CategoryRow[] = DEFAULT_REPORT_CATEGORIES) {
  return Object.fromEntries(categories.map((category) => [category.code, category.label_sr])) as Record<string, string>
}

export function buildStatusLabelMap(statuses: StatusRow[] = DEFAULT_REPORT_STATUSES) {
  return Object.fromEntries(statuses.map((status) => [status.code, status.label_sr])) as Record<string, string>
}

export function derivePriorityFromUpvotes(upvotes: number | null | undefined) {
  const total = Math.max(0, upvotes ?? 0)

  if (total >= 20) {
    return 'high'
  }

  if (total >= 5) {
    return 'medium'
  }

  return 'low'
}

export function sortCategories(categories: CategoryRow[]) {
  return [...categories].sort((left, right) => left.sort_order - right.sort_order)
}

export function sortStatuses(statuses: StatusRow[]) {
  return [...statuses].sort((left, right) => left.sort_order - right.sort_order)
}