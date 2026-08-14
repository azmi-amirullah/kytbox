'use client'

import { useMemo } from 'react'
import {
  LuArrowUpRight,
  LuArrowDownRight,
  LuWallet,
  LuTrendingUp,
  LuTrendingDown,
  LuCircleDollarSign,
  LuChartPie,
} from 'react-icons/lu'
import { formatCurrency, formatCurrencyCompact } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface CashflowSummaryStatsProps {
  income: number
  expense: number
  balance: number
  currency: string | null
  className?: string
}

export function getCashflowSummaryRatios(
  income: number,
  expense: number,
  balance: number,
) {
  const expenseRatio = income > 0 ? Math.max(0, (expense / income) * 100) : 0
  const savingsRatio = income > 0 ? ((income - expense) / income) * 100 : 0
  const deficitRatio =
    income > 0 ? Math.max(0, ((expense - income) / income) * 100) : 0
  const isPositiveBalance = balance >= 0

  return {
    expenseRatio,
    savingsRatio,
    deficitRatio,
    isPositiveBalance,
  }
}

export function CashflowSummaryStats({
  income,
  expense,
  balance,
  currency,
  className,
}: CashflowSummaryStatsProps) {
  const stats = useMemo(
    () => getCashflowSummaryRatios(income, expense, balance),
    [income, expense, balance],
  )

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Unified Summary Card */}
      <div className='bg-card border rounded-2xl p-3.5 sm:p-5 shadow-xs transition-all duration-200'>
        {/* Mobile: 2 cols for Income & Expense, Balance on Row 2. Tablet+: 3 equal columns */}
        <div className='grid grid-cols-2 md:grid-cols-3 gap-y-3.5 gap-x-2.5 sm:gap-x-4 md:gap-x-0 md:divide-x divide-border/60'>
          {/* Income Cell */}
          <div className='flex flex-col justify-between pr-2 sm:pr-3 md:pr-4 lg:pr-6'>
            <div className='flex items-center justify-between gap-1 mb-1.5'>
              <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Income
              </span>
              <div className='flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0'>
                <LuArrowUpRight className='w-3.5 h-3.5' />
              </div>
            </div>
            <p
              title={`+${formatCurrency(income, currency)}`}
              className='text-lg sm:text-xl md:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums truncate'
            >
              +{formatCurrencyCompact(income, currency)}
            </p>
            <div className='mt-1.5 flex items-center gap-1 text-[11px] font-medium text-emerald-600/80 dark:text-emerald-400/80 truncate'>
              <LuTrendingUp className='w-3 h-3 shrink-0' />
              <span className='truncate'>Total inflows</span>
            </div>
          </div>

          {/* Expense Cell */}
          <div className='flex flex-col justify-between border-l border-border/40 md:border-l-0 pl-2.5 sm:pl-3 md:px-4 lg:px-6'>
            <div className='flex items-center justify-between gap-1 mb-1.5'>
              <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Expense
              </span>
              <div className='flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0'>
                <LuArrowDownRight className='w-3.5 h-3.5' />
              </div>
            </div>
            <p
              title={`-${formatCurrency(expense, currency)}`}
              className='text-lg sm:text-xl md:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight tabular-nums truncate'
            >
              -{formatCurrencyCompact(expense, currency)}
            </p>
            <div className='mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-600/80 dark:text-rose-400/80 truncate'>
              <LuChartPie className='w-3 h-3 shrink-0' />
              <span className='truncate'>
                {income > 0
                  ? `${stats.expenseRatio.toFixed(1)}% of income`
                  : 'Total outflows'}
              </span>
            </div>
          </div>

          {/* Net Balance Cell (Mobile: Row 2 Spans Full Width with Hero Tint, Tablet+: Column 3) */}
          <div className='col-span-2 md:col-span-1 pt-3 md:pt-0 border-t md:border-t-0 border-border/60 md:pl-4 lg:pl-6 flex flex-col justify-between'>
            <div
              className={cn(
                'rounded-xl p-3 md:p-0 transition-all duration-200',
                stats.isPositiveBalance
                  ? 'bg-emerald-500/5 md:bg-transparent border md:border-0 border-emerald-500/20'
                  : 'bg-rose-500/5 md:bg-transparent border md:border-0 border-rose-500/20',
              )}
            >
              <div className='flex items-center justify-between gap-1 mb-1.5'>
                <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Net Balance
                </span>
                <div
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-lg border shrink-0',
                    stats.isPositiveBalance
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                  )}
                >
                  <LuWallet className='w-3.5 h-3.5' />
                </div>
              </div>
              <div className='flex flex-col items-start'>
                <p
                  title={`${stats.isPositiveBalance ? '+' : ''}${formatCurrency(balance, currency)}`}
                  className={cn(
                    'text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums truncate',
                    stats.isPositiveBalance
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400',
                  )}
                >
                  {stats.isPositiveBalance ? '+' : ''}
                  {formatCurrencyCompact(balance, currency)}
                </p>
                <div
                  className={cn(
                    'mt-1.5 flex items-center gap-1 text-[11px] font-medium truncate',
                    stats.isPositiveBalance
                      ? 'text-emerald-600/80 dark:text-emerald-400/80'
                      : 'text-rose-600/80 dark:text-rose-400/80',
                  )}
                >
                  {stats.isPositiveBalance ? (
                    <LuCircleDollarSign className='w-3 h-3 shrink-0' />
                  ) : (
                    <LuTrendingDown className='w-3 h-3 shrink-0' />
                  )}
                  <span className='truncate'>
                    {income > 0
                      ? stats.isPositiveBalance
                        ? `${stats.savingsRatio.toFixed(1)}% saved`
                        : `${stats.deficitRatio.toFixed(1)}% deficit`
                      : stats.isPositiveBalance
                        ? 'Positive'
                        : 'Deficit'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
