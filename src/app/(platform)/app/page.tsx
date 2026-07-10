import { getAuthenticatedUser } from '@/lib/auth';
import Link from 'next/link';
import { LuLifeBuoy, LuArrowRight } from 'react-icons/lu';
import { KYTBOX_APPS } from '@/config/apps';
import { getSupportTicketSummary } from '@/lib/support-notifications';
import { userRoleSchema } from '@/lib/validation.schemas';

const SUPPORT_SECTION = {
  name: 'Support',
  description: 'Get help from our team',
  href: '/support',
  icon: LuLifeBuoy,
  color: 'bg-cyan-500/10 text-cyan-600',
};

/**
 * Platform Home - App Switcher
 * Shows all available Kytbox apps.
 * Auth + profile guard is handled by the platform layout — this page
 * only fetches the display fields it needs.
 */
export default async function AppHomePage() {
  const { user, supabase } = await getAuthenticatedUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, role')
    .eq('id', user.id)
    .single();

  const isAdmin = userRoleSchema.parse(profile?.role) === 'admin';

  const { needsAttentionCount } = await getSupportTicketSummary(user.id, isAdmin);

  return (
    <div className='max-w-4xl mx-auto px-4 py-8 md:py-12 w-full'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Welcome back, {profile?.display_name || profile?.username}!
        </h1>
        <p className='text-muted-foreground mt-1'>
          Choose an app to get started
        </p>
      </div>

      {/* App Grid */}
      <div className='grid sm:grid-cols-2 gap-4'>
        {KYTBOX_APPS.map((app) => {
          const Icon = app.icon;
          const isActive = app.status === 'active';

          return (
            <Link
              key={app.id}
              href={isActive ? app.href : '#'}
              className={`
                  group relative p-6 rounded-2xl border bg-card
                  transition-all duration-200
                  ${
                    isActive
                      ? 'hover:border-primary/40 hover:shadow-lg cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  }
                `}
            >
              <div className='flex items-start gap-4'>
                <div className={`p-3 rounded-xl ${app.color}`}>
                  <Icon className='w-6 h-6' />
                </div>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <h2 className='font-semibold text-lg'>{app.name}</h2>
                    {!isActive && (
                      <span className='text-[10px] uppercase tracking-wider font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded'>
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {app.description}
                  </p>
                </div>
                {isActive && (
                  <LuArrowRight className='w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all' />
                )}
              </div>
            </Link>
          );
        })}
      </div>

    {/* Support */}
      <div className='mt-8'>
        <h2 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
          Help
        </h2>
        <Link
          href={isAdmin ? '/support-admin' : SUPPORT_SECTION.href}
          className={`
            group relative p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg cursor-pointer block
            ${
              needsAttentionCount > 0
                ? 'bg-orange-50 border-orange-200 hover:border-orange-300 dark:bg-orange-950/20 dark:border-orange-900/50 dark:hover:border-orange-800/80'
                : 'bg-card hover:border-primary/40'
            }
          `}
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-start gap-4'>
              <div
                className={`p-3 rounded-xl ${
                  needsAttentionCount > 0
                    ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400'
                    : SUPPORT_SECTION.color
                }`}
              >
                <SUPPORT_SECTION.icon className='w-6 h-6' />
              </div>
              <div className='flex-1'>
                <h3
                  className={`font-semibold text-lg ${
                    needsAttentionCount > 0 ? 'text-orange-900 dark:text-orange-100' : ''
                  }`}
                >
                  {isAdmin ? 'Support Queue' : SUPPORT_SECTION.name}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    needsAttentionCount > 0
                      ? 'text-orange-700/80 dark:text-orange-300/80'
                      : 'text-muted-foreground'
                  }`}
                >
                  {needsAttentionCount > 0
                    ? isAdmin
                      ? `${needsAttentionCount} support tickets need your attention`
                      : `${needsAttentionCount} unread updates from support`
                    : SUPPORT_SECTION.description}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              {needsAttentionCount > 0 && (
                <span className='text-xs font-medium text-orange-600 dark:text-orange-400 mr-2 bg-orange-100 dark:bg-orange-900/40 px-2 py-1 rounded-full'>
                  {isAdmin ? 'Awaiting admin reply' : 'Awaiting your review'}
                </span>
              )}
              <LuArrowRight
                className={`w-5 h-5 transition-all group-hover:translate-x-1 ${
                  needsAttentionCount > 0
                    ? 'text-orange-500 group-hover:text-orange-600 dark:text-orange-400 dark:group-hover:text-orange-300'
                    : 'text-muted-foreground group-hover:text-primary'
                }`}
              />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
