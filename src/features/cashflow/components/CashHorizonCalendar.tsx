'use client'

import { format } from 'date-fns'
import {
  LuArrowDownRight,
  LuArrowUpRight,
  LuTriangleAlert,
} from 'react-icons/lu'
import { formatCurrency, formatCurrencyCompact } from '@/lib/currency'
import { parseDateOnly } from '@/lib/date-only'
import { cn } from '@/lib/utils'
import type { DailyBalancePoint } from '../math'

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_VISIBLE_CHIPS = 2

interface CashHorizonCalendarProps {
  days: DailyBalancePoint[]
  currency: string | null
  onDaySelect: (date: string) => void
}

function buildDayLabel(day: DailyBalancePoint, currency: string | null): string {
  const heading = format(parseDateOnly(day.date), 'EEEE, d MMMM yyyy')
  const balancePart = `Closing balance ${formatCurrency(day.balance, currency)}`
  const riskPart = day.isAtRisk
    ? ' Projected balance is at or below the safety threshold.'
    : ''
  const eventParts = day.events.map(
    (event) =>
      `${event.description}, ${event.type}, ${formatCurrency(event.amount, currency)}, ${
        event.source === 'recurring' ? 'recurring' : 'recorded'
      }`,
  )
  const eventsPart =
    eventParts.length > 0
      ? ` ${eventParts.length} item(s): ${eventParts.join('; ')}.`
      : ' No transactions.'
  return `${heading}. ${balancePart}.${riskPart}${eventsPart}`
}

export function CashHorizonCalendar({
  days,
  currency,
  onDaySelect,
}: CashHorizonCalendarProps) {
  const leadBlanks = days.length > 0 ? parseDateOnly(days[0].date).getDay() : 0
  const trailingBlanks = (7 - ((leadBlanks + days.length) % 7)) % 7

  return (
    <div className='w-full min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card'>
      <div
        aria-hidden='true'
        className='grid grid-cols-7 border-b border-border/60 bg-muted/30'
      >
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className='py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'
          >
            {day}
          </div>
        ))}
      </div>

      <div className='grid grid-cols-7 gap-px bg-border/50'>
        {Array.from({ length: leadBlanks }).map((_, index) => (
          <div key={`lead-${index}`} className='min-h-14 bg-card' />
        ))}

        {days.map((day) => {
          const visibleEvents = day.events.slice(0, MAX_VISIBLE_CHIPS)
          const overflowCount = day.events.length - visibleEvents.length

          return (
            <button
              key={day.date}
              type='button'
              onClick={() => onDaySelect(day.date)}
              aria-label={buildDayLabel(day, currency)}
              className={cn(
                'flex min-h-14 cursor-pointer flex-col gap-1 bg-card p-1.5 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                day.isToday && 'bg-primary/[0.07]',
                day.isAtRisk && 'bg-destructive/[0.07]',
                !day.isToday && !day.isAtRisk && 'hover:bg-muted/30',
              )}
            >
              <span className='flex items-center justify-between gap-1'>
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums',
                    day.isToday
                      ? 'bg-primary text-primary-foreground'
                      : day.isPast
                        ? 'text-muted-foreground'
                        : 'text-foreground',
                  )}
                >
                  {Number(day.date.slice(8, 10))}
                </span>
                {day.isAtRisk && (
                  <LuTriangleAlert
                    className='h-3 w-3 shrink-0 text-destructive'
                    aria-hidden='true'
                  />
                )}
              </span>

              <span
                className={cn(
                  'truncate font-mono text-[10px] font-semibold tabular-nums',
                  day.isAtRisk
                    ? 'text-destructive'
                    : day.balance < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-muted-foreground',
                )}
              >
                {formatCurrencyCompact(day.balance, currency)}
              </span>

              {visibleEvents.map((event) => (
                <span
                  key={`${event.source}-${event.id}-${event.description}`}
                  className={cn(
                    'inline-flex min-w-0 items-center gap-1 rounded border px-1 py-0.5 text-[9px] font-medium leading-none',
                    event.type === 'income'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                  )}
                >
                  {event.type === 'income' ? (
                    <LuArrowUpRight
                      className='h-2.5 w-2.5 shrink-0'
                      aria-hidden='true'
                    />
                  ) : (
                    <LuArrowDownRight
                      className='h-2.5 w-2.5 shrink-0'
                      aria-hidden='true'
                    />
                  )}
                  <span className='truncate'>{event.description}</span>
                </span>
              ))}

              {overflowCount > 0 && (
                <span className='text-[9px] font-semibold text-muted-foreground'>
                  +{overflowCount} more
                </span>
              )}
            </button>
          )
        })}

        {Array.from({ length: trailingBlanks }).map((_, index) => (
          <div key={`trail-${index}`} className='min-h-14 bg-card' />
        ))}
      </div>
    </div>
  )
}
