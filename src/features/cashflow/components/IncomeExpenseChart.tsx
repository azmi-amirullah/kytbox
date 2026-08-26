'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { CashflowChartTooltip } from './CashflowChartTooltip';
import type { MonthlyData } from '../lib/aggregateEntries';
import { getCurrency } from '@/lib/currency';

interface IncomeExpenseChartProps {
  data: MonthlyData[];
  currency: string | null;
}

const chartConfig = {
  income: {
    label: 'Income',
    color: 'oklch(0.62 0.17 145)',
  },
  expense: {
    label: 'Expense',
    color: 'oklch(0.62 0.19 25)',
  },
} satisfies ChartConfig;

export function IncomeExpenseChart({
  data,
  currency,
}: IncomeExpenseChartProps) {
  const currencyObj = getCurrency(currency);

  const formatYAxisTick = (val: number) => {
    if (val === 0) return '0';
    try {
      return new Intl.NumberFormat(currencyObj.locale, {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
      }).format(val);
    } catch {
      return val >= 1000000
        ? `${(val / 1000000).toFixed(1)}M`
        : val >= 1000
          ? `${(val / 1000).toFixed(0)}k`
          : `${val}`;
    }
  };

  return (
    <div className='w-full'>
      <ChartContainer
        config={chartConfig}
        className='h-72 sm:h-80 w-full aspect-auto'
      >
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ top: 12, right: 12, left: -4, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray='3 3'
            className='stroke-border/60'
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
            tickFormatter={formatYAxisTick}
            width={52}
          />
          <ChartTooltip
            content={<CashflowChartTooltip currency={currency} />}
            cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
            animationDuration={150}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey='income'
            name='income'
            fill='var(--color-income)'
            radius={[4, 4, 0, 0]}
            maxBarSize={38}
            minPointSize={1}
          />
          <Bar
            dataKey='expense'
            name='expense'
            fill='var(--color-expense)'
            radius={[4, 4, 0, 0]}
            maxBarSize={38}
            minPointSize={1}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
