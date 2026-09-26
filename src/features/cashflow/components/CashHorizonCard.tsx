'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import {
  LuArrowDownRight,
  LuArrowUpRight,
  LuCalendar,
  LuCalendarDays,
  LuCheck,
  LuChevronLeft,
  LuChevronRight,
  LuTrendingDown,
  LuTriangleAlert,
  LuWallet,
} from 'react-icons/lu'
import {
  calculateDailyBalanceProjection,
  formatMonthLabel,
  type DailyBalanceEvent,
} from '../math'
import { addEntry } from '../actions'
import type { CashflowEntryDTO, CashflowRecurringRuleDTO } from '@/types/dto'
import { formatCurrency } from '@/lib/currency'
import {
  formatAppDate,
  parseDateOnly,
  toLocalDateOnlyString,
} from '@/lib/date-only'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CashHorizonBalanceChart } from './CashHorizonBalanceChart'
import { CashHorizonCalendar } from './CashHorizonCalendar'

const AT_RISK_THRESHOLD = 0

interface CashHorizonCardProps {
  cashflowId: string
  entries: CashflowEntryDTO[]
  recurringRules: CashflowRecurringRuleDTO[]
  currency: string | null
  canEdit: boolean
  onEntryCreated?: (entry: CashflowEntryDTO | null) => void
  className?: string
}

function HorizonStat({
  label,
  value,
  caption,
  icon,
  tone = 'default',
}: {
  label: string
  value: string
  caption: string
  icon: ReactNode
  tone?: 'default' | 'positive' | 'negative'
}) {
  return (
    <div className='min-w-0 rounded-xl border border-border/50 bg-muted/30 p-3'>
      <div className='mb-1 flex items-center justify-between gap-1'>
        <span className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
          {label}
        </span>
        <span className='shrink-0 text-muted-foreground' aria-hidden='true'>
          {icon}
        </span>
      </div>
      <p
        className={cn(
          'truncate text-base font-bold tabular-nums',
          tone === 'positive'
            ? 'text-emerald-600 dark:text-emerald-400'
            : tone === 'negative'
              ? 'text-destructive'
              : 'text-foreground',
        )}
      >
        {value}
      </p>
      <p className='mt-0.5 truncate text-[11px] text-muted-foreground'>
        {caption}
      </p>
    </div>
  )
}

export function CashHorizonCard({
  cashflowId,
  entries,
  recurringRules,
  currency,
  canEdit,
  onEntryCreated,
  className,
}: CashHorizonCardProps) {
  const [referenceDate] = useState(() => new Date())
  const [viewMonth, setViewMonth] = useState(() =>
    toLocalDateOnlyString(referenceDate).slice(0, 7),
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [markingEventId, setMarkingEventId] = useState<string | null>(null)

  const currentMonthKey = toLocalDateOnlyString(referenceDate).slice(0, 7)

  const { rangeStart, rangeEnd } = useMemo(() => {
    const monthStart = parseDateOnly(`${viewMonth}-01`)
    return {
      rangeStart: toLocalDateOnlyString(monthStart),
      rangeEnd: toLocalDateOnlyString(
        new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0),
      ),
    }
  }, [viewMonth])

  const projection = useMemo(
    () =>
      calculateDailyBalanceProjection({
        entries,
        recurringRules,
        rangeStart,
        rangeEnd,
        referenceDate,
        atRiskThreshold: AT_RISK_THRESHOLD,
      }),
    [entries, recurringRules, rangeStart, rangeEnd, referenceDate],
  )

  const selectedDay = useMemo(
    () => projection.days.find((day) => day.date === selectedDate) ?? null,
    [projection.days, selectedDate],
  )

  const firstAtRiskDate = projection.atRiskDates[0]
  const isCurrentMonth = viewMonth === currentMonthKey

  const nextIncomeDay = useMemo(() => {
    if (!projection.nextIncomeDate) return null
    return (
      projection.days.find((day) => day.date === projection.nextIncomeDate) ??
      null
    )
  }, [projection.days, projection.nextIncomeDate])

  const nextIncomeAmount =
    nextIncomeDay === null
      ? 0
      : nextIncomeDay.events.reduce(
          (sum, event) =>
            event.type === 'income' ? sum + event.amount : sum,
          0,
        )

  const shiftViewMonth = (delta: number) => {
    const monthStart = parseDateOnly(`${viewMonth}-01`)
    const shifted = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + delta,
      1,
    )
    setViewMonth(toLocalDateOnlyString(shifted).slice(0, 7))
  }

  async function handleMarkAsPaid(event: DailyBalanceEvent) {
    if (!selectedDate) return
    const day = projection.days.find((item) => item.date === selectedDate)
    const rule = recurringRules.find((item) => item.id === event.id)
    if (!day || !rule) return

    setMarkingEventId(event.id)
    try {
      const formData = new FormData()
      formData.append('cashflowId', cashflowId)
      formData.append('description', rule.description)
      formData.append('amount', String(rule.amount))
      formData.append('type', rule.type)
      if (rule.category) formData.append('category', rule.category)
      if (rule.goal_id) formData.append('goalId', rule.goal_id)
      formData.append('date', day.date)
      formData.append('is_recurring', 'true')
      formData.append('recurring_rule_id', rule.id)
      formData.append('recurrence_interval', rule.recurrence_interval)
      if (rule.yearly_calculation) {
        formData.append('yearly_calculation', rule.yearly_calculation)
      }

      const result = await addEntry(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${rule.description} posted for ${formatAppDate(day.date)}`)
        onEntryCreated?.(result.entry ?? null)
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to post the entry'
      toast.error(message)
    } finally {
      setMarkingEventId(null)
    }
  }

  return (
    <div
      className={cn(
        'w-full @container bg-card border rounded-2xl p-4 sm:p-5 shadow-xs transition-all relative overflow-hidden',
        projection.atRiskDates.length > 0
          ? 'border-destructive/40 dark:border-destructive/30'
          : 'border-emerald-500/30 dark:border-emerald-500/20',
        className,
      )}
    >
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1',
          projection.atRiskDates.length > 0 ? 'bg-destructive' : 'bg-emerald-500',
        )}
        aria-hidden='true'
      />

      {/* Header & Month Navigation */}
      <div className='flex flex-col @sm:flex-row @sm:items-center justify-between gap-3 mb-4'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2 flex-wrap mb-1.5'>
            <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20'>
              <LuCalendarDays className='w-3.5 h-3.5 shrink-0' aria-hidden='true' />
              <span>Cash Horizon</span>
            </span>
            <span className='text-xs text-muted-foreground'>
              Projected daily balance &amp; bill due dates
            </span>
          </div>
          <h3 className='text-xl @md:text-2xl font-extrabold tracking-tight'>
            {formatMonthLabel(viewMonth)}
          </h3>
        </div>

        <div className='inline-flex items-center gap-1 rounded-lg border border-border/80 bg-muted/40 p-0.5 self-start @sm:self-auto'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-11 w-11 text-muted-foreground hover:text-foreground'
            onClick={() => shiftViewMonth(-1)}
            aria-label='Previous month'
          >
            <LuChevronLeft className='w-4 h-4' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-11 px-3 text-xs font-semibold'
            onClick={() => setViewMonth(currentMonthKey)}
            disabled={isCurrentMonth}
          >
            Today
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-11 w-11 text-muted-foreground hover:text-foreground'
            onClick={() => shiftViewMonth(1)}
            aria-label='Next month'
          >
            <LuChevronRight className='w-4 h-4' />
          </Button>
        </div>
      </div>

      {/* Liquidity Cliff Warning */}
      {firstAtRiskDate && (
        <div className='mb-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3'>
          <LuTriangleAlert
            className='mt-0.5 h-4 w-4 shrink-0 text-destructive'
            aria-hidden='true'
          />
          <div className='min-w-0'>
            <p className='text-xs font-bold text-destructive'>
              Liquidity cliff this month
            </p>
            <p className='mt-0.5 text-xs text-muted-foreground'>
              Balance reaches{' '}
              <span className='font-semibold text-foreground'>
                {formatCurrency(projection.lowestBalance, currency)}
              </span>{' '}
              on {formatAppDate(projection.lowestDate)} —{' '}
              {projection.atRiskDates.length}{' '}
              {projection.atRiskDates.length === 1 ? 'day' : 'days'} at or below
              the safety threshold, first on {formatAppDate(firstAtRiskDate)}.
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className='grid grid-cols-2 @md:grid-cols-4 gap-2.5 sm:gap-3'>
        <HorizonStat
          label='Today'
          value={formatCurrency(projection.currentBalance, currency)}
          caption={format(referenceDate, 'EEE, d MMM yyyy')}
          icon={<LuWallet className='w-3.5 h-3.5' />}
        />
        <HorizonStat
          label='Month End'
          value={formatCurrency(projection.endingBalance, currency)}
          caption={`Close of ${formatMonthLabel(viewMonth)}`}
          icon={<LuCalendar className='w-3.5 h-3.5' />}
          tone={projection.endingBalance < 0 ? 'negative' : 'default'}
        />
        <HorizonStat
          label='Lowest'
          value={formatCurrency(projection.lowestBalance, currency)}
          caption={
            projection.lowestDate
              ? formatAppDate(projection.lowestDate)
              : 'No projected days'
          }
          icon={
            projection.lowestBalance <= AT_RISK_THRESHOLD ? (
              <LuTriangleAlert className='w-3.5 h-3.5' />
            ) : (
              <LuTrendingDown className='w-3.5 h-3.5' />
            )
          }
          tone={projection.lowestBalance <= AT_RISK_THRESHOLD ? 'negative' : 'default'}
        />
        <HorizonStat
          label='Next Income'
          value={
            nextIncomeDay
              ? formatCurrency(nextIncomeAmount, currency)
              : 'None'
          }
          caption={
            nextIncomeDay
              ? `Expected ${formatAppDate(nextIncomeDay.date)}`
              : `No income in ${formatMonthLabel(viewMonth)}`
          }
          icon={<LuArrowUpRight className='w-3.5 h-3.5' />}
          tone={nextIncomeDay ? 'positive' : 'default'}
        />
      </div>

      {/* Projected Balance Graph */}
      <div className='mt-4 flex items-center justify-between gap-2'>
        <span className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
          Projected End-Of-Day Balance
        </span>
        <span className='text-[11px] text-muted-foreground'>
          Threshold {formatCurrency(AT_RISK_THRESHOLD, currency)}
        </span>
      </div>
      <div className='mt-1.5'>
        <CashHorizonBalanceChart
          days={projection.days}
          currency={currency}
          atRiskThreshold={AT_RISK_THRESHOLD}
        />
      </div>

      {/* Due-Date Calendar */}
      <div className='mt-4 flex flex-wrap items-center justify-between gap-2'>
        <span className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
          Due-Date Calendar
        </span>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground'>
          <span className='inline-flex items-center gap-1'>
            <LuArrowUpRight
              className='w-3 h-3 text-emerald-600 dark:text-emerald-400'
              aria-hidden='true'
            />
            Income
          </span>
          <span className='inline-flex items-center gap-1'>
            <LuArrowDownRight
              className='w-3 h-3 text-rose-600 dark:text-rose-400'
              aria-hidden='true'
            />
            Expense
          </span>
          <span className='inline-flex items-center gap-1'>
            <LuTriangleAlert
              className='w-3 h-3 text-destructive'
              aria-hidden='true'
            />
            At risk
          </span>
        </div>
      </div>
      <div className='mt-2'>
        <CashHorizonCalendar
          days={projection.days}
          currency={currency}
          onDaySelect={setSelectedDate}
        />
      </div>
      <p className='mt-2 text-[11px] text-muted-foreground'>
        Past days show recorded entries. Later days add scheduled bills and
        recurring rules that have not been posted yet.
      </p>

      {/* Day Detail Dialog */}
      <Dialog
        open={selectedDay !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null)
        }}
      >
        <DialogContent className='gap-4 p-4 sm:max-w-md'>
          {selectedDay && (
            <>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2 text-base font-bold'>
                  <LuCalendar
                    className='w-4 h-4 text-primary'
                    aria-hidden='true'
                  />
                  {format(parseDateOnly(selectedDay.date), 'EEE, d MMM yyyy')}
                </DialogTitle>
                <DialogDescription className='text-xs text-muted-foreground'>
                  Closing balance {formatCurrency(selectedDay.balance, currency)}
                  {selectedDay.isAtRisk
                    ? ' — at or below the safety threshold.'
                    : '.'}
                </DialogDescription>
              </DialogHeader>

              {selectedDay.events.length === 0 ? (
                <p className='py-6 text-center text-xs text-muted-foreground'>
                  No transactions on this day.
                </p>
              ) : (
                <div className='max-h-80 space-y-2 overflow-y-auto pr-1 custom-scrollbar'>
                  {selectedDay.events.map((event) => {
                    const isIncome = event.type === 'income'
                    const isMarking = markingEventId === event.id

                    return (
                      <div
                        key={`${event.source}-${event.id}`}
                        className='space-y-2 rounded-lg border border-border/70 bg-background p-2.5'
                      >
                        <div className='flex items-center gap-3'>
                          <span
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                              isIncome
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
                            )}
                            aria-hidden='true'
                          >
                            {isIncome ? (
                              <LuArrowUpRight className='w-4 h-4' />
                            ) : (
                              <LuArrowDownRight className='w-4 h-4' />
                            )}
                          </span>
                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-medium'>
                              {event.description}
                            </p>
                            <p className='truncate text-[11px] text-muted-foreground'>
                              {isIncome ? 'Income' : 'Expense'}
                              {event.category ? ` · ${event.category}` : ''} ·{' '}
                              {event.source === 'recurring'
                                ? 'Recurring rule'
                                : 'Recorded entry'}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'shrink-0 text-sm font-bold tabular-nums',
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400',
                            )}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrency(event.amount, currency)}
                          </span>
                        </div>

                        {canEdit && event.source === 'recurring' && (
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            className='h-9 w-full gap-1.5 text-xs'
                            disabled={markingEventId !== null}
                            loading={isMarking}
                            onClick={() => handleMarkAsPaid(event)}
                          >
                            {!isMarking && (
                              <LuCheck className='w-3.5 h-3.5' />
                            )}
                            {isMarking ? 'Posting…' : 'Mark as Paid'}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
