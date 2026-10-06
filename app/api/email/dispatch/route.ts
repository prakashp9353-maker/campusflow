import { NextResponse } from 'next/server'
import { sendNotificationEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const supportedKinds = [
  'request_submitted',
  'request_assigned',
  'status_changed',
  'request_completed',
  'sla_warning',
  'request_escalated',
] as const

function isDispatchInput(value: unknown): value is { requestId: string; eventAt: string } {
  if (typeof value !== 'object' || value === null) return false
  const input = value as Record<string, unknown>
  return typeof input.requestId === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)
    && typeof input.eventAt === 'string'
    && Number.isFinite(Date.parse(input.eventAt))
}

export async function POST(request: Request) {
  let input: unknown
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  if (!isDispatchInput(input)) {
    return NextResponse.json({ error: 'Invalid request event.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError || !profile || (profile.role !== 'student' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Not authorized to dispatch this event.' }, { status: 403 })
  }

  const { data: requestRow, error: requestError } = await supabase
    .from('requests')
    .select('id,public_id,title,status,student_id,updated_at')
    .eq('id', input.requestId)
    .maybeSingle()
  if (requestError || !requestRow) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
  }
  if (profile.role === 'student' && requestRow.student_id !== user.id) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
  }
  if (requestRow.updated_at !== input.eventAt) {
    return NextResponse.json({ error: 'The request event is no longer current.' }, { status: 409 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    console.warn('Email dispatch skipped: SUPABASE_SERVICE_ROLE_KEY is not configured.')
    return NextResponse.json({ success: true, skipped: true })
  }

  const { data: notifications, error: notificationsError } = await adminClient
    .from('notifications')
    .select('id,user_id,kind,title,body')
    .eq('request_id', requestRow.id)
    .eq('user_id', requestRow.student_id)
    .eq('created_at', input.eventAt)
    .in('kind', [...supportedKinds])
  if (notificationsError) {
    console.error('Unable to load notification events for email dispatch:', notificationsError.message)
    return NextResponse.json({ error: 'Email events could not be loaded.' }, { status: 500 })
  }
  if (!notifications || notifications.length === 0) {
    return NextResponse.json({ success: true, sent: 0 })
  }

  const { data: recipient, error: recipientError } = await adminClient
    .from('profiles')
    .select('email')
    .eq('id', requestRow.student_id)
    .maybeSingle()
  if (recipientError || !recipient) {
    console.error('Unable to load request notification recipient.')
    return NextResponse.json({ error: 'Email recipient could not be loaded.' }, { status: 500 })
  }

  try {
    const results = await Promise.all(notifications.map((notification) => sendNotificationEmail({
      id: notification.id,
      kind: notification.kind,
      title: notification.title,
      body: notification.body,
      requestPublicId: requestRow.public_id,
      requestTitle: requestRow.title,
      requestStatus: requestRow.status,
      recipientEmail: recipient.email,
    })))
    return NextResponse.json({
      success: true,
      sent: results.filter((result) => result === 'sent').length,
      skipped: results.every((result) => result === 'skipped'),
    })
  } catch (error) {
    console.error('Email notification dispatch failed:', error instanceof Error ? error.message : 'Unknown provider error.')
    return NextResponse.json({ error: 'Email dispatch failed; in-app notifications remain available.' }, { status: 502 })
  }
}
