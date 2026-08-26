'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
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

interface BalanceTrendChartProps {
  data: MonthlyData[];
  currency: string | null;
}

const chartConfig = {
  balance: {
    label: 'Net Balance',
    color: 'oklch(0.65 0.18 250)',
  },
} satisfies ChartConfig;

export function BalanceTrendChart({ data, currency }: BalanceTrendChartProps) {
  const currencyObj = getCurrency(currency);
  const isNegative = data.some((d) => d.balance < 0);

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
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{ top: 12, right: 12, left: -4, bottom: 0 }}
        >
          <defs>
            <linearGradient id='balanceGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop
                offset='5%'
                stopColor='var(--color-balance)'
                stopOpacity={0.35}
              />
              <stop
                offset='95%'
                stopColor='var(--color-balance)'
                stopOpacity={0.03}
              />
            </linearGradient>
          </defs>
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
            domain={isNegative ? ['auto', 'auto'] : [0, 'auto']}
          />
          <ChartTooltip
            content={<CashflowChartTooltip currency={currency} />}
            animationDuration={150}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            type='monotone'
            dataKey='balance'
            name='balance'
            stroke='var(--color-balance)'
            strokeWidth={2.5}
            fill='url(#balanceGradient)'
            dot={{ r: 3.5, fill: 'var(--color-balance)' }}
            activeDot={{ r: 5.5, strokeWidth: 2 }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
