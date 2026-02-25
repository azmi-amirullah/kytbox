import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { trackProfileView } from '@/lib/tracking';
import ProfileView from './components/ProfileView';
import { cache } from 'react';
import type { CustomThemeData } from '@/lib/theme';

const getProfile = cache(async (username: string) => {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();
  return profile;
});

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Get profile first (required for links query)
  const profile = await getProfile(username);

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
    is_folder: link.is_folder,
    parent_id: link.parent_id,
  }));

  return (
    <div className='flex flex-col min-h-screen'>
      <ProfileView
        profile={{
          ...profile,
          social_links: profile.social_links as Record<string, string>,
          custom_theme: profile.custom_theme as CustomThemeData | null,
        }}
        links={typedLinks}
      />
    </div>
  );
}

export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const profile = await getProfile(username);

  return {
    title: profile?.display_name || `@${username}`,
    description: profile?.bio || `Check out ${username}'s links`,
  };
}
