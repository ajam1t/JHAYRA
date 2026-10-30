import { createClient } from '@supabase/supabase-js';

// Public values: the URL and publishable key are meant to ship to the browser.
// Row Level Security on the database decides what each visitor can read or write.
const URL = import.meta.env?.VITE_SUPABASE_URL || 'https://gwxdzemazqontjobqnyy.supabase.co';
const KEY = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_aY3MrFdQflveTXhDNb_YyQ_S7HOZUE3';

export const SUPABASE_URL = URL;
export const SUPABASE_KEY = KEY;
export const supabase = createClient(URL, KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
