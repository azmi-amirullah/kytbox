import type { AdminUserResourceCounts } from '../types';
import {
  LuLink,
  LuWallet,
  LuListTodo,
  LuCar,
  LuFileText,
  LuGlobe,
} from 'react-icons/lu';
import { cn } from '@/lib/utils';

interface UserResourceBadgesProps {
  counts: AdminUserResourceCounts;
  className?: string;
}

export function UserResourceBadges({
  counts,
  className,
}: UserResourceBadgesProps) {
  const items = [
    {
      label: 'Links',
      count: counts.links,
      icon: LuLink,
      activeColor:
        'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Cashflows',
      count: counts.cashflows,
      icon: LuWallet,
      activeColor:
        'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Lists',
      count: counts.lists,
      icon: LuListTodo,
      activeColor:
        'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Vehicles',
      count: counts.vehicles,
      icon: LuCar,
      activeColor:
        'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Invoices',
      count: counts.invoices,
      icon: LuFileText,
      activeColor:
        'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
  ];

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.count > 0;
        return (
          <span
            key={item.label}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border transition-colors',
              isActive
                ? item.activeColor
                : 'text-muted-foreground/60 bg-muted/20 border-border/40 opacity-70',
            )}
            title={`${item.count} ${item.label}`}
            aria-label={`${item.count} ${item.label}`}
          >
            <Icon className='h-3 w-3 shrink-0' />
            <span>{item.count}</span>
            <span className='sr-only'>{item.label}</span>
          </span>
        );
      })}

      {counts.hasCustomDomain && (
        <span
          className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
          title='Custom Domain Configured'
          aria-label='Custom Domain Configured'
        >
          <LuGlobe className='h-3 w-3 shrink-0' />
          <span>Domain</span>
        </span>
      )}
    </div>
  );
}
