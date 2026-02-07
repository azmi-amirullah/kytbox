'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  LuMousePointer2,
  LuActivity,
  LuLink,
  LuGlobe,
  LuEye,
  LuPercent,
} from 'react-icons/lu';
import type { DateRange } from '@/types/analytics';

interface AnalyticsSkeletonProps {
  range?: DateRange;
}

export function AnalyticsSkeleton({ range = '24h' }: AnalyticsSkeletonProps) {
  return (
    <div className='space-y-6'>
      {/* Stats Grid Skeleton */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        <div className='p-6 bg-card rounded-xl border shadow-sm'>
          <div className='flex items-center gap-2 text-muted-foreground mb-2'>
            <LuEye className='w-4 h-4' />
            <span className='text-sm font-medium'>Total Profile Views</span>
          </div>
          <Skeleton className='h-8 w-16 mb-1' />
          <p className='text-xs text-muted-foreground mt-1'>
            In selected period
          </p>
        </div>

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
            <LuPercent className='w-4 h-4' />
            <span className='text-sm font-medium'>CTR</span>
          </div>
          <Skeleton className='h-8 w-16 mb-1' />
          <p className='text-xs text-muted-foreground mt-1'>
            Click-through rate
          </p>
        </div>

        <div className='p-6 bg-card rounded-xl border shadow-sm'>
          <div className='flex items-center gap-2 text-muted-foreground mb-2'>
            <LuGlobe className='w-4 h-4' />
            <span className='text-sm font-medium'>Top Source</span>
          </div>
          <Skeleton className='h-8 w-24 mb-1' />
          <p className='text-xs text-muted-foreground mt-1'>
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
  );
}
