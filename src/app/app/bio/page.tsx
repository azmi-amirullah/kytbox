import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './components/DashboardClient';
import { Header } from '@/components/header';
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

  return (
    <div className='min-h-screen relative overflow-hidden bg-background'>
      <BackgroundBlobs variant='subtle' />

      <Header variant='dashboard' user={userData} publicUrl={publicUrl} />

      {/* Main Content */}
      <main className='relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-8'>
        <DashboardClient
          key={links?.map((l) => l.id).join(',') ?? 'empty'}
          initialLinks={links ?? []}
          profile={profile}
          publicUrl={publicUrl}
        />
      </main>

      {/* Footer */}
      <footer className='py-6 border-t border-border/40 text-center text-xs text-muted-foreground relative z-10 bg-background/50 backdrop-blur-sm'>
        <p>
          © {new Date().getFullYear()} UKIT. Built by{' '}
          <a
            href='https://azmi-dev.vercel.app'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-primary transition-colors underline underline-offset-2'
          >
            Azmi
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
