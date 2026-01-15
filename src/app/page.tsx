import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  ExternalLink,
  BarChart3,
  Link as LinkIcon,
  MousePointerClick,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNav } from '@/components/user-nav';
import LinkList from './dashboard/components/LinkList';
import LinkModal from './dashboard/components/LinkModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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

  const totalClicks = links?.reduce((sum, link) => sum + link.clicks, 0) || 0;
  const activeLinks = links?.filter((l) => l.is_active).length || 0;
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
        <div className='max-w-6xl mx-auto px-4 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary/10 p-2 rounded-xl'>
              <Sparkles className='w-5 h-5 text-primary' />
            </div>
            <span className='font-bold text-lg tracking-tight hidden sm:inline-block'>
              Link-in-Bio
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
      <main className='relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12'>
        <div className='grid gap-8'>
          {/* Welcome Section */}
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
              <p className='text-muted-foreground mt-1'>
                Manage your links and track your performance.
              </p>
            </div>
            <div className='flex items-center gap-3'>
              {/* Mobile Public Link Button */}
              <a
                href={publicUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='md:hidden flex items-center justify-center p-2 rounded-full bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-all'
              >
                <ExternalLink className='w-4 h-4' />
              </a>
              <LinkModal
                mode='create'
                trigger={
                  <Button className='h-10 font-medium'>
                    <Plus className='w-4 h-4' />
                    Add Link
                  </Button>
                }
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className='grid gap-4 md:grid-cols-3'>
            <Card className='bg-card/50 backdrop-blur-sm border-primary/10 transition-all hover:shadow-md hover:border-primary/20'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Clicks
                </CardTitle>
                <MousePointerClick className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{totalClicks}</div>
                <p className='text-xs text-muted-foreground'>
                  Lifetime engagement
                </p>
              </CardContent>
            </Card>
            <Card className='bg-card/50 backdrop-blur-sm border-primary/10 transition-all hover:shadow-md hover:border-primary/20'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Active Links
                </CardTitle>
                <LinkIcon className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{activeLinks}</div>
                <p className='text-xs text-muted-foreground'>
                  Visible on your page
                </p>
              </CardContent>
            </Card>
            <Card className='bg-card/50 backdrop-blur-sm border-primary/10 transition-all hover:shadow-md hover:border-primary/20'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Links
                </CardTitle>
                <BarChart3 className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{links?.length || 0}</div>
                <p className='text-xs text-muted-foreground'>
                  Links in your library
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Links Section */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between px-1'>
              <h2 className='text-lg font-semibold tracking-tight'>
                Your Links
              </h2>
            </div>
            <Card className='border-border/50 bg-card/40 backdrop-blur-xl shadow-sm'>
              <CardContent className='p-0'>
                <div className='p-6'>
                  <LinkList links={links ?? []} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
