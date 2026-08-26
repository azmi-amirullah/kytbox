import { getAuthenticatedUserAndProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LuLifeBuoy, LuArrowRight } from 'react-icons/lu'
import { KYTBOX_APPS } from '@/config/apps'
import { Loader } from '@/components/ui/loader'
import { QuickStats } from './components/QuickStats'
import { QuickActions } from './components/QuickActions'
import { ActivityFeed } from './components/ActivityFeed'

export const metadata: Metadata = {
  title: 'Workspace',
  robots: { index: false, follow: false },
}

const SUPPORT_SECTION = {
  name: 'Support',
  description: 'Get help from the Kytbox team',
  href: '/support',
  icon: LuLifeBuoy,
  color: 'bg-secondary text-secondary-foreground',
}

const ACTIVE_APPS = KYTBOX_APPS.filter((app) => app.status === 'active')
const COMING_SOON_APPS = KYTBOX_APPS.filter(
  (app) => app.status === 'coming_soon',
)

async function AsyncQuickStats({
  userId,
  defaultCurrency,
}: {
  userId: string
  defaultCurrency: string | null
}) {
  const supabase = await createClient()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [clicksRes, cashflowsRes, tasksRes] = await Promise.all([
    supabase
      .from('link_events')
      .select('id, links!inner(user_id)', { count: 'exact', head: true })
      .eq('links.user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase.from('cashflow_summaries').select('balance').eq('user_id', userId),
    supabase
      .from('list_items')
      .select('id, lists!inner(user_id)', { count: 'exact', head: true })
      .eq('is_completed', false)
      .eq('lists.user_id', userId),
  ])

  const clicksCount = clicksRes.count || 0
  const cashflowBalance = (cashflowsRes.data || []).reduce(
    (acc, curr) => acc + (Number(curr.balance) || 0),
    0,
  )
  const openItemsCount = tasksRes.count || 0

  return (
    <QuickStats
      clicksCount={clicksCount}
      cashflowBalance={cashflowBalance}
      openItemsCount={openItemsCount}
      defaultCurrency={defaultCurrency}
    />
  )
}

async function AsyncActivityFeed({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { data: recentActivity } = await supabase.rpc('get_recent_activity', {
    p_user_id: userId,
    p_limit: 10,
  })

  return <ActivityFeed activities={recentActivity || []} />
}

/**
 * Platform Home - Activity Feed Dashboard
 * Dynamic view aggregating statistics and recent activities across all Kytbox apps.
 */
export default async function AppHomePage() {
  const { user, profile } = await getAuthenticatedUserAndProfile()

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 md:py-10 lg:px-8'>
      <div className='max-w-2xl'>
        <p className='font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary sm:text-xs'>
          Workspace overview
        </p>
        <h1 className='mt-2 text-2xl font-semibold tracking-[-0.04em] sm:mt-3 sm:text-3xl md:text-4xl'>
          Welcome back, {profile?.display_name || profile?.username}.
        </h1>
        <p className='mt-1 text-xs leading-5 text-muted-foreground sm:mt-2 sm:text-sm sm:leading-6'>
          A clear view of your active workspace.
        </p>
      </div>

      {/* Stats Section */}
      <Suspense
        fallback={
          <Loader
            className='min-h-24 py-4 bg-card border border-border/80 rounded-xl sm:rounded-2xl'
            text='Loading stats...'
          />
        }
      >
        <AsyncQuickStats
          userId={user.id}
          defaultCurrency={profile?.default_currency || null}
        />
      </Suspense>

      {/* Apps Section */}
      <section
        className='w-full border-t border-border/80 pt-6 sm:pt-8'
        aria-labelledby='workspace-tools-heading'
      >
        <div className='flex items-center justify-between gap-2'>
          <div>
            <h2
              id='workspace-tools-heading'
              className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-sm'
            >
              Your workspace
            </h2>
            <p className='mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm'>
              Open a tool when you need it.
            </p>
          </div>
          <span className='font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground/70 sm:text-xs'>
            {String(ACTIVE_APPS.length).padStart(2, '0')} active tools
          </span>
        </div>
        <div
          id='tour-apps-grid'
          className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4'
        >
          {ACTIVE_APPS.map((app) => {
            const Icon = app.icon
            return (
              <Link
                key={app.id}
                id={`tour-app-${app.id}`}
                href={app.href}
                className='group flex flex-col justify-between rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                <div className='flex items-center justify-between gap-2'>
                  <div
                    className={`flex size-9 items-center justify-center rounded-xl ${app.color}`}
                  >
                    <Icon className='size-4' aria-hidden='true' />
                  </div>
                  <LuArrowRight
                    className='size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary'
                    aria-hidden='true'
                  />
                </div>
                <div className='mt-4'>
                  <h3 className='truncate text-sm font-semibold'>{app.name}</h3>
                  <p className='mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground'>
                    {app.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <div className='grid items-start gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]'>
        {/* Left Side: Activity Feed */}
        <div className='min-w-0'>
          <Suspense
            fallback={
              <Loader
                className='min-h-60 py-8 bg-card/70 border border-border/80 rounded-2xl'
                text='Loading activity feed...'
              />
            }
          >
            <AsyncActivityFeed userId={user.id} />
          </Suspense>
        </div>

        {/* Right Side: Quick Actions & Help */}
        <div className='space-y-6 sm:space-y-7'>
          <QuickActions />

          {/* Support Ticket Section */}
          <div className='w-full'>
            <h2 className='mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-sm'>
              Help
            </h2>
            <Link
              href={SUPPORT_SECTION.href}
              className='group relative block rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5'
            >
              <div className='flex items-start gap-3.5 sm:gap-4'>
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl sm:size-12 ${SUPPORT_SECTION.color}`}
                >
                  <SUPPORT_SECTION.icon
                    className='size-5 sm:size-6'
                    aria-hidden='true'
                  />
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='text-sm font-semibold sm:text-base'>
                    {SUPPORT_SECTION.name}
                  </h3>
                  <p className='mt-0.5 text-xs text-muted-foreground leading-normal'>
                    {SUPPORT_SECTION.description}
                  </p>
                </div>
              </div>
              <div className='mt-4 flex items-center justify-between border-t border-border/60 pt-3.5'>
                <span className='text-xs text-muted-foreground'>
                  Open a support ticket
                </span>
                <LuArrowRight
                  className='size-3.5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary sm:size-4'
                  aria-hidden='true'
                />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {COMING_SOON_APPS.length > 0 && (
        <section
          className='w-full border-t border-border/80 pt-6 sm:pt-8'
          aria-labelledby='coming-soon-heading'
        >
          <div className='flex items-center justify-between gap-2'>
            <div>
              <h2
                id='coming-soon-heading'
                className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-sm'
              >
                Coming soon
              </h2>
              <p className='mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm'>
                More focused tools are on the way.
              </p>
            </div>
            <span className='font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground/70 sm:text-xs'>
              {String(COMING_SOON_APPS.length).padStart(2, '0')} in development
            </span>
          </div>
          <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {COMING_SOON_APPS.map((app) => {
              const Icon = app.icon
              return (
                <div
                  key={app.id}
                  id={`tour-app-${app.id}`}
                  className='flex flex-col justify-between rounded-2xl border border-border/70 bg-card/50 p-4 opacity-70'
                  role='group'
                  aria-label={`${app.name} coming soon`}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <div
                      className={`flex size-9 items-center justify-center rounded-xl ${app.color}`}
                    >
                      <Icon className='size-4' aria-hidden='true' />
                    </div>
                    <span className='rounded-full bg-muted px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground'>
                      Soon
                    </span>
                  </div>
                  <div className='mt-4'>
                    <h3 className='truncate text-sm font-semibold text-muted-foreground'>
                      {app.name}
                    </h3>
                    <p className='mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground'>
                      {app.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
