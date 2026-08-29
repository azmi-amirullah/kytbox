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
import { Loader } from '@/components/ui/loader';

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

  if (isLoading || !mounted) {
    return (
      <div className='w-full h-82.5 bg-card border rounded-xl p-6 shadow-sm flex items-center justify-center'>
        <Loader size='md' className='py-0 min-h-0' text='Loading analytics...' />
      </div>
    );
  }

  return (
    <div className='w-full h-82.5 bg-card border rounded-xl p-6 shadow-sm overflow-hidden'>
      <div className='mb-4'>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <LuActivity className='w-4 h-4' />
            <h3 className='text-sm font-medium'>
              {title || 'Clicks over time'}
            </h3>
          </div>
          {dateRange && (
            <span className='text-sm text-muted-foreground font-medium'>
              {dateRange}
            </span>
          )}
        </div>
        {total !== undefined && (
          <p className='text-2xl font-bold tracking-tight'>
            {total.toLocaleString()}
          </p>
        )}
      </div>

      <div className='h-55 w-full min-w-0'>
        <ResponsiveContainer
          width='100%'
          height='100%'
          minWidth={0}
          initialDimension={{ width: 320, height: 200 }}
        >
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
              />
            </BarChart>
          </ResponsiveContainer>
      </div>
    </div>
  );
}
