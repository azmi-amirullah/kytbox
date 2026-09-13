'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuUsers, LuLifeBuoy } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export function AdminNavTabs() {
  const pathname = usePathname();

  const isUsers = pathname.startsWith('/admin/users') || pathname === '/admin';
  const isSupport = pathname.startsWith('/support-admin');

  return (
    <div className='border-b border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60'>
      <div className='max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto no-scrollbar'>
        <Link
          href='/admin/users'
          className={cn(
            'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
            isUsers
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
          )}
        >
          <LuUsers className='h-4 w-4 shrink-0' />
          <span>User Directory</span>
        </Link>
        <Link
          href='/support-admin'
          className={cn(
            'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
            isSupport
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
          )}
        >
          <LuLifeBuoy className='h-4 w-4 shrink-0' />
          <span>Support Queue</span>
        </Link>
      </div>
    </div>
  );
}
