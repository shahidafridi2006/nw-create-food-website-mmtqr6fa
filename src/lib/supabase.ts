import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '__SUPABASE_URL__'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '__SUPABASE_ANON_KEY__'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper function to get the current session ID for cart management
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('food_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('food_session_id', sessionId)
  }
  return sessionId
}

// Helper to clear session (useful for testing or after order completion)
export const clearSession = (): void => {
  localStorage.removeItem('food_session_id')
}