import 'server-only';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { after } from 'next/server';
import { ratelimit } from '@/lib/upstash/redis';

export async function trackProfileView(profileId: string) {
  // Capture headers immediately (synchronously available in Server Components)
  const headerStore = await headers();
  const userAgent = headerStore.get('user-agent');
  const referer = headerStore.get('referer');
  const country = headerStore.get('x-vercel-ip-country');
  const city = headerStore.get('x-vercel-ip-city');

  // Extract IP for rate limiting with Vercel priority
  const vercelIp = headerStore.get('x-vercel-forwarded-for');
  const realIp = headerStore.get('x-real-ip');
  const forwardedFor = headerStore.get('x-forwarded-for');

  const ip =
    (vercelIp && vercelIp.split(',')[0].trim()) ||
    (realIp && realIp.trim()) ||
    (forwardedFor && forwardedFor.split(',')[0].trim()) ||
    '127.0.0.1';

  // Offload DB write to after() so response isn't blocked
  after(async () => {
    // 1. Check Rate Limit
    // We check this before creating the client to save resources
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return;
    }

    // We use the Secret Key (formerly Service Role Key) to bypass RLS.
    // This allows us to remove the "Allow anonymous inserts" policy from the database,
    // preventing public spam/fake analytics data.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );

    try {
      await supabase.from('profile_events').insert({
        profile_id: profileId,
        user_agent: userAgent,
        referer: referer,
        country: country,
        city: city,
      });
    } catch (error) {
      console.error('Failed to track profile view:', error);
    }
  });
}
