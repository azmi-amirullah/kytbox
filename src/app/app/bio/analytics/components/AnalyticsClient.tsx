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
  LuActivity,
  LuChevronRight,
  LuArrowLeft,
  LuLink,
  LuChevronDown,
  LuGlobe,
} from 'react-icons/lu';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAnalyticsData, type AnalyticsData } from '../actions';

export default function AnalyticsClient() {
  const [range, setRange] = useState<DateRange>('24h');
  const [selectedLink, setSelectedLink] = useState<string>('all');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
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

  // Show loading on initial load (data is null) or when transition is pending
  const isLoading = isPending || data === null;

  const totalClicks = data?.totalClicks || 0;
  const chartData = data?.chartData || [];
  const topLinks = data?.topLinks || [];
  const topReferer = data?.topReferer || 'Direct';
  const userLinks = data?.userLinks || [];

  return (
    <div className='space-y-6'>
      {/* Header + Actions */}
      <div className='flex flex-col gap-6'>
        <div>
          <nav className='flex items-center gap-1 text-sm text-muted-foreground mb-4'>
            <Link
              href='/app'
              className='hover:text-foreground transition-colors'
            >
              UKIT
            </Link>
            <LuChevronRight className='w-3 h-3' />
            <Link
              href='/app/bio'
              className='hover:text-foreground transition-colors'
            >
              Bio
            </Link>
            <LuChevronRight className='w-3 h-3' />
            <span className='text-foreground font-medium'>Analytics</span>
          </nav>

          <div className='flex items-center gap-4 mb-2'>
            <Button variant='ghost' size='icon' asChild className='-ml-2'>
              <Link href='/app/bio'>
                <LuArrowLeft className='w-5 h-5' />
              </Link>
            </Button>
            <h1 className='text-3xl font-bold tracking-tight'>Analytics</h1>
          </div>

          <p className='text-muted-foreground'>
            Track your link performance and audience engagement.
          </p>
        </div>

        <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4'>
          {/* Filters grouped on the right side on desktop, stacked on mobile */}
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto w-full sm:w-auto'>
            {/* Link Filter */}
            <div className='w-full sm:w-[200px]'>
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
                <DropdownMenuContent className='w-[200px]' align='end'>
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

      {/* Loading Skeleton */}
      {isLoading && (
        <div className='space-y-6'>
          {/* Stats Grid Skeleton */}
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='p-6 bg-card rounded-xl border shadow-sm'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <LuMousePointer2 className='w-4 h-4' />
                <span className='text-sm font-medium'>Total Clicks</span>
              </div>
              <Skeleton className='h-8 w-16 mb-1' />
              <p className='text-xs text-muted-foreground mt-1'>
                In selected period
              </p>
            </div>

            <div className='p-6 bg-card rounded-xl border shadow-sm'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <LuGlobe className='w-4 h-4' />
                <span className='text-sm font-medium'>Top Source</span>
              </div>
              <Skeleton className='h-8 w-24 mb-1' />
              <p className='text-xs text-muted-foregro  und mt-1'>
                Most traffic from
              </p>
            </div>

            <div className='p-6 bg-card rounded-xl border shadow-sm'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <LuMousePointer2 className='w-4 h-4' />
                <span className='text-sm font-medium'>Average</span>
              </div>
              <Skeleton className='h-8 w-12 mb-1' />
              <p className='text-xs text-muted-foreground mt-1'>
                {range === '24h' ? 'Per hour' : 'Per day'}
              </p>
            </div>
          </div>

          {/* Chart Skeleton */}
          <div className='rounded-xl border bg-card shadow-sm p-6 h-[330px]'>
            <div className='mb-4'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <LuActivity className='w-4 h-4' />
                  <h3 className='text-sm font-medium'>Click Activity</h3>
                </div>
                <Skeleton className='h-4 w-32' />
              </div>
              <Skeleton className='h-8 w-24 mt-1' />
            </div>
            <Skeleton className='h-[210px] w-full rounded-lg' />
          </div>

          {/* Table Skeleton */}
          <div className='rounded-xl border bg-card shadow-sm overflow-hidden p-6'>
            <div className='border-b flex items-center gap-2 text-muted-foreground pb-4'>
              <LuLink className='w-4 h-4' />
              <h3 className='font-semibold text-foreground'>
                Top Performing Links
              </h3>
            </div>
            <div className='p-0'>
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
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className='border-b last:border-0'>
                      <td className='p-4'>
                        <Skeleton className='h-4 w-24' />
                      </td>
                      <td className='p-4 hidden md:table-cell'>
                        <Skeleton className='h-4 w-32' />
                      </td>
                      <td className='p-4 text-right'>
                        <Skeleton className='h-4 w-8 ml-auto' />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {!isLoading && (
        <>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='p-6 bg-card rounded-xl border shadow-sm'>
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
          <div className='rounded-xl border bg-card shadow-sm overflow-hidden p-6'>
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
                        <td className='p-4 font-medium'>{link.title}</td>
                        <td className='p-4 text-muted-foreground truncate max-w-[200px] hidden md:table-cell'>
                          {link.url}
                        </td>
                        <td className='p-4 text-right font-medium'>
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
