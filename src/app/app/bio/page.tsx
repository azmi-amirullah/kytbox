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

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Get user links
  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  const publicUrl = `/${profile.username}`;

  const userData = {
    username: profile.username,
    email: user.email,
    avatar_url: profile.avatar_url,
    display_name: profile.display_name,
  };

  // Get total profile views
  const { count: totalViews } = await supabase
    .from('profile_events')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id);

  return (
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs variant='subtle' />

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
