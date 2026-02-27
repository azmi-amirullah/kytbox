import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient, { type BioTab } from './components/DashboardClient';
import { mapProfileToDTO, mapLinkToDTO } from '@/lib/mappers';
import type { CustomThemeData } from '@/lib/theme';

export default async function BioDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = (params.tab as BioTab) || 'links';
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Parallelize all queries for better performance
  const [profileResult, linksResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('links')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true }),
  ]);

  const profile = profileResult.data;
  const links = linksResult.data;

  if (!profile) {
    redirect('/onboarding');
  }

  // Fetch views count (depends on profile.id)
  const { count: totalViews } = await supabase
    .from('profile_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id);

  const publicUrl = `/${profile.username}`;

  return (
    <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-8 w-full'>
      <DashboardClient
        initialLinks={(links ?? []).map(mapLinkToDTO)}
        profile={{
          ...mapProfileToDTO(profile),
          theme_name: profile.theme_name,
          button_style: profile.button_style,
          button_shape: profile.button_shape,
          display_name: profile.display_name,
          social_links: profile.social_links as Record<string, string>,
          custom_theme: profile.custom_theme as CustomThemeData | null,
        }}
        publicUrl={publicUrl}
        totalViews={totalViews || 0}
        activeTab={activeTab}
      />
    </div>
  );
}
