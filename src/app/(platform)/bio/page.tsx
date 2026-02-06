import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './components/DashboardClient';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';

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

  const userData = {
    username: profile.username,
    email: user.email,
    avatar_url: profile.avatar_url,
    display_name: profile.display_name,
  };

  return (
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs />

      <Header variant='dashboard' user={userData} publicUrl={publicUrl} />

      {/* Main Content */}
      <main className='relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-8 flex-1 w-full'>
        <DashboardClient
          initialLinks={links ?? []}
          profile={profile}
          publicUrl={publicUrl}
          totalViews={totalViews || 0}
        />
      </main>

      <Footer />
    </div>
  );
}
