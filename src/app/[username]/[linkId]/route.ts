import { notFound, redirect } from 'next/navigation';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ratelimit } from '@/lib/upstash/redis';
import { headers } from 'next/headers';

interface RedirectRouteProps {
  params: Promise<{
    username: string;
    linkId: string;
  }>;
}

// Helper to get IP for rate limiting
async function getIp() {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return '127.0.0.1';
}

export async function GET(request: Request, { params }: RedirectRouteProps) {
  const { username, linkId } = await params;

  // 1. Rate Limiting Check
  // We check this FIRST to protect the DB from spam
  const ip = await getIp();
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    // If rate limited, just redirect to the profile page without tracking
    // This absorbs the attack without hitting the DB
    redirect(`/${username}`);
  }

  const supabase = await createClient();

  // First get the user profile to get user_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (!profile) {
    notFound();
  }

  // Try to find link by short_id first (if linkId is numeric), then fall back to UUID
  const isNumeric = /^\d+$/.test(linkId);

  let link;

  if (isNumeric) {
    // Look up by short_id (per-user)
    const { data } = await supabase
      .from('links')
      .select('id, url')
      .eq('user_id', profile.id)
      .eq('short_id', parseInt(linkId, 10))
      .eq('is_active', true)
      .single();
    link = data;
  } else {
    // Fall back to UUID lookup (for backwards compatibility)
    const { data } = await supabase
      .from('links')
      .select('id, url')
      .eq('id', linkId)
      .eq('is_active', true)
      .single();
    link = data;
  }

  if (!link) {
    // Link not found or inactive - redirect to bio page instead of 404
    redirect(`/${username}`);
  }

  // Capture metadata from request
  const userAgent = request.headers.get('user-agent') || null;

  // Prefer ?ref= param (passed from bio page capturing original source)
  // Fallback to referer header (direct link sharing)
  const url = new URL(request.url);
  const refFromParam = url.searchParams.get('ref');
  const referer = refFromParam || request.headers.get('referer') || null;

  // Track the click event (non-blocking for speed)
  // We use `after` to run this in the background without delaying the response
  after(async () => {
    // Use the ADMIN client for secure tracking
    // This allows us to disable public INSERT on the link_events table
    const trackingSupabase = createAdminClient();

    await Promise.all([
      // Legacy counter for fast lifetime display
      trackingSupabase.rpc('increment_link_click', { link_id: link.id }),
      // New event row for time-based analytics
      trackingSupabase.from('link_events').insert({
        link_id: link.id,
        user_agent: userAgent,
        referer: referer,
      }),
    ]);
  });

  // Redirect to the actual URL
  redirect(link.url);
}
