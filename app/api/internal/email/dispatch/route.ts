import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { sendNotificationEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const supportedKinds = [
  'request_submitted',
  'request_assigned',
  'status_changed',
  'request_completed',
  'sla_warning',
  'request_escalated',
] as const

function hasValidSecret(request: Request): boolean {
  const secret = process.env.EMAIL_DISPATCH_SECRET
  if (!secret) return false

  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const expectedBytes = Buffer.from(secret)
  const providedBytes = Buffer.from(provided)
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes)
}

function isNotificationBatch(value: unknown): value is { notificationIds: string[] } {
  if (typeof value !== 'object' || value === null) return false
  const ids = (value as Record<string, unknown>).notificationIds
  return Array.isArray(ids)
    && ids.length > 0
    && ids.length <= 100
    && ids.every((id) => typeof id === 'string' && uuidPattern.test(id))
}

export async function POST(request: Request) {
  if (!process.env.EMAIL_DISPATCH_SECRET) {
    console.warn('Internal email dispatch is disabled: EMAIL_DISPATCH_SECRET is not configured.')
    return NextResponse.json({ error: 'Internal email dispatch is not configured.' }, { status: 503 })
  }
  if (!hasValidSecret(request)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  if (!isNotificationBatch(input)) {
    return NextResponse.json({ error: 'Provide between 1 and 100 valid notification IDs.' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    console.warn('Internal email dispatch is disabled: SUPABASE_SERVICE_ROLE_KEY is not configured.')
    return NextResponse.json({ error: 'Email dispatch is not configured.' }, { status: 503 })
  }

  const ids = [...new Set(input.notificationIds)]
  const { data: notifications, error: notificationError } = await adminClient
    .from('notifications')
    .select('id,user_id,request_id,kind,title,body')
    .in('id', ids)
    .in('kind', [...supportedKinds])
  if (notificationError) {
    console.error('Unable to load queued email notifications:', notificationError.message)
    return NextResponse.json({ error: 'Notifications could not be loaded.' }, { status: 500 })
  }

  const requestIds = [...new Set((notifications ?? []).flatMap((notification) => (
    notification.request_id ? [notification.request_id] : []
  )))]
  const recipientIds = [...new Set((notifications ?? []).map((notification) => notification.user_id))]
  const [requestResult, profileResult] = await Promise.all([
    requestIds.length
      ? adminClient.from('requests').select('id,public_id,title,status,student_id').in('id', requestIds)
      : Promise.resolve({ data: [], error: null }),
    recipientIds.length
      ? adminClient.from('profiles').select('id,email').in('id', recipientIds)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (requestResult.error || profileResult.error) {
    console.error('Unable to load request email details.')
    return NextResponse.json({ error: 'Email details could not be loaded.' }, { status: 500 })
  }

  const requests = new Map((requestResult.data ?? []).map((row) => [row.id, row]))
  const recipients = new Map((profileResult.data ?? []).map((row) => [row.id, row]))
  const deliveries = (notifications ?? []).flatMap((notification) => {
    const relatedRequest = notification.request_id ? requests.get(notification.request_id) : null
    const recipient = recipients.get(notification.user_id)
    if (!relatedRequest || !recipient || notification.user_id !== relatedRequest.student_id) return []
    return [{
      id: notification.id,
      kind: notification.kind,
      title: notification.title,
      body: notification.body,
      requestPublicId: relatedRequest.public_id,
      requestTitle: relatedRequest.title,
      requestStatus: relatedRequest.status,
      recipientEmail: recipient.email,
    }]
  })

  const results = await Promise.allSettled(deliveries.map(sendNotificationEmail))
  const failedCount = results.filter((result) => result.status === 'rejected').length
  if (failedCount > 0) {
    console.error(`Email dispatch failed for ${failedCount} notification(s).`)
    return NextResponse.json({ error: 'Some notification emails could not be sent.' }, { status: 502 })
  }

  const sentCount = results.filter((result) => result.status === 'fulfilled' && result.value === 'sent').length
  return NextResponse.json({
    success: true,
    sent: sentCount,
    skipped: results.length > 0 && sentCount === 0,
  })
}
