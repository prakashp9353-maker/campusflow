import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: 'Invalid request ID.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,role')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 })
  }

  const { data: request, error: requestError } = await supabase
    .from('requests')
    .select('id,status,assigned_to')
    .eq('id', id)
    .maybeSingle()
  if (requestError) {
    return NextResponse.json({ error: 'Unable to verify the request.' }, { status: 500 })
  }
  if (!request) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
  }
  if (request.status === 'completed') {
    return NextResponse.json({ error: 'Completed requests cannot be assigned.' }, { status: 409 })
  }
  if (request.assigned_to === profile.id && request.status !== 'pending') {
    return NextResponse.json({ success: true, updatedAt: null, alreadyAssigned: true })
  }

  const update: { assigned_to: string; status?: 'assigned' } = { assigned_to: profile.id }
  if (request.status === 'pending') update.status = 'assigned'

  const { data: updated, error: updateError } = await supabase
    .from('requests')
    .update(update)
    .eq('id', request.id)
    .select('id,status,assigned_to,updated_at')
    .maybeSingle()
  if (updateError) {
    return NextResponse.json({ error: 'Request assignment could not be saved.' }, { status: 500 })
  }
  if (!updated) {
    return NextResponse.json({ error: 'You are not authorized to manage this request.' }, { status: 403 })
  }

  return NextResponse.json({ success: true, updatedAt: updated.updated_at })
}
