import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { env } from '@/env';

/**
 * Creates a Supabase client with Service Role privileges.
 * WARNING: This client bypasses Row Level Security (RLS).
 * Use only in secure server-side contexts.
 */
export const createAdminClient = () => {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SECRET_KEY;

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
