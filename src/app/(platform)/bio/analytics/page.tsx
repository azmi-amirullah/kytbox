import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import AnalyticsClient from './components/AnalyticsClient';

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

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
        <AnalyticsClient />
      </main>

      <Footer />
    </div>
  );
}
