'use client'

import { useMemo } from 'react'
import {
  LuArrowUpRight,
  LuArrowDownRight,
  LuTrendingUp,
  LuTrendingDown,
  LuWallet,
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
  const expenseRatio = income > 0 ? (expense / income) * 100 : 0
  const savingsRatio = income > 0 ? ((income - expense) / income) * 100 : 0
  const deficitRatio =
    income > 0 && expense > income ? ((expense - income) / income) * 100 : 0
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

  const isDeficit = expense > income
  const isPositive = balance > 0

  const statusBadge = (
    <>
      {income > 0 ? (
        isDeficit ? (
          <div className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0'>
            <LuTrendingDown className='w-3.5 h-3.5' />
            <span>{stats.deficitRatio.toFixed(1)}% deficit</span>
          </div>
        ) : (
          <div className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0'>
            <LuTrendingUp className='w-3.5 h-3.5' />
            <span>{stats.savingsRatio.toFixed(1)}% saved</span>
          </div>
        )
      ) : (
        <div className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border shrink-0'>
          <span>{isDeficit ? 'Deficit' : 'Break-even'}</span>
        </div>
      )}
    </>
  )

  return (
    <div className={cn('w-full', className)}>
      <div className='relative overflow-hidden bg-card border rounded-2xl p-4 sm:p-5 shadow-xs transition-all'>
        {/* Top Accent Stripe */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-1',
            isDeficit
              ? 'bg-rose-500'
              : isPositive
                ? 'bg-emerald-500'
                : 'bg-border',
          )}
        />

        {/* Mobile View: Stacked (< md) */}
        <div className='flex flex-col gap-3.5 md:hidden'>
          {/* Header Row */}
          <div className='flex items-end justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-1.5 mb-1'>
                <LuWallet className='w-3.5 h-3.5 text-muted-foreground' />
                <span className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
                  Total Net Balance
                </span>
              </div>
              <p
                title={`${isPositive ? '+' : ''}${formatCurrency(balance, currency)}`}
                className={cn(
                  'text-2xl sm:text-3xl font-bold tracking-tight tabular-nums truncate',
                  isDeficit
                    ? 'text-rose-600 dark:text-rose-400'
                    : isPositive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-foreground',
                )}
              >
                {isPositive ? '+' : ''}
                {formatCurrencyCompact(balance, currency)}
              </p>
            </div>
            <div className='shrink-0 pb-0.5'>{statusBadge}</div>
          </div>

          {/* Dual Inflow / Outflow Row */}
          <div className='grid grid-cols-2 gap-2.5'>
            <div className='flex flex-col justify-between p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15'>
              <div className='flex items-center justify-between gap-1 mb-1'>
                <span className='text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider'>
                  Total Inflows
                </span>
                <LuArrowUpRight className='w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0' />
              </div>
              <p
                title={`+${formatCurrency(income, currency)}`}
                className='text-base sm:text-lg font-semibold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums truncate'
              >
                +{formatCurrencyCompact(income, currency)}
              </p>
            </div>

            <div className='flex flex-col justify-between p-3 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15'>
              <div className='flex items-center justify-between gap-1 mb-1'>
                <span className='text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider'>
                  Total Outflows
                </span>
                <LuArrowDownRight className='w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0' />
              </div>
              <p
                title={`-${formatCurrency(expense, currency)}`}
                className='text-base sm:text-lg font-semibold text-rose-600 dark:text-rose-400 tracking-tight tabular-nums truncate'
              >
                -{formatCurrencyCompact(expense, currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop View: Unified 3-Column Grid (md+) */}
        <div className='hidden md:grid md:grid-cols-3 divide-x divide-border/60 items-center'>
          {/* Col 1: Net Balance */}
          <div className='flex flex-col justify-between pr-4 lg:pr-6'>
            <div className='flex items-center gap-1.5 mb-1'>
              <LuWallet className='w-3.5 h-3.5 text-muted-foreground' />
              <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Total Net Balance
              </span>
            </div>
            <div className='flex items-baseline gap-2.5 flex-wrap'>
              <p
                title={`${isPositive ? '+' : ''}${formatCurrency(balance, currency)}`}
                className={cn(
                  'text-xl lg:text-2xl font-bold tracking-tight tabular-nums truncate',
                  isDeficit
                    ? 'text-rose-600 dark:text-rose-400'
                    : isPositive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-foreground',
                )}
              >
                {isPositive ? '+' : ''}
                {formatCurrencyCompact(balance, currency)}
              </p>
              {statusBadge}
            </div>
          </div>

          {/* Col 2: Total Inflows */}
          <div className='flex flex-col justify-between px-4 lg:px-6'>
            <div className='flex items-center justify-between gap-1 mb-1'>
              <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Total Inflows
              </span>
              <div className='flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0'>
                <LuArrowUpRight className='w-3.5 h-3.5' />
              </div>
            </div>
            <p
              title={`+${formatCurrency(income, currency)}`}
              className='text-xl lg:text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums truncate'
            >
              +{formatCurrencyCompact(income, currency)}
            </p>
          </div>

          {/* Col 3: Total Outflows */}
          <div className='flex flex-col justify-between pl-4 lg:pl-6'>
            <div className='flex items-center justify-between gap-1 mb-1'>
              <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Total Outflows
              </span>
              <div className='flex items-center justify-center w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0'>
                <LuArrowDownRight className='w-3.5 h-3.5' />
              </div>
            </div>
            <p
              title={`-${formatCurrency(expense, currency)}`}
              className='text-xl lg:text-2xl font-semibold text-rose-600 dark:text-rose-400 tracking-tight tabular-nums truncate'
            >
              -{formatCurrencyCompact(expense, currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
