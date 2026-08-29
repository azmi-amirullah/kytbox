'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import type { ComponentType } from 'react';
import {
  LuMousePointer2,
  LuLink,
  LuChevronDown,
  LuGlobe,
  LuEye,
  LuPercent,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader } from '@/components/ui/loader';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import {
  DateRangePicker,
  getDateRangeLabel,
} from '@/components/analytics/DateRangePicker';
import type { DateRange, AnalyticsData } from '@/types/analytics';
import type { CustomThemeData } from '@/lib/theme';
import { getAnalyticsData } from '../actions';
import StatsCard from './StatsCard';
import CountryBreakdown from './CountryBreakdown';

export interface AnalyticsShareCardProps {
  data: AnalyticsData;
  username: string;
  themeName?: string | null;
  customTheme?: CustomThemeData | null;
  dateRange: DateRange;
  isDisabled?: boolean;
}

interface AnalyticsClientProps {
  initialData: AnalyticsData;
  isLoading?: boolean;
  username?: string;
  themeName?: string | null;
  customTheme?: CustomThemeData | null;
  shareCardGenerator?: ComponentType<AnalyticsShareCardProps>;
}

export default function AnalyticsClient({
  initialData,
  isLoading,
  username,
  themeName,
  customTheme,
  shareCardGenerator,
}: AnalyticsClientProps) {
  const [range, setRange] = useState<DateRange>('24h');
  const [selectedLink, setSelectedLink] = useState<string>('all');
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  // Combined loading state for initial load or filter transitions
  const isActuallyLoading = isLoading || isPending;

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
  const countries = data.countries || [];
  const ShareCard = shareCardGenerator;

  return (
    <div className='space-y-4 md:space-y-6'>
      {/* Header + Actions */}
      <div className='flex flex-col gap-4 md:gap-6'>
        <div className='space-y-1.5 sm:space-y-2'>
          <BreadcrumbNav
            items={[
              { label: 'Bio', href: '/bio' },
              { label: 'Analytics' },
            ]}
          />
          <div>
            <h1 className='text-2xl md:text-3xl font-bold tracking-tight'>
              Analytics
            </h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Track your link performance and audience engagement.
            </p>
          </div>
        </div>

        <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
          {ShareCard && username ? (
            <ShareCard
              data={data}
              username={username}
              themeName={themeName}
              customTheme={customTheme}
              dateRange={range}
              isDisabled={isActuallyLoading}
            />
          ) : null}
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto w-full sm:w-auto'>
            {/* Link Filter */}
            <div className='w-full sm:w-55'>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    disabled={isActuallyLoading}
                    className='w-full justify-between bg-background dark:bg-background disabled:opacity-100 disabled:text-muted-foreground'
                  >
                    <span className='truncate'>
                      {selectedLink === 'all'
                        ? 'All Links'
                        : userLinks.find(
                            (l: { id: string }) => l.id === selectedLink,
                          )?.title || 'Filter by link'}
                    </span>
                    <LuChevronDown className='ml-2 h-4 w-4 opacity-50 shrink-0' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-[calc(100vw-32px)] sm:w-55'
                  align='end'
                >
                  <DropdownMenuItem
                    className='cursor-pointer'
                    onClick={() => setSelectedLink('all')}
                  >
                    All Links
                  </DropdownMenuItem>
                  {userLinks.map((link: { id: string; title: string }) => (
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
              disabled={isActuallyLoading}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
        <StatsCard
          label='Total Profile Views'
          value={totalViews}
          icon={LuEye}
          isLoading={isActuallyLoading}
          hideSecondaryIcon={true}
          description={range === 'lifetime' ? 'All time' : 'In selected period'}
        />
        <StatsCard
          label='Total Clicks'
          value={totalClicks}
          icon={LuMousePointer2}
          isLoading={isActuallyLoading}
          hideSecondaryIcon={true}
          description={range === 'lifetime' ? 'All time' : 'In selected period'}
        />
        <StatsCard
          label='CTR'
          value={`${ctr.toFixed(1)}%`}
          icon={LuPercent}
          isLoading={isActuallyLoading}
          hideSecondaryIcon={true}
          description='Click-through rate'
        />
        <StatsCard
          label='Top Source'
          value={topReferer}
          icon={LuGlobe}
          isLoading={isActuallyLoading}
          hideSecondaryIcon={true}
          description='Most traffic from'
        />
        <StatsCard
          label='Average'
          value={
            chartData.length > 0
              ? Math.round(totalClicks / chartData.length)
              : 0
          }
          icon={LuMousePointer2}
          isLoading={isActuallyLoading}
          hideSecondaryIcon={true}
          description={
            range === '24h'
              ? 'Per hour'
              : range === 'lifetime'
                ? 'Per month'
                : 'Per day'
          }
        />
      </div>

      {/* Main Chart */}
      <AnalyticsChart
        data={chartData}
        title='Click Activity'
        isLoading={isActuallyLoading}
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

      {/* Grid for Top Links and Geography */}
      <div className='grid gap-4 md:gap-6 lg:grid-cols-2 items-stretch'>
        {/* Top Links Table */}
        <div className='rounded-xl border bg-card shadow-sm overflow-hidden p-4 md:p-6 flex flex-col h-full'>
          <div className='border-b flex items-center gap-2 text-muted-foreground pb-4 mb-4'>
            <LuLink className='w-4 h-4' />
            <h3 className='font-semibold text-foreground'>
              Top Performing Links
            </h3>
          </div>
          <div className='p-0 flex-1'>
            {isActuallyLoading ? (
              <div className='py-8 flex items-center justify-center'>
                <Loader size='md' className='py-0 min-h-0' text='Loading analytics...' />
              </div>
            ) : topLinks.length === 0 ? (
              <div className='p-6 text-center text-muted-foreground flex items-center justify-center h-full'>
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
                  {topLinks.map(
                    (link: {
                      id: string;
                      title: string;
                      url: string;
                      clicks: number;
                    }) => (
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
                        <td className='p-3 md:p-4 text-muted-foreground truncate max-w-50 hidden md:table-cell'>
                          {link.url}
                        </td>
                        <td className='p-3 md:p-4 text-right font-medium'>
                          {link.clicks}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Visitor Geography */}
        <CountryBreakdown countries={countries} isLoading={isActuallyLoading} />
      </div>
    </div>
  );
}
