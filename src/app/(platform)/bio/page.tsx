import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './components/DashboardClient';

export default async function BioDashboardPage() {
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
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-8 w-full'>
      <DashboardClient
        initialLinks={links ?? []}
        profile={profile}
        publicUrl={publicUrl}
        totalViews={totalViews || 0}
      />
    </div>
  );
}
