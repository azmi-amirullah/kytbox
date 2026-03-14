'use client';

import { useMemo } from 'react';
import type { CashflowEntryDTO } from '@/types/dto';
import { calculateProjections } from '@/lib/cashflow-math';
import { formatCurrencyCompact } from '@/lib/currency';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LuTrendingUp,
  LuTrendingDown,
  LuCalendarClock,
  LuInfo,
  LuArrowRight,
} from 'react-icons/lu';

interface ProjectionsViewProps {
  entries: CashflowEntryDTO[];
  currency: string | null;
}

export function ProjectionsView({ entries, currency }: ProjectionsViewProps) {
  const {
    settledCash,
    upcomingMonthlyExpenses,
    upcomingMonthlyIncome,
    projectedResult,
    recurringItems,
    nextMonthName,
  } = useMemo(() => calculateProjections(entries), [entries]);

  if (recurringItems.length === 0) return null;

  return (
    <Card className='border-border/50 shadow-sm bg-linear-to-br from-muted/50 to-white dark:from-muted/20 dark:to-background overflow-hidden gap-0'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-bold flex items-center gap-2'>
            <div className='p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg'>
              <LuCalendarClock className='text-emerald-600 dark:text-emerald-400 w-5 h-5' />
            </div>
            Smart Cash Projection (End of {nextMonthName})
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Badge
              variant='secondary'
              className='bg-emerald-500/5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/10 font-semibold'
            >
              {recurringItems.length} Recurring Item
              {recurringItems.length !== 1 && 's'}
            </Badge>
          </div>
        </div>
        <CardDescription className='flex items-center gap-1.5 text-[11px] text-muted-foreground/80'>
          <LuInfo className='w-3.5 h-3.5 shrink-0 opacity-70' />
          <span>
            Calculates your true available cash through the end of next month by
            factoring in recurring subscriptions, bills, and expected income.
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* The Calculation Flow */}
        <div className='flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 mb-6 md:border md:border-border/50 md:bg-muted/20 md:dark:bg-muted/10 md:rounded-xl md:p-4'>
          {/* Baseline (Settled Cash) */}
          <div className='flex items-center justify-between md:flex-col md:items-start md:flex-1 p-4 bg-muted/25 dark:bg-muted/10 rounded-xl border border-border/50 md:bg-transparent md:border-0 md:p-0 md:rounded-none'>
            <p className='text-[10px] font-bold text-muted-foreground uppercase'>
              Settled Cash (Today)
            </p>
            <p className='text-lg font-bold text-foreground'>
              {formatCurrencyCompact(settledCash, currency)}
            </p>
          </div>

          <LuArrowRight className='text-muted-foreground w-4 h-4 hidden md:block shrink-0' />

          {/* Outflows */}
          <div className='flex items-center justify-between md:flex-col md:items-center md:flex-1 p-4 bg-muted/25 dark:bg-muted/10 rounded-xl border border-border/50 md:bg-transparent md:border-0 md:p-0 md:rounded-none'>
            <p className='text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-100 dark:border-red-900/30'>
              <LuTrendingDown className='w-3 h-3' /> Outflows
            </p>
            <p className='text-lg font-semibold text-red-600 dark:text-red-400'>
              -{formatCurrencyCompact(upcomingMonthlyExpenses, currency)}
            </p>
          </div>

          <span className='text-muted-foreground font-bold hidden md:block shrink-0'>
            +
          </span>

          {/* Inflows */}
          <div className='flex items-center justify-between md:flex-col md:items-center md:flex-1 p-4 bg-muted/25 dark:bg-muted/10 rounded-xl border border-border/50 md:bg-transparent md:border-0 md:p-0 md:rounded-none'>
            <p className='text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100 dark:border-emerald-900/30'>
              <LuTrendingUp className='w-3 h-3' /> Inflows
            </p>
            <p className='text-lg font-semibold text-emerald-600 dark:text-emerald-400'>
              +{formatCurrencyCompact(upcomingMonthlyIncome, currency)}
            </p>
          </div>

          <span className='text-muted-foreground font-bold hidden md:block shrink-0'>
            =
          </span>

          {/* Estimated Result */}
          <div className='flex items-center justify-between md:flex-col md:items-end md:flex-1 p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/20 md:bg-transparent md:border-0 md:p-0 md:rounded-none'>
            <p className='text-[10px] font-bold text-muted-foreground uppercase'>
              Estimated Result
            </p>
            <div className='flex items-baseline gap-2'>
              <p
                className={`text-xl font-bold ${projectedResult >= 0 ? 'text-foreground' : 'text-red-500'}`}
              >
                {formatCurrencyCompact(projectedResult, currency)}
              </p>
              {projectedResult < 0 && (
                <span className='text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded shadow-sm'>
                  Risk
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Window Breakdown Section */}
        <div className='border-t border-border/50 pt-5 mt-2'>
          <div className='flex items-center justify-between mb-4'>
            <p className='text-sm font-semibold text-muted-foreground tracking-tight'>
              Top 4 Contributors (Recurring)
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
            {recurringItems.slice(0, 4).map((item, idx) => {
              const isExactYearly =
                item.recurrence_interval === 'yearly' &&
                item.yearly_calculation === 'exact';
              const hasNoImpact = item.projectedAmount === 0;

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className='flex items-center justify-between bg-white dark:bg-muted/20 border border-border/60 hover:border-primary/30 transition-all rounded-xl p-3 group shadow-xs'
                >
                  <div className='flex flex-col'>
                    <span className='text-xs font-bold truncate max-w-[140px] text-foreground/90'>
                      {item.description}
                    </span>
                    <span className='text-[10px] text-muted-foreground/80 font-medium capitalize'>
                      {item.recurrence_interval}{' '}
                      {isExactYearly && hasNoImpact && '• Not Due'}
                    </span>
                  </div>
                  <div className='flex flex-col items-end'>
                    <span
                      className={`text-xs font-black ${item.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}
                    >
                      {item.type === 'expense' ? '-' : '+'}
                      {formatCurrencyCompact(
                        item.recurrence_interval === 'monthly' ||
                          item.yearly_calculation === 'prorated' ||
                          !item.yearly_calculation
                          ? item.monthlyEquivalent
                          : item.projectedAmount,
                        currency,
                      )}
                    </span>
                    <span className='text-[9px] font-bold text-muted-foreground/60'>
                      {item.recurrence_interval === 'monthly' ||
                      (item.recurrence_interval === 'yearly' &&
                        (item.yearly_calculation === 'prorated' ||
                          !item.yearly_calculation))
                        ? '/mo'
                        : 'Anniv.'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
