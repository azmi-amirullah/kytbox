import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient, { type BioTab } from './components/DashboardClient';
import { mapProfileToDTO, mapLinkToDTO } from '@/lib/mappers';
import type { CustomThemeData } from '@/lib/theme';
import { bioTabSchema, socialLinksSchema } from '@/lib/validation.schemas';

function isCustomThemeData(obj: unknown): obj is CustomThemeData {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

export default async function BioDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab: BioTab = bioTabSchema.parse(params.tab);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Parallelize all queries for better performance
  const [profileResult, rootLinksResult] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, username, display_name, avatar_url, bio, role, created_at, theme_name, button_style, button_shape, social_links, custom_theme, default_currency, tier',
      )
      .eq('id', user.id)
      .single(),
    supabase
      .from('links')
      .select('*, children:links(count)', { count: 'exact' })
      .eq('user_id', user.id)
      .is('parent_id', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .range(0, 1),
  ]);

  const profile = profileResult.data;
  const rawRootLinks = rootLinksResult.data || [];
  

  if (!profile) {
    redirect('/onboarding');
  }

  // Fetch views count (depends on profile.id)
  const { count: totalViews } = await supabase
    .from('profile_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id);

  const publicUrl = `/${profile.username}`;

  // Dashboard content
  const mappedLinks = rawRootLinks.map(mapLinkToDTO);

  return (
    <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-8 w-full'>
      <DashboardClient
        initialLinks={mappedLinks}
        profile={{
          ...mapProfileToDTO(profile),
          theme_name: profile.theme_name,
          button_style: profile.button_style,
          button_shape: profile.button_shape,
          display_name: profile.display_name,
          social_links: socialLinksSchema.parse(profile.social_links),
          custom_theme: isCustomThemeData(profile.custom_theme)
            ? profile.custom_theme
            : null,
        }}
        publicUrl={publicUrl}
        totalLinks={rootLinksResult.count || 0}
        totalViews={totalViews || 0}
        activeTab={activeTab}
      />
    </div>
  );
}
