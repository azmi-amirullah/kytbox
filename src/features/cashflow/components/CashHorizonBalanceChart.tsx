'use client'

import { format } from 'date-fns'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import { CashflowChartTooltip } from './CashflowChartTooltip'
import { getCurrency } from '@/lib/currency'
import { parseDateOnly } from '@/lib/date-only'
import type { DailyBalancePoint } from '../math'

interface CashHorizonBalanceChartProps {
  days: DailyBalancePoint[]
  currency: string | null
  atRiskThreshold: number
}

const chartConfig = {
  balance: {
    label: 'Balance',
    color: 'oklch(0.65 0.18 250)',
  },
} satisfies ChartConfig

export function CashHorizonBalanceChart({
  days,
  currency,
  atRiskThreshold,
}: CashHorizonBalanceChartProps) {
  const currencyObj = getCurrency(currency)

  const data = days.map((day) => ({
    date: format(parseDateOnly(day.date), 'd MMM'),
    balance: day.balance,
  }))
  const lowest = data.reduce(
    (min, point) => Math.min(min, point.balance),
    Number.POSITIVE_INFINITY,
  )

  const formatYAxisTick = (val: number) => {
    if (val === 0) return '0'
    try {
      return new Intl.NumberFormat(currencyObj.locale, {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
      }).format(val)
    } catch {
      return val >= 1000000
        ? `${(val / 1000000).toFixed(1)}M`
        : val >= 1000
          ? `${(val / 1000).toFixed(0)}k`
          : `${val}`
    }
  }

  return (
    <div className='w-full min-w-0'>
      <ChartContainer
        config={chartConfig}
        className='h-40 sm:h-48 w-full aspect-auto'
      >
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{ top: 8, right: 8, left: -4, bottom: 0 }}
        >
          <defs>
            <linearGradient id='horizonGradient' x1='0' y1='0' x2='0' y2='1'>
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
            stroke='var(--color-border)'
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey='date'
            tickLine={false}
            axisLine={false}
            minTickGap={20}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxisTick}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            width={52}
            domain={['auto', 'auto']}
          />
          {lowest <= atRiskThreshold && (
            <ReferenceLine
              y={atRiskThreshold}
              stroke='var(--color-signal)'
              strokeDasharray='5 4'
              strokeWidth={1.5}
              label={{
                value: 'At risk',
                position: 'insideTopLeft',
                fill: 'var(--color-signal)',
                fontSize: 10,
              }}
            />
          )}
          <ChartTooltip
            content={<CashflowChartTooltip currency={currency} />}
            animationDuration={150}
          />
          <Area
            type='monotone'
            dataKey='balance'
            name='balance'
            stroke='var(--color-balance)'
            strokeWidth={2}
            fill='url(#horizonGradient)'
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
