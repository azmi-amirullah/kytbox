import Link from 'next/link'
import type { Metadata } from 'next'
import {
  LuArrowRight,
  LuArrowUpRight,
  LuCheck,
  LuCommand,
  LuFolderTree,
  LuLightbulb,
  LuPiggyBank,
  LuShieldCheck,
  LuZap,
} from 'react-icons/lu'

import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { getOptionalUserAndProfile } from '@/lib/auth'
import { siteConfig } from '@/config/site'
import pkg from '../../../package.json'

import { ScrollReveal } from './components/ScrollReveal'
import { WorkspacePreview } from './components/WorkspacePreview'

const modules = [
  {
    title: 'Bio',
    kicker: 'PUBLIC LINKS',
    description:
      'Share your links from a page that feels like you, with themes and analytics built in.',
    icon: LuFolderTree,
  },
  {
    title: 'Cashflow',
    kicker: 'MONEY IN VIEW',
    description:
      'Track income and expenses with a clearer view of your balance.',
    icon: LuPiggyBank,
  },
  {
    title: 'List',
    kicker: 'TASKS & IDEAS',
    description: 'Organize tasks, wishlists, and ideas in one place.',
    icon: LuLightbulb,
  },
]

const cashflowPreviewEntries = [
  {
    label: 'Client payment',
    value: '+$2,400',
    tone: 'text-primary',
  },
  {
    label: 'Workspace tools',
    value: '-$180',
    tone: 'text-destructive',
  },
  {
    label: 'Rent & utilities',
    value: '-$1,200',
    tone: 'text-destructive',
  },
]

const workflow = [
  {
    number: '01',
    title: 'Bring it together',
    description:
      'Keep your public links, cashflow, tasks, wishes, and ideas in one account.',
  },
  {
    number: '02',
    title: 'Use the right tool',
    description:
      'Bio, Cashflow, and List each stay focused on the work they are built for.',
  },
  {
    number: '03',
    title: 'Pick up where you left off',
    description:
      'Return to a workspace that is easy to scan and simple to use.',
  },
]

const principles = [
  {
    icon: LuShieldCheck,
    title: 'Private by default',
    description:
      'Your workspace is yours. Share deliberately, keep the rest out of the way.',
  },
  {
    icon: LuCommand,
    title: 'Fast where it counts',
    description:
      'Quick navigation, focused surfaces, and no decorative clutter between you and the work.',
  },
  {
    icon: LuZap,
    title: 'Free to start',
    description:
      'The core kit stays open so you can build a useful system before thinking about upgrades.',
  },
]

export const metadata: Metadata = {
  title: `${siteConfig.name} — Make room for better work`,
  description: siteConfig.description,
}

export default async function LandingPage() {
  const { user, profile } = await getOptionalUserAndProfile()

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
      : null

  const ctaHref = userData ? '/app' : '/signup'

  return (
    <div className='min-h-screen overflow-x-clip bg-background text-foreground'>
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary-foreground'
      >
        Skip to content
      </a>

      <Header variant='landing' user={userData} />

      <main id='main-content' className='relative z-10'>
        <section className='relative isolate overflow-x-clip px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:min-h-[calc(100svh-4rem)] lg:px-8 lg:pb-4 lg:pt-20'>
          <div className='marketing-grid pointer-events-none absolute inset-0 -z-20 opacity-55' />
          <div className='pointer-events-none absolute -right-24 top-32 -z-10 h-72 w-72 rounded-full bg-primary/12 blur-3xl sm:h-96 sm:w-96' />
          <div className='pointer-events-none absolute -bottom-24 left-1/4 -z-10 h-64 w-64 rounded-full bg-signal/10 blur-3xl' />

          <div className='mx-auto max-w-7xl'>
            <div className='grid items-center gap-14 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-12'>
              <ScrollReveal>
                <div className='max-w-2xl'>
                  <div className='mb-7 inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary shadow-sm backdrop-blur'>
                    <span
                      className='h-2 w-2 rounded-full bg-signal'
                      aria-hidden='true'
                    />
                    Kytbox v{pkg.version.split('.').slice(0, 2).join('.')} is
                    live
                  </div>

                  <h1 className='max-w-3xl text-[clamp(3.25rem,8vw,7rem)] font-semibold leading-[0.9] tracking-[-0.075em] text-foreground'>
                    Make room for{' '}
                    <span className='text-primary'>better work.</span>
                  </h1>

                  <p className='mt-8 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl'>
                    Kytbox brings Bio, Cashflow, and List into one calm
                    workspace — so you spend less time switching between tools.
                  </p>

                  <div className='mt-9 flex flex-col gap-3 sm:flex-row sm:items-center'>
                    <Button
                      asChild
                      size='lg'
                      className='min-h-12 rounded-full px-7 text-base shadow-lg shadow-primary/20'
                    >
                      <a href={ctaHref}>
                        Open your kit
                        <LuArrowRight className='size-5' aria-hidden='true' />
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant='outline'
                      size='lg'
                      className='min-h-12 rounded-full px-7 text-base'
                    >
                      <Link href='#platform'>See the system</Link>
                    </Button>
                  </div>

                  <div className='mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground'>
                    <span className='inline-flex items-center gap-2'>
                      <LuCheck
                        className='size-4 text-primary'
                        aria-hidden='true'
                      />
                      No credit card
                    </span>
                    <span className='inline-flex items-center gap-2'>
                      <LuCheck
                        className='size-4 text-primary'
                        aria-hidden='true'
                      />
                      Free core tools
                    </span>
                    <span className='inline-flex items-center gap-2'>
                      <LuCheck
                        className='size-4 text-primary'
                        aria-hidden='true'
                      />
                      Built for real life
                    </span>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal direction='right' delay={0.12}>
                <WorkspacePreview />
              </ScrollReveal>
            </div>

            <div className='mt-4 grid gap-5 border-t border-border/80 pt-4 text-sm text-muted-foreground sm:grid-cols-[1fr_auto] sm:items-center'>
              <p className='max-w-md'>
                For creators, freelancers, and people with too many tabs open.
              </p>
              <div className='flex items-center gap-4 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground/80'>
                <span>One account</span>
                <span
                  className='h-1 w-1 rounded-full bg-signal'
                  aria-hidden='true'
                />
                <span>Three tools</span>
                <span
                  className='h-1 w-1 rounded-full bg-signal'
                  aria-hidden='true'
                />
                <span>One workspace</span>
              </div>
            </div>
          </div>
        </section>

        <section
          id='platform'
          className='scroll-mt-16 border-y border-border bg-card/55 px-4 py-20 sm:px-6 sm:py-28 lg:px-8'
        >
          <div className='mx-auto max-w-7xl'>
            <ScrollReveal>
              <div className='grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end'>
                <p className='font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary'>
                  01 / The kit
                </p>
                <div>
                  <h2 className='max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl'>
                    Three tools.{' '}
                    <span className='text-muted-foreground'>
                      One workspace.
                    </span>
                  </h2>
                  <p className='mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg'>
                    Use Bio for your links, Cashflow for your money, and List
                    for tasks, wishlists, and ideas.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <div className='marketing-bento mt-12'>
              <div className='marketing-bento-grid'>
                <article className='marketing-bento-feature marketing-bento-feature--bio rounded-[1.75rem] border border-primary/15 bg-surface-blue p-6 sm:p-8'>
                  <div className='flex items-start justify-between gap-6'>
                    <div>
                      <div className='mb-5 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm'>
                        <LuFolderTree className='size-5' aria-hidden='true' />
                      </div>
                      <p className='font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary'>
                        Public links
                      </p>
                      <h3 className='mt-3 text-3xl font-semibold tracking-[-0.045em]'>
                        Bio, with room to grow.
                      </h3>
                      <p className='mt-3 max-w-lg leading-7 text-muted-foreground'>
                        {modules[0].description}
                      </p>
                    </div>
                    <span className='hidden font-mono text-xs text-primary/60 sm:block'>
                      01
                    </span>
                  </div>

                  <div className='mt-10 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end'>
                    <div className='rounded-2xl border border-border/80 bg-card p-4 shadow-sm'>
                      <div className='flex items-center gap-3 border-b border-border pb-3'>
                        <div
                          className='size-9 rounded-full bg-primary/15'
                          aria-hidden='true'
                        />
                        <div>
                          <div className='h-2.5 w-24 rounded-full bg-foreground/15' />
                          <div className='mt-1.5 h-2 w-16 rounded-full bg-foreground/8' />
                        </div>
                      </div>
                      <div className='mt-4 grid gap-2'>
                        {[
                          'Work with me',
                          'Latest project',
                          'Read my notes',
                        ].map((label) => (
                          <div
                            key={label}
                            className='flex min-h-10 items-center justify-between rounded-xl border border-border bg-background px-3 text-sm font-medium'
                          >
                            <span>{label}</span>
                            <LuArrowUpRight
                              className='size-4 text-primary'
                              aria-hidden='true'
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className='rounded-2xl border border-primary/15 bg-primary/8 p-4 sm:min-w-28'>
                      <p className='font-mono text-3xl font-semibold tracking-[-0.06em] text-primary'>
                        13+
                      </p>
                      <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                        themes to make it yours
                      </p>
                    </div>
                  </div>
                </article>

                <article className='marketing-bento-feature marketing-bento-feature--cashflow rounded-[1.75rem] border border-signal/20 bg-surface-warm p-6 sm:p-8'>
                  <div className='flex items-start justify-between gap-6'>
                    <div>
                      <div className='mb-5 flex size-11 items-center justify-center rounded-2xl bg-signal text-signal-foreground shadow-sm'>
                        <LuPiggyBank className='size-5' aria-hidden='true' />
                      </div>
                      <p className='font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-foreground/70'>
                        Money in view
                      </p>
                      <h3 className='mt-3 text-3xl font-semibold tracking-[-0.045em]'>
                        Cashflow you can read.
                      </h3>
                      <p className='mt-3 leading-7 text-muted-foreground'>
                        {modules[1].description}
                      </p>
                    </div>
                    <span className='hidden font-mono text-xs text-foreground/45 sm:block'>
                      02
                    </span>
                  </div>

                  <div className='mt-10 rounded-2xl border border-signal/15 bg-card/80 p-4 shadow-sm'>
                    <div className='flex items-end justify-between gap-4'>
                      <div>
                        <p className='text-xs text-muted-foreground'>
                          Net Balance
                        </p>
                        <p className='mt-1 text-3xl font-semibold tracking-[-0.06em]'>
                          $4,280
                        </p>
                      </div>
                    </div>
                    <div className='mt-4 rounded-xl border border-border bg-background/60 p-3'>
                      <div className='flex items-center justify-between gap-3'>
                        <p className='text-xs font-medium text-muted-foreground'>
                          Recent entries
                        </p>
                        <span className='font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground/70'>
                          Example
                        </span>
                      </div>
                      <div className='mt-3 grid gap-2'>
                        {cashflowPreviewEntries.map(
                          ({ label, value, tone }) => (
                            <div
                              key={label}
                              className='flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card px-2.5 py-2'
                            >
                              <span className='truncate text-xs font-medium'>
                                {label}
                              </span>
                              <span
                                className={`shrink-0 font-mono text-xs font-semibold ${tone}`}
                              >
                                {value}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </article>

                <article className='marketing-bento-feature marketing-bento-feature--list rounded-[1.75rem] border border-white/10 bg-surface-strong p-6 text-white sm:p-8'>
                  <div className='flex items-start justify-between gap-6'>
                    <div>
                      <div className='mb-5 flex size-11 items-center justify-center rounded-2xl bg-white/12 text-white shadow-sm'>
                        <LuLightbulb className='size-5' aria-hidden='true' />
                      </div>
                      <p className='font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/55'>
                        Tasks & ideas
                      </p>
                      <h3 className='mt-3 text-3xl font-semibold tracking-[-0.045em]'>
                        Lists that get unstuck.
                      </h3>
                      <p className='mt-3 max-w-2xl leading-7 text-white/65'>
                        {modules[2].description}
                      </p>
                    </div>
                    <span className='hidden font-mono text-xs text-white/35 sm:block'>
                      03
                    </span>
                  </div>

                  <div className='mt-10 grid gap-3 sm:grid-cols-3'>
                    {[
                      {
                        title: 'Todo',
                        items: ['Add a task', 'Plan a project'],
                      },
                      {
                        title: 'Wishlist',
                        items: ['Save an item', 'Add a want'],
                      },
                      {
                        title: 'Ideas',
                        items: ['Capture an idea', 'Start a list'],
                      },
                    ].map((column) => (
                      <div
                        key={column.title}
                        className='rounded-2xl border border-white/10 bg-white/6 p-3'
                      >
                        <div className='flex items-center justify-between text-xs font-semibold text-white/75'>
                          <span>{column.title}</span>
                          <span className='font-mono text-white/35'>
                            {column.items.length}
                          </span>
                        </div>
                        <div className='mt-3 grid gap-2'>
                          {column.items.map((item) => (
                            <div
                              key={item}
                              className='rounded-xl border border-white/8 bg-white/6 px-3 py-2.5 text-xs text-white/65'
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section
          id='workflow'
          className='scroll-mt-16 px-4 py-20 sm:px-6 sm:py-28 lg:px-8'
        >
          <div className='mx-auto max-w-7xl'>
            <div className='grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24'>
              <ScrollReveal>
                <div className='lg:sticky lg:top-28'>
                  <p className='font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary'>
                    02 / The workflow
                  </p>
                  <h2 className='mt-6 max-w-lg text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl'>
                    Less switching.{' '}
                    <span className='text-muted-foreground'>More signal.</span>
                  </h2>
                  <p className='mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg'>
                    Kytbox keeps the important context close without turning
                    your workspace into another dashboard to decode.
                  </p>
                </div>
              </ScrollReveal>

              <ol className='divide-y divide-border border-y border-border'>
                {workflow.map((step, index) => (
                  <ScrollReveal key={step.number} delay={index * 0.08}>
                    <li className='grid gap-4 py-8 sm:grid-cols-[5rem_1fr] sm:gap-8 sm:py-10'>
                      <span className='font-mono text-sm font-semibold text-primary'>
                        {step.number}
                      </span>
                      <div>
                        <h3 className='text-2xl font-semibold tracking-[-0.035em]'>
                          {step.title}
                        </h3>
                        <p className='mt-3 max-w-xl leading-7 text-muted-foreground'>
                          {step.description}
                        </p>
                      </div>
                    </li>
                  </ScrollReveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section
          id='principles'
          className='scroll-mt-16 border-y border-border bg-surface-blue/55 px-4 py-20 sm:px-6 sm:py-28 lg:px-8'
        >
          <div className='mx-auto max-w-7xl'>
            <ScrollReveal>
              <div className='flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between'>
                <div>
                  <p className='font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary'>
                    03 / The standard
                  </p>
                  <h2 className='mt-6 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl'>
                    Useful first.{' '}
                    <span className='text-muted-foreground'>Always.</span>
                  </h2>
                </div>
                <p className='max-w-sm leading-7 text-muted-foreground'>
                  A small set of tools, held to a higher standard than a giant
                  pile of features.
                </p>
              </div>
            </ScrollReveal>

            <div className='mt-12 grid gap-4 md:grid-cols-3'>
              {principles.map(({ icon: Icon, title, description }, index) => (
                <ScrollReveal key={title} delay={index * 0.08}>
                  <article className='h-full rounded-3xl border border-border bg-card p-6 shadow-sm transition-colors duration-200 hover:border-primary/35 sm:p-7'>
                    <div className='flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                      <Icon className='size-5' aria-hidden='true' />
                    </div>
                    <h3 className='mt-7 text-xl font-semibold tracking-[-0.03em]'>
                      {title}
                    </h3>
                    <p className='mt-3 leading-7 text-muted-foreground'>
                      {description}
                    </p>
                  </article>
                </ScrollReveal>
              ))}
            </div>

            <div className='mt-5 grid gap-4 sm:grid-cols-3'>
              {[
                { value: '13+', label: 'themes' },
                { value: '03', label: 'core tools' },
                { value: '$0', label: 'to get started' },
              ].map(({ value, label }, index) => (
                <ScrollReveal key={label} delay={0.16 + index * 0.08}>
                  <div className='flex items-baseline justify-between rounded-2xl border border-border/80 bg-background/70 px-5 py-4'>
                    <span className='font-mono text-3xl font-semibold tracking-[-0.06em] text-primary'>
                      {value}
                    </span>
                    <span className='text-sm text-muted-foreground'>
                      {label}
                    </span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className='px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8'>
          <ScrollReveal>
            <div className='relative isolate mx-auto max-w-7xl overflow-hidden rounded-4xl bg-surface-strong px-6 py-12 text-white sm:px-12 sm:py-16 lg:px-16'>
              <div className='marketing-grid pointer-events-none absolute inset-0 -z-10 opacity-10' />
              <div className='pointer-events-none absolute -right-24 -top-28 -z-10 h-72 w-72 rounded-full bg-primary/35 blur-3xl' />
              <div className='grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end'>
                <div>
                  <p className='font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white/55'>
                    Ready when you are
                  </p>
                  <h2 className='mt-6 max-w-3xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl'>
                    Start with one useful tool.
                  </h2>
                  <p className='mt-6 max-w-xl text-base leading-7 text-white/65 sm:text-lg'>
                    Bring one part of your workspace into focus. Add the rest
                    when you need them.
                  </p>
                </div>
                <Button
                  asChild
                  size='lg'
                  className='min-h-12 rounded-full bg-white px-7 text-base text-surface-strong shadow-xl hover:bg-white/90'
                >
                  <Link href={ctaHref}>
                    Create your kit
                    <LuArrowRight className='size-5' aria-hidden='true' />
                  </Link>
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <Footer variant='landing' />
    </div>
  )
}
