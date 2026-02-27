import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLogo } from '@/components/brand-logo';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import { LuExternalLink } from 'react-icons/lu';

interface UserData {
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
    <header className='sticky top-0 z-50 w-full border-b border-border bg-background/60 backdrop-blur-md transition-all duration-200'>
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

        <div className='flex items-center gap-3 md:gap-4'>
          {/* Dashboard-specific: Public URL link */}
          {!isLanding && !isAuth && user && publicUrl && (
            <>
              <a
                href={publicUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-all group'
              >
                <span>{user.username}</span>
                <LuExternalLink className='w-3 h-3 group-hover:translate-x-0.5 transition-transform' />
              </a>
              <div className='h-6 w-px bg-border hidden md:block' />
            </>
          )}

          <ThemeToggle />

          {/* Auth state handling - Hide on Auth pages */}
          {!isAuth &&
            (user ? (
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
