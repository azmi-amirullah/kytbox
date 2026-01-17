import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Layers, ShieldCheck, Zap } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { BackgroundBlobs } from '@/components/background-blobs';

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const userData = profile
    ? {
        username: profile.username,
        email: user?.email,
        avatar_url: profile.avatar_url,
        display_name: profile.display_name,
      }
    : null;

  return (
    <div className='bg-background relative'>
      <BackgroundBlobs />

      <Header variant='landing' user={userData} />

      {/* Hero Section */}
      <main className='flex-1 relative z-10'>
        <section className='pt-24 pb-32 px-6 text-center'>
          <div className='max-w-4xl mx-auto space-y-8'>
            <div className='inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-sm text-green-500 backdrop-blur-sm'>
              <span className='mr-2 flex h-2 w-2 rounded-full bg-green-500'></span>
              v1.0 Now Live
            </div>

            <h1 className='text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground'>
              Your Links,{' '}
              <span className='text-primary decoration-wavy decoration-4 decoration-primary/30 underline-offset-4'>
                Supercharged
              </span>
              .
            </h1>

            <p className='text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
              The ultimate link in bio tool for everyone. Built for speed,
              simplicity, and complete control.
            </p>

            <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-8'>
              <Link href={user ? '/dashboard' : '/signup'}>
                <Button size='lg' className='h-12 px-8 text-lg group'>
                  Create your page
                  <ArrowRight className='ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform' />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className='py-24 bg-secondary/5 border-y border-border/50'>
          <div className='max-w-7xl mx-auto px-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              <div className='p-6 rounded-2xl bg-card border hover:shadow-lg transition-all hover:-translate-y-1 group'>
                <div className='w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors'>
                  <Zap className='w-6 h-6 text-blue-500' />
                </div>
                <h3 className='text-xl font-bold mb-2'>Blazing Fast</h3>
                <p className='text-muted-foreground'>
                  Built on Next.js 16 and Supabase for instant page loads and
                  real-time updates.
                </p>
              </div>

              <div className='p-6 rounded-2xl bg-card border hover:shadow-lg transition-all hover:-translate-y-1 group'>
                <div className='w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors'>
                  <ShieldCheck className='w-6 h-6 text-purple-500' />
                </div>
                <h3 className='text-xl font-bold mb-2'>Data Privacy</h3>
                <p className='text-muted-foreground'>
                  Your data lives in your database. No tracking pixel, no hidden
                  algorithms.
                </p>
              </div>

              <div className='p-6 rounded-2xl bg-card border hover:shadow-lg transition-all hover:-translate-y-1 group'>
                <div className='w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors'>
                  <Layers className='w-6 h-6 text-green-500' />
                </div>
                <h3 className='text-xl font-bold mb-2'>Fully Customizable</h3>
                <p className='text-muted-foreground'>
                  Drag-and-drop links, custom themes, and detailed analytics
                  (coming soon).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Creator Section */}
        <section className='py-24 px-6 text-center'>
          <div className='max-w-2xl mx-auto p-1 rounded-3xl bg-linear-to-b from-primary/20 to-transparent'>
            <div className='bg-card rounded-[22px] p-8 md:p-12 border border-border/50 shadow-2xl'>
              <div className='w-16 h-16 bg-primary/20 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl'>
                👨‍💻
              </div>
              <h2 className='text-3xl font-bold mb-4'>Built by Azmi</h2>
              <p className='text-muted-foreground mb-8 text-lg'>
                I specialize in building high-quality, scalable web applications
                that solve real-world problems.
              </p>
              <div className='flex justify-center gap-4'>
                <Button variant='outline' asChild>
                  <a
                    href='https://github.com/azmi-amirullah'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    GitHub
                  </a>
                </Button>
                <Button variant='ghost' asChild>
                  <a
                    href='https://azmi-dev.vercel.app'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    Portfolio
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className='py-8 border-t border-border/40 text-center text-sm text-muted-foreground'>
        <div className='max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4'>
          <p>© {new Date().getFullYear()} Link-Base. All rights reserved.</p>
          {/* TODO: Uncomment when /privacy and /terms pages are implemented
          <div className='flex gap-6'>
            <Link href='/privacy' className='hover:text-foreground transition-colors'>
              Privacy
            </Link>
            <Link href='/terms' className='hover:text-foreground transition-colors'>
              Terms
            </Link>
          </div>
          */}
        </div>
      </footer>
    </div>
  );
}
