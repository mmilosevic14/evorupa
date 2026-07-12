import { describe, expect, it, vi } from 'vitest'

import { incrementReportViews, toggleReportUpvote } from '@/lib/reportEngagement'

function createSupabaseMock(result: { data: unknown; error: Error | null }) {
  return {
    rpc: vi.fn().mockResolvedValue(result),
  } as any
}

describe('reportEngagement', () => {
  it('skips the RPC call when there are no report ids to track', async () => {
    const supabase = createSupabaseMock({ data: null, error: null })

    await incrementReportViews(supabase, [])

    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('calls the views RPC with the expected payload', async () => {
    const supabase = createSupabaseMock({ data: null, error: null })

    await incrementReportViews(supabase, ['report-1', 'report-2'])

    expect(supabase.rpc).toHaveBeenCalledWith('increment_report_views', {
      report_ids: ['report-1', 'report-2'],
    })
  })

  it('returns the first toggle result payload', async () => {
    const supabase = createSupabaseMock({
      data: [{ has_upvoted: true, upvotes: 7, priority: 'medium' }],
      error: null,
    })

    await expect(toggleReportUpvote(supabase, 'report-1')).resolves.toEqual({
      has_upvoted: true,
      upvotes: 7,
      priority: 'medium',
    })

    expect(supabase.rpc).toHaveBeenCalledWith('toggle_report_upvote', {
      p_report_id: 'report-1',
    })
  })

  it('throws when the toggle RPC returns no result row', async () => {
    const supabase = createSupabaseMock({ data: [], error: null })

    await expect(toggleReportUpvote(supabase, 'report-1')).rejects.toThrow(
      'Neuspešno ažuriranje glasa za prijavu.',
    )
  })

  it('rethrows RPC errors from engagement helpers', async () => {
    const viewsError = new Error('views failed')
    const upvoteError = new Error('upvote failed')
    const viewsSupabase = createSupabaseMock({ data: null, error: viewsError })
    const upvoteSupabase = createSupabaseMock({ data: null, error: upvoteError })

    await expect(incrementReportViews(viewsSupabase, ['report-1'])).rejects.toThrow('views failed')
    await expect(toggleReportUpvote(upvoteSupabase, 'report-1')).rejects.toThrow('upvote failed')
  })
})