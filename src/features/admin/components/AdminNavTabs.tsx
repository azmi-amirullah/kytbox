'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuUsers, LuLifeBuoy, LuChartNoAxesCombined } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export function AdminNavTabs() {
  const pathname = usePathname();

  const isUsers = pathname.startsWith('/admin/users') || pathname === '/admin';
  const isTokenUsage = pathname.startsWith('/admin/usage');
  const isSupport = pathname.startsWith('/support-admin');

  return (
    <nav
      aria-label='Admin'
      className='border-b border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60'
    >
      <div className='mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4'>
        <Link
          href='/admin/users'
          aria-current={isUsers ? 'page' : undefined}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none',
            isUsers
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
          )}
        >
          <LuUsers className='h-4 w-4 shrink-0' aria-hidden='true' />
          <span>User Directory</span>
        </Link>
        <Link
          href='/admin/usage'
          aria-current={isTokenUsage ? 'page' : undefined}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none',
            isTokenUsage
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
          )}
        >
          <LuChartNoAxesCombined className='h-4 w-4 shrink-0' aria-hidden='true' />
          <span>Token Usage</span>
        </Link>
        <Link
          href='/support-admin'
          aria-current={isSupport ? 'page' : undefined}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none',
            isSupport
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
          )}
        >
          <LuLifeBuoy className='h-4 w-4 shrink-0' aria-hidden='true' />
          <span>Support Queue</span>
        </Link>
      </div>
    </nav>
  );
}
