import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { supabaseEnv } from './env'

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return null

  const { url } = supabaseEnv()
  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}
