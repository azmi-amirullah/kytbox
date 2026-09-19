'use client'

import { useState, useMemo } from 'react'
import {
  LuFlame,
  LuClock,
  LuShieldCheck,
  LuTriangleAlert,
  LuTrendingUp,
  LuTrendingDown,
  LuCalendar,
  LuInfo,
} from 'react-icons/lu'
import {
  calculateRunway,
  type TrailingWindowDays,
  type RunwayResult,
} from '../lib/runway'
import type { CashflowEntryDTO } from '@/types/dto'
import { formatCurrency } from '@/lib/currency'
import { formatAppDate } from '@/lib/date-only'
import { cn } from '@/lib/utils'

interface RunwayCardProps {
  balance: number
  entries: CashflowEntryDTO[]
  currency: string | null
  className?: string
}

export function RunwayCard({
  balance,
  entries,
  currency,
  className,
}: RunwayCardProps) {
  const [windowDays, setWindowDays] = useState<TrailingWindowDays>(90)
  const [showExplanation, setShowExplanation] = useState(false)

  const runwayData: RunwayResult = useMemo(() => {
    return calculateRunway({
      balance,
      entries,
      windowDays,
    })
  }, [balance, entries, windowDays])

  // Badge metadata based on status
  const badgeConfig = useMemo(() => {
    switch (runwayData.status) {
      case 'profitable':
        return {
          label: 'Cashflow Positive',
          icon: LuTrendingUp,
          borderClass: 'border-indigo-500/30 dark:border-indigo-500/20',
          stripeClass: 'bg-indigo-500',
          badgeClass:
            'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        }
      case 'healthy':
        return {
          label: 'Healthy Runway (6+ Mo)',
          icon: LuShieldCheck,
          borderClass: 'border-emerald-500/30 dark:border-emerald-500/20',
          stripeClass: 'bg-emerald-500',
          badgeClass:
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        }
      case 'moderate':
        return {
          label: 'Moderate Runway (3–6 Mo)',
          icon: LuClock,
          borderClass: 'border-amber-500/40 dark:border-amber-500/30',
          stripeClass: 'bg-amber-500',
          badgeClass:
            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        }
      case 'critical':
        return {
          label: 'Critical Runway (< 3 Mo)',
          icon: LuTriangleAlert,
          borderClass: 'border-rose-500/40 dark:border-rose-500/30',
          stripeClass: 'bg-rose-500',
          badgeClass:
            'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        }
      case 'depleted':
      default:
        return {
          label: 'Balance Depleted',
          icon: LuFlame,
          borderClass: 'border-destructive/40',
          stripeClass: 'bg-destructive',
          badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
        }
    }
  }, [runwayData.status])

  const BadgeIcon = badgeConfig.icon

  return (
    <div
      className={cn(
        'w-full @container bg-card border rounded-2xl p-4 sm:p-5 shadow-xs transition-all relative overflow-hidden',
        badgeConfig.borderClass,
        className,
      )}
    >
      {/* Top Accent Stripe */}
      <div
        className={cn('absolute top-0 left-0 right-0 h-1', badgeConfig.stripeClass)}
      />

      {/* Header & Window Pill Controls */}
      <div className='flex flex-col @sm:flex-row @sm:items-center justify-between gap-3 mb-4'>
        <div className='flex items-center gap-2 flex-wrap'>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
              badgeConfig.badgeClass,
            )}
          >
            <BadgeIcon className='w-3.5 h-3.5 shrink-0' />
            <span>{badgeConfig.label}</span>
          </span>

          <span className='text-xs text-muted-foreground flex items-center gap-1'>
            <LuClock className='w-3 h-3' />
            Trailing {windowDays}-Day Avg
          </span>
        </div>

        {/* Window Selector Tabs */}
        <div
          role='radiogroup'
          aria-label='Trailing window duration'
          className='inline-flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/50 text-xs font-medium self-start @sm:self-auto'
        >
          {([30, 60, 90] as const).map((days) => {
            const isSelected = windowDays === days
            return (
              <button
                key={days}
                type='button'
                role='radio'
                aria-checked={isSelected}
                onClick={() => setWindowDays(days)}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer',
                  isSelected
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {days}D
              </button>
            )
          })}
        </div>
      </div>

      {/* Hero Metric: Runway Clock */}
      <div className='grid grid-cols-1 @md:grid-cols-3 gap-4 items-start'>
        <div className='@md:col-span-1 border-b @md:border-b-0 @md:border-r border-border/60 pb-3 @md:pb-0 @md:pr-4'>
          <span className='text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1'>
            Survival Runway (Zero Revenue)
          </span>

          <div className='flex items-baseline gap-2'>
            {Number.isFinite(runwayData.zeroIncomeRunwayMonths) ? (
              <>
                <span className='text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono'>
                  {runwayData.zeroIncomeRunwayMonths}
                </span>
                <span className='text-sm sm:text-base font-medium text-muted-foreground'>
                  Months
                </span>
                <span className='text-xs text-muted-foreground/80 font-mono'>
                  ({runwayData.zeroIncomeRunwayDays} days)
                </span>
              </>
            ) : (
              <span className='text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400'>
                ∞ Indefinite
              </span>
            )}
          </div>

          {runwayData.projectedZeroDate && (
            <p className='text-xs text-muted-foreground mt-1.5 flex items-center gap-1'>
              <LuCalendar className='w-3 h-3 shrink-0' />
              Zero balance by{' '}
              <span className='font-semibold text-foreground'>
                {formatAppDate(runwayData.projectedZeroDate)}
              </span>
            </p>
          )}
        </div>

        {/* Secondary Metric Grid */}
        <div className='@md:col-span-2 grid grid-cols-1 @xs:grid-cols-2 gap-3 sm:gap-4'>
          {/* Gross Monthly Burn */}
          <div className='bg-muted/30 border border-border/50 rounded-xl p-3'>
            <div className='flex items-center justify-between text-xs text-muted-foreground mb-1'>
              <span className='font-medium'>Monthly Gross Burn</span>
              <LuFlame className='w-3.5 h-3.5 text-rose-500' />
            </div>
            <div className='text-lg font-bold text-foreground font-mono'>
              {formatCurrency(runwayData.monthlyGrossBurn, currency)}
            </div>
            <span className='text-[11px] text-muted-foreground'>
              ~{formatCurrency(runwayData.dailyGrossBurn, currency)}/day spent
            </span>
          </div>

          {/* Net Cash Flow / Burn Rate */}
          <div className='bg-muted/30 border border-border/50 rounded-xl p-3'>
            <div className='flex items-center justify-between text-xs text-muted-foreground mb-1'>
              <span className='font-medium'>Monthly Net Flow</span>
              {runwayData.isProfitable ? (
                <LuTrendingUp className='w-3.5 h-3.5 text-emerald-500' />
              ) : (
                <LuTrendingDown className='w-3.5 h-3.5 text-amber-500' />
              )}
            </div>
            <div
              className={cn(
                'text-lg font-bold font-mono',
                runwayData.isProfitable
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400',
              )}
            >
              {runwayData.isProfitable ? '+' : '-'}
              {formatCurrency(Math.abs(runwayData.monthlyNetBurn), currency)}
            </div>
            <span className='text-[11px] text-muted-foreground'>
              {runwayData.isProfitable
                ? 'Income exceeds expenses'
                : 'Deficit / month'}
            </span>
          </div>
        </div>
      </div>

      {/* Explanatory Drawer / Footer */}
      <div className='mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground'>
        <button
          type='button'
          onClick={() => setShowExplanation(!showExplanation)}
          className='inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
        >
          <LuInfo className='w-3.5 h-3.5' />
          <span>How is runway calculated?</span>
        </button>

        <span className='text-[11px] text-muted-foreground/70'>
          Based on {runwayData.entryCount} entries
        </span>
      </div>

      {showExplanation && (
        <div className='mt-2.5 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-1 animate-in fade-in duration-150'>
          <p>
            • <strong>Survival Runway</strong> answers:{' '}
            <em>
              &ldquo;If all income stopped today, how many months would current settled
              cash last?&rdquo;
            </em>{' '}
            Computed as <code>Liquid Balance ÷ Monthly Gross Burn</code>.
          </p>
          <p>
            • <strong>Gross Burn</strong> reflects your true lifestyle cost
            averaged over the selected trailing window ({windowDays} days).
          </p>
          <p>
            • <strong>Monthly Net Flow</strong> compares actual trailing income
            vs. expenses to show whether you are building or depleting reserves.
          </p>
        </div>
      )}
    </div>
  )
}
