import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { trackProfileView } from '@/lib/tracking';
import ProfileView from './components/ProfileView';

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Get profile first (required for links query)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) {
    notFound();
  }

  // Fire and forget tracking
  trackProfileView(profile.id);

  // Get links for this specific user (filtered at DB level)
  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const typedLinks = (links || []).map((link) => ({
    id: link.id,
    title: link.title,
    url: link.url,
    is_active: link.is_active,
    short_id: link.short_id,
  }));

  return (
    <div className='flex flex-col min-h-screen'>
      <ProfileView
        profile={{
          ...profile,
          social_links: profile.social_links as Record<string, string>,
        }}
        links={typedLinks}
      />
    </div>
  );
}

export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  return {
    title: profile?.display_name || `@${username}`,
    description: profile?.bio || `Check out ${username}'s links`,
  };
}
