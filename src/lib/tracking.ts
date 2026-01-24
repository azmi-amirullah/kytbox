import 'server-only';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { after } from 'next/server';

export async function trackProfileView(profileId: string) {
  // Capture headers immediately (synchronously available in Server Components)
  const headerStore = await headers();
  const userAgent = headerStore.get('user-agent');
  const referer = headerStore.get('referer');
  const country = headerStore.get('x-vercel-ip-country');
  const city = headerStore.get('x-vercel-ip-city');

  // Offload DB write to after() so response isn't blocked
  after(async () => {
    // We create a lightweight client without cookie handling for the background task
    // This is safe because "profile_events" allows anonymous inserts via RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
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
