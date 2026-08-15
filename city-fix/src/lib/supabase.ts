import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'CRITICAL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local file. Check your configuration.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);