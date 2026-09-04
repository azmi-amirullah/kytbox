'use client';

import type { IconType } from 'react-icons';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface ChartTab {
  value: string;
  label: string;
  icon: IconType;
}

interface ResponsiveTabsListProps {
  tabs: ChartTab[];
  value: string;
  onValueChange: (val: string) => void;
  className?: string;
}

/**
 * A responsive view switcher:
 * - Mobile (< sm): Clean Select dropdown with active icon/label
 * - Desktop (>= sm): High-contrast segmented pill tabs (no scrollbars)
 */
export function ResponsiveTabsList({
  tabs,
  value,
  onValueChange,
  className,
}: ResponsiveTabsListProps) {
  const activeTab = tabs.find((t) => t.value === value) ?? tabs[0];
  const ActiveIcon = activeTab?.icon;

  return (
    <div className='w-full sm:w-auto'>
      {/* Mobile (< sm): Clean Select Dropdown */}
      <div className='sm:hidden w-full'>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger
            size='sm'
            className='h-9 w-full bg-muted/60 border-border/60 rounded-xl text-xs font-medium'
            aria-label='Select chart view'
          >
            <div className='flex items-center gap-2 truncate'>
              {ActiveIcon && <ActiveIcon className='w-4 h-4 text-primary shrink-0' />}
              <span className='truncate'>{activeTab?.label ?? 'Select view'}</span>
            </div>
          </SelectTrigger>
          <SelectContent align='end' className='rounded-xl'>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = tab.value === value;

              return (
                <SelectItem
                  key={tab.value}
                  value={tab.value}
                  className='text-xs py-2 rounded-lg'
                >
                  <div className='flex items-center gap-2'>
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0',
                        isSelected ? 'text-primary' : 'text-muted-foreground',
                      )}
                    />
                    <span className={cn(isSelected && 'font-semibold text-foreground')}>
                      {tab.label}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop (>= sm): Segmented Pill Tabs (no scroll container) */}
      <div className='hidden sm:flex items-center'>
        <TabsList
          className={cn(
            'inline-flex h-auto gap-1 p-1 bg-muted/60 border border-border/50 rounded-xl shadow-2xs',
            className,
          )}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  'gap-1.5 text-xs py-1.5 px-3 rounded-lg font-medium whitespace-nowrap transition-all',
                  'text-muted-foreground hover:text-foreground',
                  'data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-xs data-[state=active]:border data-[state=active]:border-border/80',
                  '[&[data-state=active]_svg]:text-primary',
                )}
              >
                <Icon className='w-3.5 h-3.5 shrink-0 text-muted-foreground transition-colors' />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
    </div>
  );
}
