'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import {
  DateRangePicker,
  getDateRangeLabel,
} from '@/components/analytics/DateRangePicker';
import type { DateRange } from '@/types/analytics';
import {
  LuMousePointer2,
  LuChevronRight,
  LuArrowLeft,
  LuLink,
  LuChevronDown,
  LuGlobe,
  LuEye,
  LuPercent,
} from 'react-icons/lu';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAnalyticsData, type AnalyticsData } from '../actions';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';

interface AnalyticsClientProps {
  initialData: AnalyticsData;
}

export default function AnalyticsClient({ initialData }: AnalyticsClientProps) {
  const [range, setRange] = useState<DateRange>('24h');
  const [selectedLink, setSelectedLink] = useState<string>('all');
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip fetch on initial mount since we have server-provided data
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Debounce to prevent excessive API calls on rapid filter changes
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await getAnalyticsData(range, selectedLink);
        setData(result);
      });
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [range, selectedLink]);

  const totalClicks = data.totalClicks;
  const totalViews = data.totalViews;
  const ctr = data.ctr;
  const chartData = data.chartData;
  const topLinks = data.topLinks;
  const topReferer = data.topReferer || 'Direct';
  const userLinks = data.userLinks;

  return (
    <div className='space-y-4 md:space-y-6'>
      {/* Header + Actions */}
      <div className='flex flex-col gap-4 md:gap-6'>
        <div>
          <nav className='flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-3 md:mb-4'>
            <Link
              href='/app'
              className='hover:text-foreground transition-colors'
            >
              Kytbox
            </Link>
            <LuChevronRight className='w-3 h-3' />
            <Link
              href='/bio'
              className='hover:text-foreground transition-colors'
            >
              Bio
            </Link>
            <LuChevronRight className='w-3 h-3' />
            <span className='text-foreground font-medium'>Analytics</span>
          </nav>

          <div className='flex items-center gap-2 md:gap-4 mb-1 md:mb-2'>
            <Button variant='ghost' size='icon' asChild className='-ml-2'>
              <Link href='/bio'>
                <LuArrowLeft className='w-5! h-5!' />
              </Link>
            </Button>
            <h1 className='text-2xl md:text-3xl font-bold tracking-tight'>
              Analytics
            </h1>
          </div>

          <p className='text-sm text-muted-foreground'>
            Track your link performance and audience engagement.
          </p>
        </div>

        <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
          {/* Filters grouped on the right side on desktop, stacked on mobile */}
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto w-full sm:w-auto'>
            {/* Link Filter */}
            <div className='w-full lg:w-[220px]'>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    disabled={isPending}
                    className='w-full justify-between bg-background dark:bg-background disabled:opacity-100 disabled:text-muted-foreground'
                  >
                    <span className='truncate'>
                      {selectedLink === 'all'
                        ? 'All Links'
                        : userLinks.find((l) => l.id === selectedLink)?.title ||
                          'Filter by link'}
                    </span>
                    <LuChevronDown className='ml-2 h-4 w-4 opacity-50 shrink-0' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-[calc(100vw-32px)] sm:w-[220px]'
                  align='end'
                >
                  <DropdownMenuItem
                    className='cursor-pointer'
                    onClick={() => setSelectedLink('all')}
                  >
                    All Links
                  </DropdownMenuItem>
                  {userLinks.map((link) => (
                    <DropdownMenuItem
                      key={link.id}
                      className='cursor-pointer'
                      onClick={() => setSelectedLink(link.id)}
                    >
                      {link.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Date Range Filter */}
            <DateRangePicker
              value={range}
              onChange={setRange}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Loading Skeleton - only shows on filter changes */}
      {isPending && <AnalyticsSkeleton range={range} />}

      {/* Stats Grid */}
      {!isPending && (
        <>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
            <div className='p-4 md:p-6 bg-card rounded-xl border shadow-sm'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <LuEye className='w-4 h-4' />
                <span className='text-sm font-medium'>Total Profile Views</span>
              </div>
              <div className='text-2xl font-bold'>{totalViews}</div>
              <p className='text-xs text-muted-foreground mt-1'>
                {range === 'lifetime' ? 'All time' : `In selected period`}
              </p>
            </div>

            <div className='p-4 md:p-6 bg-card rounded-xl border shadow-sm'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <LuMousePointer2 className='w-4 h-4' />
                <span className='text-sm font-medium'>Total Clicks</span>
              </div>
              <div className='text-2xl font-bold'>{totalClicks}</div>
              <p className='text-xs text-muted-foreground mt-1'>
                {range === 'lifetime' ? 'All time' : `In selected period`}
              </p>
            </div>

            <div className='p-6 bg-card rounded-xl border shadow-sm'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <LuPercent className='w-4 h-4' />
                <span className='text-sm font-medium'>CTR</span>
              </div>
              <div className='text-2xl font-bold'>{ctr.toFixed(1)}%</div>
              <p className='text-xs text-muted-foreground mt-1'>
                Click-through rate
              </p>
            </div>

            <div className='p-6 bg-card rounded-xl border shadow-sm'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <LuGlobe className='w-4 h-4' />
                <span className='text-sm font-medium'>Top Source</span>
              </div>
              <div className='text-2xl font-bold truncate'>{topReferer}</div>
              <p className='text-xs text-muted-foreground mt-1'>
                Most traffic from
              </p>
            </div>

            <div className='p-6 bg-card rounded-xl border shadow-sm'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <LuMousePointer2 className='w-4 h-4' />
                <span className='text-sm font-medium'>Average</span>
              </div>
              <div className='text-2xl font-bold'>
                {chartData.length > 0
                  ? Math.round(totalClicks / chartData.length)
                  : 0}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                {range === '24h'
                  ? 'Per hour'
                  : range === 'lifetime'
                    ? 'Per month'
                    : 'Per day'}
              </p>
            </div>
          </div>

          {/* Main Chart */}
          <AnalyticsChart
            data={chartData}
            title='Click Activity'
            dateRange={
              range === 'lifetime'
                ? chartData.length > 0
                  ? chartData[0].label === chartData[chartData.length - 1].label
                    ? chartData[0].label
                    : `${chartData[0].label} - ${chartData[chartData.length - 1].label}`
                  : 'All time'
                : getDateRangeLabel(range)
            }
            total={totalClicks}
          />

          {/* Top Links Table */}
          <div className='rounded-xl border bg-card shadow-sm overflow-hidden p-4 md:p-6'>
            <div className='border-b flex items-center gap-2 text-muted-foreground pb-4'>
              <LuLink className='w-4 h-4' />
              <h3 className='font-semibold text-foreground'>
                Top Performing Links
              </h3>
            </div>
            <div className='p-0'>
              {topLinks.length === 0 ? (
                <div className='p-6 text-center text-muted-foreground'>
                  No clicks recorded yet. Share your links to start tracking!
                </div>
              ) : (
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b bg-muted/50'>
                      <th className='h-10 px-4 text-left align-middle font-medium text-muted-foreground'>
                        Link Title
                      </th>
                      <th className='h-10 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell'>
                        URL
                      </th>
                      <th className='h-10 px-4 text-right align-middle font-medium text-muted-foreground'>
                        Clicks
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLinks.map((link) => (
                      <tr
                        key={link.id}
                        className='border-b last:border-0 hover:bg-muted/50 transition-colors'
                      >
                        <td className='p-3 md:p-4'>
                          <div className='flex flex-col min-w-0'>
                            <span className='font-medium truncate'>
                              {link.title}
                            </span>
                            <span className='text-muted-foreground truncate md:hidden'>
                              {link.url}
                            </span>
                          </div>
                        </td>
                        <td className='p-3 md:p-4 text-muted-foreground truncate max-w-[200px] hidden md:table-cell'>
                          {link.url}
                        </td>
                        <td className='p-3 md:p-4 text-right font-medium'>
                          {link.clicks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
