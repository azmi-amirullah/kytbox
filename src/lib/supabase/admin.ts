import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Creates a Supabase client with Service Role privileges.
 * WARNING: This client bypasses Row Level Security (RLS).
 * Use only in secure server-side contexts.
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SECRET_KEY is not defined');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
