import { notFound } from 'next/navigation';
import { createStaticClient } from '@/lib/supabase/server';
import { trackProfileView } from '@/lib/tracking';
import ProfileView from './components/ProfileView';
import { getProfileByUsername } from '@/lib/data-cache';
import type { CustomThemeData } from '@/lib/theme';
import { socialLinksSchema } from '@/lib/validation.schemas';


interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

interface RawLinkResponse {
  id: string;
  title: string | null;
  url: string | null;
  is_active: boolean | null;
  is_folder: boolean | null;
  short_id: string | number | null;
  parent_id: string | null;
  animation_type: string | null;
  children?: { count: number }[];
}

function isCustomThemeData(data: unknown): data is CustomThemeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    'background' in data
  );
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const supabase = createStaticClient();

  // Get profile first (required for links query)
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  // Fire and forget tracking
  trackProfileView(profile.id);

  // Get links for this specific user (filtered at DB level)
  const [rootLinksResult] = await Promise.all([
    supabase
      .from('links')
      .select(
        'id, title, url, is_active, short_id, is_folder, parent_id, sort_order, animation_type, children:links(count)',
        { count: 'exact' }
      )
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .is('parent_id', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .range(0, 1),
  ]);

  const rawRootLinks = rootLinksResult.data || [];
  const totalLinks = rootLinksResult.count ?? 0;

  const typedLinks = rawRootLinks.map((link: RawLinkResponse) => ({
    id: link.id,
    title: link.title || '',
    url: link.url || '',
    is_active: !!link.is_active,
    short_id: link.short_id,
    is_folder: !!link.is_folder,
    parent_id: link.parent_id,
    animation_type: link.animation_type,
    child_count: link.children?.[0]?.count ?? 0,
  }));

  return (
    <div className='flex flex-col min-h-screen'>
      <ProfileView
        profile={{
          ...profile,
          social_links: socialLinksSchema.parse(profile.social_links),
          custom_theme: isCustomThemeData(profile.custom_theme)
            ? profile.custom_theme
            : null,
        }}
        links={typedLinks}
        totalLinks={totalLinks || 0}
      />
    </div>
  );
}

export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  return {
    title: profile?.display_name || `@${username}`,
    description: profile?.bio || `Check out ${username}'s links`,
  };
}
