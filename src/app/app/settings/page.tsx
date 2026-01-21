import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsForm from './SettingsForm';
import { Header } from '@/components/header';
import { BackgroundBlobs } from '@/components/background-blobs';

export default async function SettingsPage() {
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
    redirect('/login');
  }

  const publicUrl = `/${profile.username}`;

  const userData = {
    username: profile.username,
    email: user.email,
    avatar_url: profile.avatar_url,
    display_name: profile.display_name,
  };

  return (
    <div className='min-h-screen relative overflow-hidden bg-background'>
      <BackgroundBlobs variant='subtle' />

      <Header variant='dashboard' user={userData} publicUrl={publicUrl} />

      <main className='relative z-10 max-w-2xl mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold tracking-tight'>
            Account Settings
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage your profile and preferences
          </p>
        </div>
        <SettingsForm profile={profile} email={user.email || ''} />
      </main>
    </div>
  );
}
