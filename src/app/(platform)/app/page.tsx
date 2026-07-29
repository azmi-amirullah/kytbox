import { getAuthenticatedUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LuLifeBuoy, LuArrowRight } from 'react-icons/lu';
import { KYTBOX_APPS } from '@/config/apps';
import { QuickStats } from './components/QuickStats';
import { QuickStatsSkeleton } from './components/QuickStatsSkeleton';
import { QuickActions } from './components/QuickActions';
import { ActivityFeed } from './components/ActivityFeed';
import { ActivityFeedSkeleton } from './components/ActivityFeedSkeleton';

export const metadata: Metadata = {
  title: 'Workspace',
  robots: { index: false, follow: false },
};

const SUPPORT_SECTION = {
  name: 'Support',
  description: 'Get help from the Kytbox team',
  href: '/support',
  icon: LuLifeBuoy,
  color: 'bg-secondary text-secondary-foreground',
};

const ACTIVE_APPS = KYTBOX_APPS.filter((app) => app.status === 'active');
const COMING_SOON_APPS = KYTBOX_APPS.filter((app) => app.status === 'coming_soon');

async function AsyncQuickStats({
  userId,
  defaultCurrency,
}: {
  userId: string;
  defaultCurrency: string | null;
}) {
  const supabase = await createClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [clicksRes, cashflowsRes, tasksRes] = await Promise.all([
    supabase
      .from('link_events')
      .select('id, links!inner(user_id)', { count: 'exact', head: true })
      .eq('links.user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase
      .from('cashflow_summaries')
      .select('balance')
      .eq('user_id', userId),
    supabase
      .from('list_items')
      .select('id, lists!inner(user_id)', { count: 'exact', head: true })
      .eq('is_completed', false)
      .eq('lists.user_id', userId),
  ]);

  const clicksCount = clicksRes.count || 0;
  const cashflowBalance = (cashflowsRes.data || []).reduce(
    (acc, curr) => acc + (Number(curr.balance) || 0),
    0
  );
  const openItemsCount = tasksRes.count || 0;

  return (
    <QuickStats
      clicksCount={clicksCount}
      cashflowBalance={cashflowBalance}
      openItemsCount={openItemsCount}
      defaultCurrency={defaultCurrency}
    />
  );
}

async function AsyncActivityFeed({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: recentActivity } = await supabase.rpc('get_recent_activity', {
    p_user_id: userId,
    p_limit: 10,
  });

  return <ActivityFeed activities={recentActivity || []} />;
}

/**
 * Platform Home - Activity Feed Dashboard
 * Dynamic view aggregating statistics and recent activities across all Kytbox apps.
 */
export default async function AppHomePage() {
  const { user, profile } = await getAuthenticatedUserAndProfile();

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 md:py-12 lg:px-8'>
      <div className='max-w-2xl'>
        <p className='font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
          Workspace overview
        </p>
        <h1 className='mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl'>
          Welcome back, {profile?.display_name || profile?.username}.
        </h1>
        <p className='mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base'>
          A clear view of your Bio, Cashflow, and List workspace.
        </p>
      </div>

      {/* Stats Section */}
      <Suspense fallback={<QuickStatsSkeleton />}>
        <AsyncQuickStats
          userId={user.id}
          defaultCurrency={profile?.default_currency || null}
        />
      </Suspense>

      {/* Apps Section */}
      <section className='w-full border-t border-border/80 pt-8' aria-labelledby='workspace-tools-heading'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 id='workspace-tools-heading' className='text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
              Your workspace
            </h2>
            <p className='mt-2 text-sm text-muted-foreground'>Open a tool when you need it.</p>
          </div>
          <span className='font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground/70'>03 active tools</span>
        </div>
        <div id='tour-apps-grid' className='mt-5 grid gap-3 sm:grid-cols-3'>
          {ACTIVE_APPS.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.id}
                id={`tour-app-${app.id}`}
                href={app.href}
                className='group min-h-32 rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                <div className='flex h-full flex-col gap-5'>
                  <div className='flex items-center justify-between gap-3'>
                    <div className={`flex size-9 items-center justify-center rounded-xl ${app.color}`}>
                      <Icon className='size-4' aria-hidden='true' />
                    </div>
                    <LuArrowRight className='size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary' aria-hidden='true' />
                  </div>
                  <div>
                    <h3 className='truncate text-sm font-semibold'>{app.name}</h3>
                    <p className='mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground'>{app.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className='grid items-start gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]'>
        {/* Left Side: Activity Feed */}
        <div className='min-w-0'>
          <Suspense fallback={<ActivityFeedSkeleton />}>
            <AsyncActivityFeed userId={user.id} />
          </Suspense>
        </div>

        {/* Right Side: Quick Actions & Help */}
        <div className='space-y-7'>
          <QuickActions />

          {/* Support Ticket Section */}
          <div className='w-full'>
            <h2 className='mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
              Help
            </h2>
            <Link
              href={SUPPORT_SECTION.href}
              className='group relative block rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6'
            >
              <div className='flex items-start gap-4'>
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${SUPPORT_SECTION.color}`}>
                  <SUPPORT_SECTION.icon className='size-6' aria-hidden='true' />
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='font-semibold text-base'>
                    {SUPPORT_SECTION.name}
                  </h3>
                  <p className='text-xs text-muted-foreground mt-1 leading-normal'>
                    {SUPPORT_SECTION.description}
                  </p>
                </div>
              </div>
              <div className='mt-5 flex items-center justify-between border-t border-border/60 pt-4'>
                <span className='text-xs text-muted-foreground'>Open a support ticket</span>
                <LuArrowRight className='size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary' aria-hidden='true' />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {COMING_SOON_APPS.length > 0 && (
        <section className='w-full border-t border-border/80 pt-8' aria-labelledby='coming-soon-heading'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <h2 id='coming-soon-heading' className='text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                Coming soon
              </h2>
              <p className='mt-2 text-sm text-muted-foreground'>More focused tools are on the way.</p>
            </div>
            <span className='font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground/70'>
              {String(COMING_SOON_APPS.length).padStart(2, '0')} in development
            </span>
          </div>
          <div className='mt-5 grid gap-3 sm:grid-cols-3'>
            {COMING_SOON_APPS.map((app) => {
              const Icon = app.icon;
              return (
                <div key={app.id} id={`tour-app-${app.id}`} className='min-h-32 max-w-sm rounded-2xl border border-border/70 bg-card/50 p-4 opacity-70' role='group' aria-label={`${app.name} coming soon`}>
                  <div className='flex h-full flex-col gap-5'>
                    <div className='flex items-center justify-between gap-3'>
                      <div className={`flex size-9 items-center justify-center rounded-xl ${app.color}`}>
                        <Icon className='size-4' aria-hidden='true' />
                      </div>
                      <span className='rounded-full bg-muted px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
                        Coming soon
                      </span>
                    </div>
                    <div>
                      <h3 className='truncate text-sm font-semibold text-muted-foreground'>{app.name}</h3>
                      <p className='mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground'>{app.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
