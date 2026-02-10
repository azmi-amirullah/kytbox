import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  LuArrowRight,
  LuLink2,
  LuListTodo,
  LuCar,
  LuShieldCheck,
  LuZap,
  LuGlobe,
  LuWallet,
  LuFingerprint,
  LuSmartphone,
} from 'react-icons/lu';
import { SiGithub, SiLinkedin } from 'react-icons/si';

import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';

// Kytbox Apps for landing page
const KYTBOX_APPS = [
  {
    id: 'bio',
    name: 'Bio',
    description: 'Share all your links in one beautiful page',
    icon: LuLink2,
    status: 'active' as const,
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'cashflow',
    name: 'Cashflow',
    description: 'Simple & effective personal finance tracking',
    icon: LuWallet,
    status: 'active' as const,
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    id: 'list',
    name: 'List',
    description: 'Todo lists, wishlists & ideas',
    icon: LuListTodo,
    status: 'coming_soon' as const,
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    id: 'track',
    name: 'Track',
    description: 'Vehicle & service tracking',
    icon: LuCar,
    status: 'coming_soon' as const,
    color: 'bg-orange-500/10 text-orange-600',
  },
];

export default async function LandingPage() {
  const supabase = await createClient();

  // Get user first (required for profile lookup)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile only if user exists (parallel not possible here due to dependency)
  let userData = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url, display_name')
      .eq('id', user.id)
      .single();

    if (profile) {
      userData = {
        username: profile.username,
        email: user?.email,
        avatar_url: profile.avatar_url,
        display_name: profile.display_name,
      };
    }
  }

  return (
    <div className='relative min-h-screen flex flex-col'>
      <BackgroundBlobs />

      <Header variant='landing' user={userData} />

      {/* Hero Section */}
      <main className='flex-1 relative z-10'>
        <section className='pt-24 pb-20 px-6 text-center'>
          <div className='max-w-4xl mx-auto space-y-8'>
            <div className='inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-sm text-green-500 backdrop-blur-sm'>
              <span className='mr-2 flex h-2 w-2 rounded-full bg-green-500'></span>
              Kytbox v1.0 Live
            </div>

            <h1 className='text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground'>
              Your Personal{' '}
              <span className='text-primary decoration-wavy decoration-4 decoration-primary/30 underline-offset-4'>
                Kit Box
              </span>
              .
            </h1>

            <p className='text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
              One account. Multiple tools. Bio, cashflow, lists, tracking & more
              — all in one place.
            </p>

            <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-8'>
              <Link href={userData ? '/app' : '/signup'}>
                <Button size='lg' className='h-12 px-8 text-lg group'>
                  Get Started Free
                  <LuArrowRight className='ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform' />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Apps Grid */}
        <section className='py-16 px-6'>
          <div className='max-w-5xl mx-auto'>
            <h2 className='text-2xl md:text-3xl font-bold text-center mb-12'>
              Everything you need, unified
            </h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              {KYTBOX_APPS.map((app) => {
                const Icon = app.icon;
                const isActive = app.status === 'active';

                return (
                  <div
                    key={app.id}
                    className={`
                      p-6 rounded-2xl border bg-card transition-all duration-200
                      ${isActive ? 'hover:border-primary/40 hover:shadow-lg' : 'opacity-60'}
                    `}
                  >
                    <div className={`p-3 rounded-xl w-fit ${app.color} mb-4`}>
                      <Icon className='w-6 h-6' />
                    </div>
                    <div className='flex items-center gap-2 mb-2'>
                      <h3 className='font-semibold text-lg'>{app.name}</h3>
                      {!isActive && (
                        <span className='text-[10px] uppercase tracking-wider font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded'>
                          Soon
                        </span>
                      )}
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {app.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className='py-20 bg-secondary/5 border-y border-border/50'>
          <div className='max-w-5xl mx-auto px-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='p-8 rounded-2xl bg-card border hover:shadow-lg transition-all hover:-translate-y-1 group'>
                <div className='w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors'>
                  <LuZap className='w-6 h-6 text-blue-500' />
                </div>
                <h3 className='text-xl font-bold mb-2'>Modern Stack</h3>
                <p className='text-muted-foreground leading-relaxed'>
                  Built on Next.js 16 and Supabase for instant page loads,
                  real-time updates, and ultimate developer experience.
                </p>
              </div>

              <div className='p-8 rounded-2xl bg-card border hover:shadow-lg transition-all hover:-translate-y-1 group'>
                <div className='w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors'>
                  <LuShieldCheck className='w-6 h-6 text-purple-500' />
                </div>
                <h3 className='text-xl font-bold mb-2'>Privacy First</h3>
                <p className='text-muted-foreground leading-relaxed'>
                  No tracking pixels, no data harvesting, no hidden algorithms.
                  Your data remains yours, encrypted and secure.
                </p>
              </div>

              <div className='p-8 rounded-2xl bg-card border hover:shadow-lg transition-all hover:-translate-y-1 group'>
                <div className='w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition-colors'>
                  <LuFingerprint className='w-6 h-6 text-orange-500' />
                </div>
                <h3 className='text-xl font-bold mb-2'>Unified Hub</h3>
                <p className='text-muted-foreground leading-relaxed'>
                  One account, multiple tools. Seamlessly switch between Bio,
                  Cashflow, and future apps without losing context.
                </p>
              </div>

              <div className='p-8 rounded-2xl bg-card border hover:shadow-lg transition-all hover:-translate-y-1 group'>
                <div className='w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors'>
                  <LuSmartphone className='w-6 h-6 text-emerald-500' />
                </div>
                <h3 className='text-xl font-bold mb-2'>Mobile-First DNA</h3>
                <p className='text-muted-foreground leading-relaxed'>
                  Every component is crafted for touch and small screens using
                  atomic design for a native-app feel on the web.
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
                I build high-quality, scalable web applications that solve
                real-world problems.
              </p>
              <div className='flex justify-center gap-3'>
                <Button variant='outline' size='sm' asChild>
                  <a
                    href='https://github.com/azmi-amirullah'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <SiGithub className='w-4 h-4 mr-2' />
                    GitHub
                  </a>
                </Button>
                <Button variant='outline' size='sm' asChild>
                  <a
                    href='https://www.linkedin.com/in/azmi-amirullah'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <SiLinkedin className='w-4 h-4 mr-2' />
                    LinkedIn
                  </a>
                </Button>
                <Button variant='outline' size='sm' asChild>
                  <a
                    href='https://azmi-dev.vercel.app'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <LuGlobe className='w-4 h-4 mr-2' />
                    Portfolio
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer variant='landing' />
    </div>
  );
}
