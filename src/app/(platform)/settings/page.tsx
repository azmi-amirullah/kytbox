import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsForm from './SettingsForm';
import { BackButton } from './BackButton';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import Link from 'next/link';
import { LuChevronRight } from 'react-icons/lu';

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

      <main className='relative z-10 max-w-2xl mx-auto px-4 py-8 flex-1 w-full'>
        <div className='mb-6'>
          <nav className='flex items-center gap-1 text-sm text-muted-foreground mb-4'>
            <Link
              href='/app'
              className='hover:text-foreground transition-colors'
            >
              UKIT
            </Link>
            <LuChevronRight className='w-3 h-3' />
            <span className='text-foreground font-medium'>Settings</span>
          </nav>

          <div className='flex items-center gap-4 mb-2'>
            <BackButton />
            <h1 className='text-3xl font-bold tracking-tight'>
              Account Settings
            </h1>
          </div>

          <p className='text-muted-foreground'>
            Manage your profile and preferences
          </p>
        </div>
        <SettingsForm profile={profile} email={user.email || ''} />
      </main>

      <Footer />
    </div>
  );
}
