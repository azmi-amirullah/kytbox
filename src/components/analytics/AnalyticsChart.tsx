'use client';

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

interface ChartData {
  label: string;
  value: number;
}

interface AnalyticsChartProps {
  data: ChartData[];
  title?: string;
  total?: number;
  dateRange?: string;
}

export function AnalyticsChart({
  data,
  title,
  total,
  dateRange,
}: AnalyticsChartProps) {
  return (
    <div className='w-full h-[330px] bg-card border rounded-xl p-6 shadow-sm overflow-hidden'>
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
      <ResponsiveContainer width='100%' height={220}>
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
  );
}
