import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface RedirectRouteProps {
  params: Promise<{
    username: string;
    linkId: string;
  }>;
}

export async function GET(_request: Request, { params }: RedirectRouteProps) {
  const { linkId } = await params;
  const supabase = await createClient();

  // Get the link
  const { data: link, error } = await supabase
    .from('links')
    .select('url')
    .eq('id', linkId)
    .eq('is_active', true)
    .single();

  if (error || !link) {
    notFound();
  }

  // Increment click count using RPC
  await supabase.rpc('increment_link_click', { link_id: linkId });

  // Redirect to the actual URL
  redirect(link.url);
}
