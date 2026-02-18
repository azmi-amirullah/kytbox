import { useState, useEffect } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LuActivity } from 'react-icons/lu';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartData {
  label: string;
  value: number;
}

interface AnalyticsChartProps {
  data: ChartData[];
  title?: string;
  total?: number;
  dateRange?: string;
  isLoading?: boolean;
}

export function AnalyticsChart({
  data,
  title,
  total,
  dateRange,
  isLoading,
}: AnalyticsChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Show chart-area skeleton until mounted AND loading is false
  const showChartSkeleton = isLoading || !mounted;

  return (
    <div className='w-full h-[330px] bg-card border rounded-xl p-6 shadow-sm overflow-hidden'>
      <div className='mb-4'>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <LuActivity className='w-4 h-4' />
            {isLoading ? (
              <Skeleton className='h-4 w-32 rounded' />
            ) : (
              <h3 className='text-sm font-medium'>
                {title || 'Clicks over time'}
              </h3>
            )}
          </div>
          {isLoading ? (
            <Skeleton className='h-4 w-24 rounded' />
          ) : (
            dateRange && (
              <span className='text-sm text-muted-foreground font-medium'>
                {dateRange}
              </span>
            )
          )}
        </div>
        {isLoading ? (
          <Skeleton className='h-8 w-16 rounded mt-1' />
        ) : (
          total !== undefined && (
            <p className='text-2xl font-bold tracking-tight'>
              {total.toLocaleString()}
            </p>
          )
        )}
      </div>

      <div className='h-[220px] w-full'>
        {showChartSkeleton ? (
          <div className='h-full w-full flex items-end gap-2 pt-4 px-2'>
            <Skeleton className='flex-1 h-[40%] rounded-t' />
            <Skeleton className='flex-1 h-[60%] rounded-t' />
            <Skeleton className='flex-1 h-[30%] rounded-t' />
            <Skeleton className='flex-1 h-[80%] rounded-t' />
            <Skeleton className='flex-1 h-[50%] rounded-t' />
            <Skeleton className='flex-1 h-[70%] rounded-t' />
            <Skeleton className='flex-1 h-[45%] rounded-t' />
          </div>
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data}>
              <CartesianGrid vertical={false} className='stroke-border' />
              <XAxis
                dataKey='label'
                stroke='#888888'
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={10}
              />
              <YAxis
                stroke='#888888'
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                animationDuration={100}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className='bg-popover border border-border text-popover-foreground p-3 rounded-lg shadow-md text-sm'>
                        <p className='font-medium mb-1'>{label}</p>
                        <p className='font-bold'>{payload[0].value} Clicks</p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'transparent' }}
              />
              <Bar
                dataKey='value'
                name='Clicks'
                fill='currentColor'
                radius={[4, 4, 0, 0]}
                className='fill-primary'
                maxBarSize={50}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
