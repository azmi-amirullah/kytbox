import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { env } from '@/env';
import { getCookieDomain } from '@/lib/origin';

export function createClient() {
  const cookieDomain = getCookieDomain();

  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    {
      cookieOptions: {
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      },
    },
  );
}

