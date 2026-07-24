import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { env } from '@/env';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            const cookieDomain =
              env.NODE_ENV === 'production'
                ? `.${new URL(env.NEXT_PUBLIC_SITE_URL).hostname.replace(/^www\./, '')}`
                : undefined;
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(cookieDomain ? { domain: cookieDomain } : {}),
              }),
            );
          } catch {
            // Server Component - setAll only available in Server Actions or Route Handlers
          }
        },
      },
    },
  );
}

export function createStaticClient() {
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op
        },
      },
    },
  );
}
