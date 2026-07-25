import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { trackProfileView } from '@/lib/tracking';
import { getProfileByUsername, getCachedPublicLinks } from '@/lib/data-cache';
import { siteConfig } from '@/config/site';
import ProfileView from '@/features/bio/components/ProfileView';
import { socialLinksSchema } from '@/features/bio/schemas.client';
import { customThemeDataSchema } from '@/lib/validation.schemas';

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

// Streams the links after the profile shell is painted
async function ProfileLinksStream({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const { data: rawRootLinks } = await getCachedPublicLinks(userId, username);

  const now = new Date();
  const links = rawRootLinks
    .filter((link) => {
      if (link.scheduled_at && new Date(link.scheduled_at) > now) return false;
      if (link.expires_at && new Date(link.expires_at) < now) return false;
      return true;
    })
    .map((link) => ({
      id: link.id,
      title: link.title || '',
      url: link.url || '',
      is_active: !!link.is_active,
      short_id: link.short_id,
      is_folder: !!link.is_folder,
      is_header: !!link.is_header,
      parent_id: link.parent_id,
      animation_type: link.animation_type,
      child_count: link.children?.[0]?.count ?? 0,
    }));

  const totalLinks = links.length + (rawRootLinks.length >= 50 ? 1 : 0);

  return { links, totalLinks };
}

// Async RSC that resolves profile + links independently so profile shell
// can be flushed to the browser before links are ready.
async function StreamedProfileView({ username }: { username: string }) {
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  // Fire-and-forget — don't block streaming
  void trackProfileView(profile.id);

  const { links, totalLinks } = await ProfileLinksStream({
    userId: profile.id,
    username,
  });

  const parsedProfile = {
    ...profile,
    social_links: socialLinksSchema.parse(profile.social_links),
    custom_theme: customThemeDataSchema.nullable().catch(null).parse(profile.custom_theme),
  };

  return (
    <ProfileView
      profile={parsedProfile}
      links={links}
      totalLinks={totalLinks}
    />
  );
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;

  return (
    <div className='flex flex-col min-h-screen'>
      <Suspense>
        <StreamedProfileView username={username} />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  const title = profile?.display_name
    ? `${profile.display_name} (@${username})`
    : `@${username}`;
  const description =
    profile?.bio || `Check out ${username}'s bio page and links on Kytbox.`;
  const avatarUrl = profile?.avatar_url || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/${username}`,
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
