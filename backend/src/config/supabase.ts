import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl: string = process.env.SUPABASE_URL as string
const supabaseKey: string = process.env.SUPABASE_SERVICE_KEY as string

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)