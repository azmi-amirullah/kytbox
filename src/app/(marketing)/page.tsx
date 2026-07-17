import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  LuArrowRight,
  LuShieldCheck,
  LuZap,
  LuGlobe,
  LuFingerprint,
  LuSmartphone,
  LuFileDown,
} from 'react-icons/lu';
import { SiGithub, SiLinkedin } from 'react-icons/si';

import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { KYTBOX_APPS } from '@/config/apps';
import { connection } from 'next/server';
import pkg from '../../../package.json';

export const metadata: Metadata = {
  title: `${siteConfig.name} - Your Personal Kit Box`,
  description: siteConfig.description,
};

export default async function LandingPage() {
  await connection();
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
      .select('username, avatar_url, display_name, role')
      .eq('id', user.id)
      .single();

    if (profile) {
      userData = {
        username: profile.username,
        email: user?.email,
        avatar_url: profile.avatar_url,
        display_name: profile.display_name,
        role: profile.role,
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
              Kytbox v{pkg.version.split('.').slice(0, 2).join('.')} Live
            </div>

            <h1 className='text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground'>
              Your Personal{' '}
              <span className='text-primary decoration-wavy decoration-4 decoration-primary/30 underline-offset-4'>
                Kit Box
              </span>
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
        <section className='py-20 md:py-24 px-4 md:px-6 text-center relative'>
          <div className='max-w-2xl mx-auto p-px md:p-0.5 rounded-4xl bg-linear-to-b from-primary/30 via-primary/5 to-transparent shadow-2xl'>
            <div className='bg-card/70 backdrop-blur-2xl rounded-[1.95rem] p-8 sm:p-10 md:p-12 border border-white/10 relative overflow-hidden'>
              {/* Subtle background glow */}
              <div className='absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl' />

              <div className='w-16 h-16 bg-primary/20 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-inner relative z-10 rotate-3'>
                👨‍💻
              </div>

              <h2 className='text-3xl sm:text-4xl font-bold mb-4 tracking-tight relative z-10'>
                Built by <span className='text-primary'>Azmi</span>
              </h2>

              <p className='text-muted-foreground mb-10 text-base md:text-lg max-w-md mx-auto leading-relaxed relative z-10'>
                I build high-quality, scalable web applications that solve
                real-world problems.
              </p>
              <div className='flex flex-wrap justify-center gap-3 relative z-10'>
                <Button variant='outline' size='sm' asChild>
                  <a
                    href={siteConfig.links.creatorGithub}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <SiGithub className='w-4 h-4 mr-2' />
                    {siteConfig.labels.github}
                  </a>
                </Button>
                <Button variant='outline' size='sm' asChild>
                  <a
                    href={siteConfig.links.creatorLinkedin}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <SiLinkedin className='w-4 h-4 mr-2' />
                    {siteConfig.labels.linkedin}
                  </a>
                </Button>
                <Button variant='outline' size='sm' asChild>
                  <a
                    href={siteConfig.links.creatorPortfolio}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <LuGlobe className='w-4 h-4 mr-2' />
                    {siteConfig.labels.portfolio}
                  </a>
                </Button>
                <Button variant='outline' size='sm' asChild>
                  <a
                    href={siteConfig.links.cv}
                    download='Mohd_Azmi_Amirullah_CV.pdf'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <LuFileDown className='w-4 h-4 mr-2' />
                    {siteConfig.labels.downloadCv}
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
