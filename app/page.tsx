import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/session'

export default async function Home() {
  const profile = await getProfile()
  redirect(profile && profile.role !== 'staff' ? `/${profile.role}/dashboard` : '/login?error=role')
}
