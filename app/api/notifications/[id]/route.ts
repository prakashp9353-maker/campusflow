import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: 'Invalid notification ID.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Notification could not be updated.' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Notification not found.' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
