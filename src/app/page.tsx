import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

import { ExternalLink, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNav } from '@/components/user-nav';
import DashboardClient from './dashboard/components/DashboardClient';

export default async function HomePage() {
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

  const publicUrl = `/u/${profile.username}`;

  return (
    <div className='min-h-screen relative overflow-hidden bg-background'>
      {/* Dynamic Background */}
      <div className='absolute inset-0 z-0 pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px] animate-blob' />
        <div className='absolute top-[20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px] animate-blob animation-delay-2000' />
        <div className='absolute bottom-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-secondary/20 blur-[100px] animate-blob animation-delay-4000' />
        {/* Grid Pattern */}
        <div className='absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20' />
      </div>

      {/* Header */}
      <header className='border-b bg-background/60 backdrop-blur-md sticky top-0 z-50 transition-all duration-200'>
        <div className='max-w-7xl mx-auto px-4 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary/10 p-2 rounded-xl'>
              <Sparkles className='w-5 h-5 text-primary' />
            </div>
            <span className='font-bold text-lg tracking-tight hidden sm:inline-block'>
              Link-Base
            </span>
          </div>

          <div className='flex items-center gap-3 md:gap-4'>
            <a
              href={publicUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-all group'
            >
              <span>{profile.username}</span>
              <ExternalLink className='w-3 h-3 group-hover:translate-x-0.5 transition-transform' />
            </a>
            <div className='h-6 w-px bg-border hidden md:block' />
            <ThemeToggle />
            <UserNav
              user={{
                username: profile.username,
                email: user.email,
                avatar_url: profile.avatar_url,
                display_name: profile.display_name,
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-8'>
        <DashboardClient
          initialLinks={links ?? []}
          profile={profile}
          publicUrl={publicUrl}
        />
      </main>
    </div>
  );
}
