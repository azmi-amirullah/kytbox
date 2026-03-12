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

  // Parallelize all data fetching for maximum performance
  const [profileResult, allLinksMetadataResult, initialRootLinksResult, viewsCountResult] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, username, display_name, avatar_url, bio, role, created_at, theme_name, button_style, button_shape, social_links, custom_theme, default_currency, tier',
      )
      .eq('id', user.id)
      .single(),
    supabase
      .from('links')
      .select('id, is_active, parent_id, is_folder')
      .eq('user_id', user.id),
    supabase
      .from('links')
      .select('*, children:links(count)')
      .eq('user_id', user.id)
      .is('parent_id', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .range(0, 49),
    supabase
      .from('profile_events')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id),
  ]);

  const profile = profileResult.data;
  const allLinks = allLinksMetadataResult.data || [];
  const rawRootLinks = initialRootLinksResult.data || [];
  const totalViews = viewsCountResult.count || 0;

  if (!profile) {
    redirect('/onboarding');
  }

  // Calculate counts based on reachability (hierarchy-aware)
  const globalTotalCount = allLinks.length;
  const inactiveFolderIds = new Set(
    allLinks.filter((l) => l.is_folder && !l.is_active).map((l) => l.id),
  );

  const reachableLinks = allLinks.filter((l) => {
    if (!l.is_active) return false;
    // Child is hidden if its folder is inactive
    if (l.parent_id && inactiveFolderIds.has(l.parent_id)) return false;
    return true;
  });

  const globalActiveCount = reachableLinks.length;
  const rootLinksData = allLinks.filter((l) => l.parent_id === null);
  const rootTotalCount = rootLinksData.length;
  const activeRootTotalCount = rootLinksData.filter((l) => l.is_active).length;

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
        totalLinks={globalTotalCount}
        activeLinksCount={globalActiveCount}
        rootTotalCount={rootTotalCount}
        activeRootTotalCount={activeRootTotalCount}
        totalViews={totalViews || 0}
        activeTab={activeTab}
      />
    </div>
  );
}
