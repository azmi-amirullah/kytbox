/* eslint-disable @next/next/no-html-link-for-pages */
import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { HomeBrandLink } from '@/components/home-brand-link'
import { UserNav } from '@/components/user-nav'
import { NotificationCenter } from '@/features/notifications'
import { Button } from '@/components/ui/button'
import { SearchTrigger } from '@/components/search-trigger'
import { siteConfig } from '@/config/site'
import { LuExternalLink } from 'react-icons/lu'

interface UserData {
  id?: string
  username: string
  email?: string
  avatar_url: string | null
  display_name: string | null
  role?: 'user' | 'admin' | string | null
}

interface HeaderProps {
  variant: 'landing' | 'dashboard' | 'auth' | 'legal'
  user?: UserData | null
  publicUrl?: string
}

export function Header({ variant, user, publicUrl }: HeaderProps) {
  const isLanding = variant === 'landing'
  const isDashboard = variant === 'dashboard'
  const isAuth = variant === 'auth'
  const isLegal = variant === 'legal'
  const brandHref = isAuth ? siteConfig.url : isDashboard ? '/app' : '/'

  return (
    <header className='fixed left-0 right-0 top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-xl transition-colors duration-200'>
      <div className='mx-auto flex min-h-16 max-w-7xl items-center gap-6 px-4 sm:px-6'>
        {isLanding ? (
          <HomeBrandLink className='min-h-11 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
            <BrandLogo />
          </HomeBrandLink>
        ) : (
          <Link
            href={brandHref}
            className='min-h-11 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            aria-label={isDashboard ? 'Dashboard' : 'Home'}
          >
            <BrandLogo />
          </Link>
        )}

        {isLanding && (
          <nav
            className='hidden items-center gap-1 md:flex'
            aria-label='Primary navigation'
          >
            <Link
              href='#platform'
              className='flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              Platform
            </Link>
            <Link
              href='#workflow'
              className='flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              Workflow
            </Link>
            <Link
              href='#principles'
              className='flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              Principles
            </Link>
          </nav>
        )}

        <div className='ml-auto flex items-center gap-2 sm:gap-3'>
          {isDashboard && <SearchTrigger />}

          {!isLanding && !isAuth && user && publicUrl && (
            <a
              href={publicUrl}
              target='_blank'
              rel='noopener noreferrer'
              title='View Public Profile'
              aria-label='View Public Profile'
              className='flex h-8 w-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border/80 bg-secondary/40 px-0 text-xs font-medium text-foreground transition-all hover:bg-secondary/80 sm:h-9 sm:w-auto sm:px-3'
            >
              <span className='hidden sm:inline'>{user.username}</span>
              <LuExternalLink
                className='size-4 shrink-0 text-primary'
                aria-hidden='true'
              />
            </a>
          )}

          {user && <NotificationCenter user={user} />}

          {!isAuth &&
            (user === undefined ? (
              <div className='size-9 rounded-full bg-muted/60 animate-pulse' />
            ) : user ? (
              <div className='flex items-center gap-2 sm:gap-4'>
                {(isLanding || isLegal) && (
                  <Button asChild className='min-h-11 rounded-full px-4'>
                    <a href='/app'>Dashboard</a>
                  </Button>
                )}
                <UserNav user={user} />
              </div>
            ) : (
              <div className='flex items-center gap-1.5 sm:gap-2'>
                {isLanding && (
                  <Button asChild className='min-h-11 rounded-full px-4'>
                    <a href='/signup'>Get started</a>
                  </Button>
                )}
                <Button
                  asChild
                  variant={isLanding ? 'ghost' : 'default'}
                  className='min-h-11 rounded-full px-4'
                >
                  <a href='/login'>Log in</a>
                </Button>
              </div>
            ))}
        </div>
      </div>
    </header>
  )
}
