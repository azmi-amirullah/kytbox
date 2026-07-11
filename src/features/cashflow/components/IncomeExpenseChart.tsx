'use client';

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { CashflowChartTooltip } from './CashflowChartTooltip';
import { useContainerSize } from '../lib/useContainerSize';
import type { MonthlyData } from '../lib/aggregateEntries';

interface IncomeExpenseChartProps {
  data: MonthlyData[];
  currency: string | null;
}

export function IncomeExpenseChart({
  data,
  currency,
}: IncomeExpenseChartProps) {
  const [containerRef, width, height] = useContainerSize();

  // Center bars when only 1 data point by adding XAxis padding
  const xPadding =
    data.length === 1 && width > 0 ? Math.floor(width * 0.35) : 0;

  return (
    <div ref={containerRef} className='h-[280px] w-full'>
      {width === 0 || height === 0 ? (
        <div className='h-full w-full flex items-end gap-2 px-2 pt-4'>
          <Skeleton className='flex-1 h-[40%] rounded-t' />
          <Skeleton className='flex-1 h-[65%] rounded-t' />
          <Skeleton className='flex-1 h-[30%] rounded-t' />
          <Skeleton className='flex-1 h-[80%] rounded-t' />
          <Skeleton className='flex-1 h-[50%] rounded-t' />
          <Skeleton className='flex-1 h-[55%] rounded-t' />
        </div>
      ) : (
        <BarChart
          data={data}
          width={width}
          height={height}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          barGap={2}
        >
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
            padding={{ left: xPadding, right: xPadding }}
          />
          <YAxis
            stroke='hsl(var(--muted-foreground))'
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
            }
            width={48}
          />
          <Tooltip
            content={<CashflowChartTooltip currency={currency} />}
            cursor={{ fill: 'transparent' }}
            animationDuration={150}
          />
          <Bar
            dataKey='income'
            name='Income'
            fill='oklch(0.65 0.2 145)'
            radius={[4, 4, 0, 0]}
            barSize={40}
            minPointSize={1}
          />
          <Bar
            dataKey='expense'
            name='Expense'
            fill='oklch(0.65 0.2 25)'
            radius={[4, 4, 0, 0]}
            barSize={40}
            minPointSize={1}
          />
        </BarChart>
      )}
    </div>
  );
}
