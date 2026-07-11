'use client'

import { useEffect, useRef } from 'react'

import { incrementReportViews } from '@/lib/reportEngagement'
import { createClient } from '@/utils/supabase/client'

export default function ReportViewsTracker({
  reportIds,
  trackingKey,
}: {
  reportIds: string[]
  trackingKey: string
}) {
  const lastSignatureRef = useRef('')

  useEffect(() => {
    if (reportIds.length === 0) {
      return
    }

    const signature = `${trackingKey}:${reportIds.join(',')}`

    if (lastSignatureRef.current === signature) {
      return
    }

    lastSignatureRef.current = signature

    const supabase = createClient()

    incrementReportViews(supabase, reportIds).catch((error) => {
      console.error('Error incrementing report views:', error)
    })
  }, [reportIds, trackingKey])

  return null
}