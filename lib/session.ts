import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/types'

export type Profile = {
  id: string
  email: string
  full_name: string
  role: Role
  student_id: string | null
  academic_department: string | null
  semester: number | null
}

/** The signed-in user's profile, or null. Role always comes from the database, never from the client. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('id,email,full_name,role,student_id,academic_department,semester')
    .eq('id', user.id)
    .single()
  return (data as Profile | null) ?? null
})

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  return profile
}
