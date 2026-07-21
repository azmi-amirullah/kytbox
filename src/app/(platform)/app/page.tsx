import { getAuthenticatedUser } from '@/lib/auth';
import Link from 'next/link';
import { LuLifeBuoy, LuArrowRight } from 'react-icons/lu';
import { KYTBOX_APPS } from '@/config/apps';
import { QuickStats } from './components/QuickStats';
import { QuickActions } from './components/QuickActions';
import { ActivityFeed } from './components/ActivityFeed';

const SUPPORT_SECTION = {
  name: 'Support',
  description: 'Get help from our team',
  href: '/support',
  icon: LuLifeBuoy,
  color: 'bg-cyan-500/10 text-cyan-600',
};

/**
 * Platform Home - Activity Feed Dashboard
 * Dynamic view aggregating statistics and recent activities across all Kytbox apps.
 */
export default async function AppHomePage() {
  const { user, supabase } = await getAuthenticatedUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, role, default_currency')
    .eq('id', user.id)
    .single();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch all dashboard stats in parallel (single batch)
  const [clicksRes, cashflowsRes, tasksRes, activityRes] = await Promise.all([
    supabase
      .from('link_events')
      .select('id, links!inner(user_id)', { count: 'exact', head: true })
      .eq('links.user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase
      .from('cashflow_summaries')
      .select('balance')
      .eq('user_id', user.id),
    supabase
      .from('list_items')
      .select('id, lists!inner(user_id)', { count: 'exact', head: true })
      .eq('is_completed', false)
      .eq('lists.user_id', user.id),
    supabase.rpc('get_recent_activity', { p_user_id: user.id, p_limit: 10 }),
  ]);

  const clicksCount = clicksRes.count || 0;
  const cashflowBalance = (cashflowsRes.data || []).reduce(
    (acc, curr) => acc + (Number(curr.balance) || 0),
    0
  );
  const activeTasksCount = tasksRes.count || 0;
  const recentActivity = activityRes.data || [];

  return (
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-12 w-full space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>
          Welcome back, {profile?.display_name || profile?.username}!
        </h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Here is what is happening across your workspace today.
        </p>
      </div>

      {/* Stats Section */}
      <QuickStats
        clicksCount={clicksCount}
        cashflowBalance={cashflowBalance}
        activeTasksCount={activeTasksCount}
        defaultCurrency={profile?.default_currency || null}
      />

      {/* Apps Section */}
      <div className='w-full pt-8 border-t'>
        <h2 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4'>
          All Apps
        </h2>
        <div id='tour-apps-grid' className='grid sm:grid-cols-2 md:grid-cols-3 gap-4'>
          {KYTBOX_APPS.map((app) => {
            const Icon = app.icon;
            const isActive = app.status === 'active';

            return (
              <Link
                key={app.id}
                id={`tour-app-${app.id}`}
                href={isActive ? app.href : '#'}
                className={`
                    group relative p-5 rounded-2xl border bg-card
                    transition-all duration-200
                    ${
                      isActive
                        ? 'hover:border-primary/25 hover:shadow-md cursor-pointer'
                        : 'opacity-60 cursor-not-allowed'
                    }
                  `}
              >
                <div className='flex items-start gap-4'>
                  <div className={`p-2.5 rounded-xl ${app.color}`}>
                    <Icon className='w-5 h-5' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h3 className='font-semibold text-base truncate'>{app.name}</h3>
                      {!isActive && (
                        <span className='text-[9px] uppercase tracking-wider font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded'>
                          Soon
                        </span>
                      )}
                    </div>
                    <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>
                      {app.description}
                    </p>
                  </div>
                  {isActive && (
                    <LuArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all self-center' />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className='grid md:grid-cols-3 gap-8 items-start pt-8 border-t'>
        {/* Left Side: Activity Feed */}
        <div className='md:col-span-2 space-y-6'>
          <ActivityFeed activities={recentActivity} />
        </div>

        {/* Right Side: Quick Actions & Help */}
        <div className='space-y-6'>
          <QuickActions />

          {/* Support Ticket Section */}
          <div className='w-full'>
            <h2 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
              Help
            </h2>
            <Link
              href={SUPPORT_SECTION.href}
              className='group relative p-6 rounded-2xl border bg-card transition-all duration-200 hover:border-primary/25 hover:shadow-md cursor-pointer block'
            >
              <div className='flex items-start gap-4'>
                <div className={`p-3 rounded-xl ${SUPPORT_SECTION.color}`}>
                  <SUPPORT_SECTION.icon className='w-6 h-6' />
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
              <div className='flex items-center justify-between mt-4 pt-4 border-t border-border/40'>
                <span className='text-xs text-muted-foreground'>Open a ticket</span>
                <LuArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all' />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

