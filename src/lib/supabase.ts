import { createClient } from '@supabase/supabase-js'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function getSupabaseUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin + '/supabase-proxy'
    }
  }
  return (import.meta.env.VITE_SUPABASE_PROXY_URL as string) || (import.meta.env.VITE_SUPABASE_URL as string)
}

const supabaseUrl = getSupabaseUrl()

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Не заданы VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
