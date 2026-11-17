// src/utils/supabase.js
import { createClient } from '@supabase/supabase-js'

// 🚨 这里换成你自己的 Supabase 项目 URL 和 Anon Key
const supabaseUrl = 'https://otrmipumtinzhxmxbvvb.supabase.co'
const supabaseAnonKey = 'sb_publishable_A749Sduo37WHv0RSSsDCGA_oVR-0sBo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)