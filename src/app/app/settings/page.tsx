import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsForm from './SettingsForm';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LuChevronRight, LuArrowLeft } from 'react-icons/lu';

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
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs variant='subtle' />

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
            <Button variant='ghost' size='icon' asChild className='-ml-2'>
              <Link href='/app'>
                <LuArrowLeft className='w-5 h-5' />
              </Link>
            </Button>
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
