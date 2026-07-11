import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase'

type ToggleUpvoteResult = Database['public']['Functions']['toggle_report_upvote']['Returns'][number]

type RpcInvoker = (
  functionName: string,
  args?: Record<string, unknown>,
) => Promise<{
  data: unknown
  error: Error | null
}>

export async function incrementReportViews(
  supabase: SupabaseClient<Database>,
  reportIds: string[],
) {
  if (reportIds.length === 0) {
    return
  }

  const { error } = await (supabase.rpc as unknown as RpcInvoker)('increment_report_views', {
    report_ids: reportIds,
  })

  if (error) {
    throw error
  }
}

export async function toggleReportUpvote(
  supabase: SupabaseClient<Database>,
  reportId: string,
) {
  const { data, error } = await (supabase.rpc as unknown as RpcInvoker)('toggle_report_upvote', {
    p_report_id: reportId,
  })

  if (error) {
    throw error
  }

  const result = (data as ToggleUpvoteResult[] | null | undefined)?.[0]

  if (!result) {
    throw new Error('Neuspešno ažuriranje glasa za prijavu.')
  }

  return result
}