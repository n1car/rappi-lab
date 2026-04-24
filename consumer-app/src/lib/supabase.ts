import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase KEY:', supabaseKey ? 'OK' : 'FALTA')

export const supabase = createClient(supabaseUrl, supabaseKey)