import type { Database, Report } from '@/lib/supabase'

export type PublicAuthorProfile = Pick<
  Database['public']['Tables']['users']['Row'],
  'id' | 'full_name' | 'is_public'
>

export function buildVisibleAuthorMap(profiles: PublicAuthorProfile[]) {
  return new Map(
    profiles
      .filter((profile) => profile.is_public && profile.full_name)
      .map((profile) => [profile.id, profile.full_name as string]),
  )
}

export function getVisibleAuthorName(
  report: Pick<Report, 'user_id'>,
  authorNames: Map<string, string>,
) {
  return authorNames.get(report.user_id) ?? null
}
