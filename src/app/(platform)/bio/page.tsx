import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBioDashboardData, DashboardClient, schemasServer } from '@/features/bio';

export default async function BioDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = schemasServer.bioTabSchema.parse(params.tab);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let data;
  try {
    data = await getBioDashboardData(supabase, user.id);
  } catch (error) {
    if (error instanceof Error && error.message === 'PROFILE_NOT_FOUND') {
      redirect('/onboarding');
    }
    throw error;
  }

  return (
    <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-8 w-full'>
      <DashboardClient
        initialLinks={data.initialLinks}
        profile={data.profile}
        publicUrl={data.publicUrl}
        totalLinks={data.totalLinks}
        activeLinksCount={data.activeLinksCount}
        rootTotalCount={data.rootTotalCount}
        activeRootTotalCount={data.activeRootTotalCount}
        totalViews={data.totalViews}
        activeTab={activeTab}
      />
    </div>
  );
}
