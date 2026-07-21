import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  LuArrowRight,
  LuShieldCheck,
  LuZap,
  LuFileDown,
  LuGlobe,
  LuPalette,
  LuFolderTree,
  LuChartBar,
  LuPiggyBank,
  LuUsers,
  LuGripVertical,
  LuHeart,
  LuLightbulb,
  LuSparkles,
  LuCommand,
} from 'react-icons/lu';
import { SiGithub, SiLinkedin } from 'react-icons/si';

import { getOptionalUserAndProfile } from '@/lib/auth';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import pkg from '../../../package.json';

import { HeroTextCycler } from './components/HeroTextCycler';
import { ScrollReveal } from './components/ScrollReveal';
import {
  BioMockup,
  CashflowMockup,
  ListMockup,
} from './components/FeatureMockups';

export const metadata: Metadata = {
  title: `${siteConfig.name} - Your Personal Kit Box`,
  description: siteConfig.description,
};

export default async function LandingPage() {
  const { user, profile } = await getOptionalUserAndProfile();

  const userData =
    user && profile
      ? {
          id: user.id,
          username: profile.username,
          email: user.email,
          avatar_url: profile.avatar_url,
          display_name: profile.display_name,
          role: profile.role,
        }
      : null;

  const ctaHref = userData ? '/app' : '/signup';

  return (
    <div className='relative min-h-screen flex flex-col overflow-x-hidden'>
      <Header variant='landing' user={userData} />

      <main className='flex-1 relative z-10'>
        {/* ────────────────────── Hero ────────────────────── */}
        <section className='relative min-h-screen flex items-center justify-center px-6 pt-20 pb-16 overflow-hidden'>
          {/* Gradient background */}
          <div className='absolute inset-0 -z-20 bg-linear-to-b from-primary/20 via-primary/5 to-transparent dark:from-primary/10 dark:via-primary/3 dark:to-transparent' />

          {/* Grid pattern */}
          <div className='absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[24px_24px] opacity-30' />

          {/* Floating decorative blobs */}
          <div className='absolute -top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]' />
          <div className='absolute top-1/3 -right-16 w-56 h-56 bg-primary/10 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_2s]' />
          <div className='absolute bottom-12 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite_4s]' />

          {/* Bottom smooth fade overlay */}
          <div className='absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent pointer-events-none -z-5' />

          <div className='max-w-4xl mx-auto text-center space-y-8 relative z-10'>
            <div className='inline-flex items-center rounded-full border border-primary/30 bg-background/60 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-md shadow-sm'>
              <span className='mr-2 flex h-2 w-2 rounded-full bg-primary animate-pulse' />
              Kytbox v{pkg.version.split('.').slice(0, 2).join('.')} Live
            </div>

            <h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-tight'>
              Your links. Your money.
              <br className='hidden sm:block' />
              Your lists.{' '}
              <span className='text-primary'>One platform.</span>
            </h1>

            <p className='text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
              <HeroTextCycler />
            </p>
            <p className='text-base md:text-lg text-muted-foreground/70'>
              All in one beautifully simple platform.
            </p>

            <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-4'>
              <Link href={ctaHref}>
                <Button
                  size='lg'
                  className='h-12 px-8 text-lg group shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105'
                >
                  Get Started Free
                  <LuArrowRight className='ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform' />
                </Button>
              </Link>
              <span className='text-sm text-muted-foreground'>
                No credit card required
              </span>
            </div>
          </div>
        </section>

        {/* ────────────────── Feature Showcase ────────────────── */}

        {/* Bio */}
        <section className='py-20 md:py-28 px-6'>
          <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center'>
            <ScrollReveal direction='left'>
              <BioMockup />
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <div className='space-y-6'>
                <div className='inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-widest'>
                  <span className='w-8 h-px bg-primary' />
                  Bio
                </div>
                <h2 className='text-3xl sm:text-4xl font-bold tracking-tight'>
                  Your link-in-bio,{' '}
                  <span className='text-primary'>supercharged</span>
                </h2>
                <ul className='space-y-4 text-muted-foreground'>
                  {[
                    { icon: LuFolderTree, text: 'Nested folders for organized link groups' },
                    { icon: LuPalette, text: '13+ themes with custom color engine' },
                    { icon: LuChartBar, text: 'Click analytics with country breakdown' },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className='flex items-start gap-3'>
                      <div className='mt-0.5 p-1.5 rounded-lg bg-primary/10'>
                        <Icon className='w-4 h-4 text-primary' />
                      </div>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Cashflow */}
        <section className='py-20 md:py-28 px-6 bg-secondary/5 border-y border-border/30'>
          <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center'>
            <ScrollReveal delay={0.15} className='order-2 md:order-1'>
              <div className='space-y-6'>
                <div className='inline-flex items-center gap-2 text-xs font-semibold text-emerald-500 uppercase tracking-widest'>
                  <span className='w-8 h-px bg-emerald-500' />
                  Cashflow
                </div>
                <h2 className='text-3xl sm:text-4xl font-bold tracking-tight'>
                  Personal finance,{' '}
                  <span className='text-emerald-500'>simplified</span>
                </h2>
                <ul className='space-y-4 text-muted-foreground'>
                  {[
                    { icon: LuChartBar, text: 'Smart projections & budget tracking' },
                    { icon: LuPiggyBank, text: 'Recurring entry auto-generation' },
                    { icon: LuUsers, text: 'Granular ACL sharing with collaborators' },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className='flex items-start gap-3'>
                      <div className='mt-0.5 p-1.5 rounded-lg bg-emerald-500/10'>
                        <Icon className='w-4 h-4 text-emerald-500' />
                      </div>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal direction='right' className='order-1 md:order-2'>
              <CashflowMockup />
            </ScrollReveal>
          </div>
        </section>

        {/* List */}
        <section className='py-20 md:py-28 px-6'>
          <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center'>
            <ScrollReveal direction='left'>
              <ListMockup />
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <div className='space-y-6'>
                <div className='inline-flex items-center gap-2 text-xs font-semibold text-blue-500 uppercase tracking-widest'>
                  <span className='w-8 h-px bg-blue-500' />
                  List
                </div>
                <h2 className='text-3xl sm:text-4xl font-bold tracking-tight'>
                  Organize everything,{' '}
                  <span className='text-blue-500'>effortlessly</span>
                </h2>
                <ul className='space-y-4 text-muted-foreground'>
                  {[
                    { icon: LuGripVertical, text: 'Drag & drop Kanban boards' },
                    { icon: LuHeart, text: 'Wishlists with price tracking' },
                    { icon: LuLightbulb, text: 'Quick brain dumps for ideas' },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className='flex items-start gap-3'>
                      <div className='mt-0.5 p-1.5 rounded-lg bg-blue-500/10'>
                        <Icon className='w-4 h-4 text-blue-500' />
                      </div>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ────────────────── Stats / Social Proof ────────────────── */}
        <section className='py-20 md:py-24 px-6 bg-secondary/5 border-y border-border/30'>
          <ScrollReveal>
            <div className='max-w-4xl mx-auto text-center mb-12'>
              <h2 className='text-3xl sm:text-4xl font-bold tracking-tight mb-4'>
                Built for creators, freelancers, and teams
              </h2>
              <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
                Everything you need to manage your online presence, finances, and productivity.
              </p>
            </div>
          </ScrollReveal>

          <div className='max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4'>
            {[
              { value: '13+', label: 'Themes', desc: 'Custom color engine' },
              { value: '3', label: 'Apps', desc: 'Bio · Cashflow · List' },
              { value: '100%', label: 'Free', desc: 'No hidden fees' },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.1}>
                <div className='p-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl text-center hover:border-primary/30 transition-colors'>
                  <div className='text-4xl font-extrabold text-primary mb-1'>
                    {stat.value}
                  </div>
                  <div className='text-sm font-semibold text-foreground mb-0.5'>
                    {stat.label}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {stat.desc}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ────────────────── Platform Features Grid ────────────────── */}
        <section className='py-20 px-6'>
          <div className='max-w-5xl mx-auto'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {[
                {
                  icon: LuSparkles,
                  bgClass: 'bg-blue-500/10 group-hover:bg-blue-500/20',
                  textClass: 'text-blue-500',
                  title: 'Unified Workspace',
                  desc: 'Bio links, cashflow tracking, and todo lists — all under one single account.',
                },
                {
                  icon: LuZap,
                  bgClass: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
                  textClass: 'text-emerald-500',
                  title: '100% Free',
                  desc: 'No credit card required, no paywalls, no hidden catches. Full access to every app.',
                },
                {
                  icon: LuShieldCheck,
                  bgClass: 'bg-purple-500/10 group-hover:bg-purple-500/20',
                  textClass: 'text-purple-500',
                  title: 'Your Data, Your Rules',
                  desc: 'No tracking pixels, no ads, no selling your data. What you create stays yours.',
                },
                {
                  icon: LuCommand,
                  bgClass: 'bg-orange-500/10 group-hover:bg-orange-500/20',
                  textClass: 'text-orange-500',
                  title: 'Built for Velocity',
                  desc: 'Fast page loads, smart search, and instant state sync across your workspace.',
                },
              ].map(({ icon: Icon, bgClass, textClass, title, desc }, i) => (
                <ScrollReveal key={title} delay={i * 0.08}>
                  <div className='p-8 rounded-2xl bg-card border hover:shadow-lg transition-all hover:-translate-y-1 group h-full'>
                    <div
                      className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center mb-6 transition-colors`}
                    >
                      <Icon className={`w-6 h-6 ${textClass}`} />
                    </div>
                    <h3 className='text-xl font-bold mb-2'>{title}</h3>
                    <p className='text-muted-foreground leading-relaxed'>
                      {desc}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ────────────────── Creator Section ────────────────── */}
        <section className='py-20 md:py-24 px-4 md:px-6 text-center relative'>
          <ScrollReveal>
            <div className='max-w-2xl mx-auto p-px md:p-0.5 rounded-4xl bg-linear-to-b from-primary/30 via-primary/5 to-transparent shadow-2xl'>
              <div className='bg-card/70 backdrop-blur-2xl rounded-[1.95rem] p-8 sm:p-10 md:p-12 border border-white/10 relative overflow-hidden'>
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
          </ScrollReveal>
        </section>

        {/* ────────────────── Bottom CTA ────────────────── */}
        <section className='py-20 md:py-24 px-6 text-center'>
          <ScrollReveal>
            <h2 className='text-3xl sm:text-4xl font-bold tracking-tight mb-4'>
              Ready to get started?
            </h2>
            <p className='text-muted-foreground text-lg mb-8 max-w-md mx-auto'>
              Create your page in seconds. No credit card required.
            </p>
            <Link href={ctaHref}>
              <Button
                size='lg'
                className='h-12 px-10 text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105'
              >
                Create Your Page
                <LuArrowRight className='ml-2 w-5 h-5' />
              </Button>
            </Link>
          </ScrollReveal>
        </section>
      </main>

      <Footer variant='landing' />
    </div>
  );
}
