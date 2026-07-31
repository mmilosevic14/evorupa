import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getCurrentAdminState } from '@/lib/adminAccess'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params

  const { isAdmin } = await getCurrentAdminState()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('approved' in body) ||
    typeof (body as Record<string, unknown>).approved !== 'boolean'
  ) {
    return NextResponse.json(
      { error: 'Body must be { "approved": true } or { "approved": false }' },
      { status: 400 },
    )
  }

  const approved = (body as { approved: boolean }).approved

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from('reports')
    .update({ approved, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, approved, updated_at')
    .maybeSingle()

  if (error) {
    console.error('Admin approve report error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
