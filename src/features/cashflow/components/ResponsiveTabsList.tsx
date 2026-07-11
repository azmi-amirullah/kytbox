import type { IconType } from 'react-icons';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface ChartTab {
  value: string;
  label: string;
  icon: IconType;
}

interface ResponsiveTabsListProps {
  tabs: ChartTab[];
  className?: string;
}

/**
 * A TabsList that wraps to 2-per-row on mobile and collapses to a single row
 * on `sm` breakpoints and above. The last tab stretches full-width if it
 * would otherwise be an orphan (odd number of total tabs).
 */
export function ResponsiveTabsList({ tabs, className }: ResponsiveTabsListProps) {
  const isOddCount = tabs.length % 2 !== 0;

  return (
    <TabsList
      className={cn(
        'mb-4 w-full flex! h-auto! flex-wrap gap-y-1 py-1',
        className,
      )}
    >
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const isOrphan = isOddCount && index === tabs.length - 1;

        return (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'gap-1.5 text-sm',
              isOrphan ? 'basis-full sm:flex-1' : 'basis-1/2 sm:flex-1',
            )}
          >
            <Icon className='w-3.5 h-3.5 shrink-0' />
            <span className='truncate'>{tab.label}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
