import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://dhmapxgidzchzjwrzodn.supabase.co"
const supabaseAnonKey = "sb_publishable_TcjzACpgGfFcLzDIr9773Q_HRbA8UCK"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)