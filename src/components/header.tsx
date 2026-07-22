import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { UserNav } from '@/components/user-nav';
import { SupportNotificationBell } from '@/components/support-notification-bell';
import { Button } from '@/components/ui/button';
import { LuExternalLink } from 'react-icons/lu';
import { SearchTrigger } from '@/components/search-trigger';
import { Skeleton } from '@/components/ui/skeleton';

interface UserData {
  id?: string;
  username: string;
  email?: string;
  avatar_url: string | null;
  display_name: string | null;
  role?: 'user' | 'admin' | string | null;
}

interface HeaderProps {
  variant: 'landing' | 'dashboard' | 'auth' | 'legal';
  user?: UserData | null;
  publicUrl?: string;
}

export function Header({ variant, user, publicUrl }: HeaderProps) {
  const isLanding = variant === 'landing';
  const isDashboard = variant === 'dashboard';
  const isAuth = variant === 'auth';
  const isLegal = variant === 'legal';

  return (
    <header className='fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background/60 backdrop-blur-md transition-colors duration-200'>
      <div className='max-w-7xl mx-auto px-4 h-16 flex items-center justify-between'>
        {isLanding ? (
          <BrandLogo className='cursor-default select-none' />
        ) : (
          <Link
            href={isDashboard ? '/app' : '/'}
            className='hover:opacity-80 transition-opacity'
            aria-label={isDashboard ? 'Dashboard' : 'Home'}
          >
            <BrandLogo />
          </Link>
        )}

        <div className='flex items-center gap-2 sm:gap-3 md:gap-4'>
          {/* Search Trigger Button — Only for dashboard */}
          {isDashboard && <SearchTrigger />}

          {/* Dashboard-specific: Public URL link (After search, before notification) */}
          {!isLanding && !isAuth && user && publicUrl && (
            <a
              href={publicUrl}
              target='_blank'
              rel='noopener noreferrer'
              title='View Public Profile'
              aria-label='View Public Profile'
              className='flex items-center justify-center gap-1.5 h-8 w-8 sm:h-9 sm:w-auto px-0 sm:px-3 text-xs font-medium text-foreground bg-secondary/40 border border-border/80 rounded-full hover:bg-secondary/80 transition-all group shrink-0'
            >
              <span className='hidden sm:inline'>{user.username}</span>
              <LuExternalLink className='w-4 h-4 stroke-[1.75] text-primary shrink-0' />
            </a>
          )}

          {/* Support notification bell — Suspense-wrapped, non-blocking */}
          <SupportNotificationBell user={user} />

          {/* Auth state handling - Hide on Auth pages */}
          {!isAuth &&
            (user === undefined ? (
              <Skeleton className='w-8 h-8 rounded-full' />
            ) : user ? (
              <div className='flex items-center gap-4'>
                {(isLanding || isLegal) && (
                  <Link href='/app'>
                    <Button>Dashboard</Button>
                  </Link>
                )}
                <UserNav user={user} />
              </div>
            ) : (
              <Link href='/login'>
                <Button>Log in</Button>
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}
