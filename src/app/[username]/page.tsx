import { notFound } from 'next/navigation';
import { createStaticClient } from '@/lib/supabase/server';
import { trackProfileView } from '@/lib/tracking';
import { getPublicProfileData, ProfileView } from '@/features/bio';
import { getProfileByUsername } from '@/lib/data-cache';

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const supabase = createStaticClient();

  const data = await getPublicProfileData(supabase, username);
  if (!data) {
    notFound();
  }

  // Fire and forget tracking
  trackProfileView(data.profile.id);

  return (
    <div className='flex flex-col min-h-screen'>
      <ProfileView
        profile={data.profile}
        links={data.links}
        totalLinks={data.totalLinks}
      />
    </div>
  );
}

export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  const title = profile?.display_name ? `${profile.display_name} (@${username})` : `@${username}`;
  const description = profile?.bio || `Check out ${username}'s bio page and links on Kytbox.`;
  const avatarUrl = profile?.avatar_url || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://kytbox.com/${username}`,
      siteName: 'Kytbox',
      type: 'profile',
      images: avatarUrl ? [{ url: avatarUrl, alt: `${username}'s avatar` }] : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: avatarUrl ? [avatarUrl] : [],
    },
  };
}
