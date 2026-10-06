import { notFound, redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { isRole } from '@/lib/navigation'
import { requireProfile } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'

export default async function RoleLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ role: string }> }) {
  const { role } = await params
  if (!isRole(role)) notFound()

  const profile = await requireProfile()
  // Each role may only open its own workspace.
  if (profile.role !== role) {
    redirect(profile.role === 'staff' ? '/login?error=role' : `/${profile.role}/dashboard`)
  }

  const supabase = await createClient()
  const { count: unreadNotificationCount, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('is_read', false)

  if (error) console.error('Unable to load unread notification count:', error)

  return (
    <AppShell
      role={role}
      user={{ fullName: profile.full_name, email: profile.email }}
      unreadNotificationCount={unreadNotificationCount ?? 0}
    >
      {children}
    </AppShell>
  )
}
