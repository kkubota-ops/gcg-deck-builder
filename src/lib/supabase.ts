import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pbjdjgehvkbtckjgwvmu.supabase.co'
const supabaseAnonKey = 'sb_publishable_tgXwm4hnCWQ8czaT8EVTfg_fXVXilVE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
