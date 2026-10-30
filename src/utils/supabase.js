// src/utils/supabase.js
import { createClient } from '@supabase/supabase-js'

// 🚨 这里换成你自己的 Supabase 项目 URL 和 Anon Key
const supabaseUrl = 'https://你的项目ID.supabase.co'
const supabaseAnonKey = '你的Anon-Key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)