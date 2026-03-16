import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://afcjkbufqhwezmmidqmj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmY2prYnVmcWh3ZXptbWlkcW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjQxNTcsImV4cCI6MjA4OTI0MDE1N30.UxuczDmt8QKuzcir-27_i-JjypgJXaA3bPbjkhdNbq8'

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