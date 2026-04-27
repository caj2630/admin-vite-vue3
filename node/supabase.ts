import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    (process.env.SUPABASE_PROJECT_ID
      ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
      : '')
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase config is missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.',
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}
