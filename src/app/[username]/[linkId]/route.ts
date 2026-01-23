import { notFound, redirect } from 'next/navigation';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RedirectRouteProps {
  params: Promise<{
    username: string;
    linkId: string;
  }>;
}

export async function GET(request: Request, { params }: RedirectRouteProps) {
  const { username, linkId } = await params;
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
    // Create a new client for the background task
    // Note: We might need a service role or just reuse the logic,
    // but typically `createClient` works if we are just inserting public data or using RLS that allows it.
    // However, since this is a public route, `createClient` will be anonymous.
    // Ensure RLS allows anonymous inserts for `link_events` and RLS allows `increment_link_click`.
    const trackingSupabase = await createClient();

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
