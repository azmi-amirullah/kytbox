'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { CashflowChartTooltip } from './CashflowChartTooltip';
import { useContainerSize } from '../lib/useContainerSize';
import type { MonthlyData } from '../lib/aggregateEntries';

interface BalanceTrendChartProps {
  data: MonthlyData[];
  currency: string | null;
}

export function BalanceTrendChart({ data, currency }: BalanceTrendChartProps) {
  const [containerRef, width, height] = useContainerSize();

  const isNegative = data.some((d) => d.balance < 0);

  return (
    <div ref={containerRef} className='h-[280px] w-full'>
      {width === 0 || height === 0 ? (
        <div className='h-full w-full flex flex-col justify-center gap-3 px-2'>
          <Skeleton className='w-full h-[200px] rounded' />
          <Skeleton className='w-3/4 h-3 rounded' />
        </div>
      ) : (
        <AreaChart
          data={data}
          width={width}
          height={height}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id='balanceGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop
                offset='5%'
                stopColor='oklch(0.65 0.18 250)'
                stopOpacity={0.3}
              />
              <stop
                offset='95%'
                stopColor='oklch(0.65 0.18 250)'
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            className='stroke-border'
            strokeDasharray='3 3'
          />
          <XAxis
            dataKey='month'
            stroke='hsl(var(--muted-foreground))'
            fontSize={12}
            tickLine={false}
            axisLine={false}
            minTickGap={8}
          />
          <YAxis
            stroke='hsl(var(--muted-foreground))'
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1000
                ? `${(v / 1000).toFixed(0)}k`
                : v <= -1000
                  ? `${(v / 1000).toFixed(0)}k`
                  : `${v}`
            }
            width={48}
            domain={isNegative ? ['auto', 'auto'] : [0, 'auto']}
          />
          <Tooltip
            content={<CashflowChartTooltip currency={currency} />}
            animationDuration={150}
          />
          <Area
            type='monotone'
            dataKey='balance'
            name='Balance'
            stroke='oklch(0.65 0.18 250)'
            strokeWidth={2}
            fill='url(#balanceGradient)'
            dot={{ r: 3, fill: 'oklch(0.65 0.18 250)' }}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />
        </AreaChart>
      )}
    </div>
  );
}
