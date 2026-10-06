import { createClient } from '@/lib/supabase/client'
import type { AppRole } from './types'
import type { LoginInput, RegisterInput } from './validation'

const MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password.',
  'Email not confirmed': 'Confirm your email first. Check your inbox for the link we sent.',
  'User already registered': 'An account with this email already exists. Try signing in.',
}

function friendly(message: string): string {
  if (message in MESSAGES) return MESSAGES[message]
  if (message.includes('Database error saving new user')) {
    return 'Could not create the account. The student ID or email may already be registered.'
  }
  if (message.toLowerCase().includes('rate limit')) return 'Too many attempts. Wait a few minutes and try again.'
  return 'Something went wrong. Try again.'
}

export async function signIn(input: LoginInput): Promise<{ role: AppRole }> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })
  if (error || !data.user) throw new Error(friendly(error?.message ?? ''))

  // Role comes from the database profile, never from the client.
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
  if (!profile) throw new Error('Your account has no profile. Contact an administrator.')
  if (profile.role !== 'student' && profile.role !== 'admin') {
    throw new Error('Staff workspaces are not available in this version of CampusFlow.')
  }
  return { role: profile.role }
}

export async function registerStudent(input: RegisterInput): Promise<{ needsConfirmation: boolean }> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        full_name: input.fullName,
        student_id: input.studentId,
        department: input.department,
        semester: input.semester,
      },
    },
  })
  if (error) throw new Error(friendly(error.message))
  return { needsConfirmation: !data.session }
}

export async function signOut(): Promise<void> {
  await createClient().auth.signOut()
}
