import Link from 'next/link'
import {
  LuWallet,
  LuPin,
  LuArrowUpRight,
  LuArrowDownRight,
} from 'react-icons/lu'
import { formatCurrencyCompact } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { CashflowWithSummaryDTO } from '@/types/dto'
import { QuickLogModalTrigger } from './QuickLogModalTrigger'

interface PinnedCashflowsSectionProps {
  pinnedCashflows: CashflowWithSummaryDTO[]
  defaultCurrency: string | null
}

/**
 * PinnedCashflowsSection
 * Quick Access widget on the platform dashboard showcasing pinned cashflow accounts.
 * Provides live balance overviews and instant 1-click entry logging.
 */
export function PinnedCashflowsSection({
  pinnedCashflows,
  defaultCurrency,
}: PinnedCashflowsSectionProps) {
  if (!pinnedCashflows || pinnedCashflows.length === 0) {
    return null
  }

  return (
    <section
      className='w-full border-t border-border/80 pt-6 sm:pt-8'
      aria-labelledby='pinned-cashflows-heading'
    >
      {/* Header */}
      <div className='flex items-center justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex items-center gap-1.5'>
            <LuPin
              className='size-3.5 text-primary shrink-0'
              aria-hidden='true'
            />
            <h2
              id='pinned-cashflows-heading'
              className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-sm'
            >
              Quick Access
            </h2>
          </div>
          <p className='mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm truncate'>
            Quick access to your pinned items and shortcuts.
          </p>
        </div>
      </div>

      {/* Grid of Pinned Cards */}
      <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {pinnedCashflows.map((cashflow) => {
          const isPositive = cashflow.balance > 0
          const isNegative = cashflow.balance < 0

          return (
            <div
              key={cashflow.id}
              className='group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-within:ring-2 focus-within:ring-ring cursor-pointer'
            >
              {/* Card Top: Icon, Title, Fast Entry Shortcut */}
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-3 min-w-0 flex-1'>
                  <div className='flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 pointer-events-none'>
                    <LuWallet className='size-5' aria-hidden='true' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h3 className='truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary'>
                      <Link
                        href={`/cashflow/${cashflow.id}`}
                        className='focus-visible:outline-none after:absolute after:inset-0 after:z-10 rounded-sm'
                      >
                        {cashflow.title}
                      </Link>
                    </h3>
                    <p className='text-xs text-muted-foreground tabular-nums pointer-events-none'>
                      {cashflow.entryCount}{' '}
                      {cashflow.entryCount === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                </div>

                {/* Fast Quick Log Shortcut */}
                <QuickLogModalTrigger
                  cashflow={cashflow}
                  allBooks={pinnedCashflows}
                  defaultCurrency={defaultCurrency}
                />
              </div>

              {/* Card Bottom: Balance Display with Trend Indicator */}
              <div className='mt-4 flex items-center justify-between border-t border-border/60 pt-3 pointer-events-none'>
                <span className='text-xs text-muted-foreground'>Balance</span>
                <div
                  className='flex items-center gap-1 tabular-nums font-semibold text-sm'
                  title={`Balance: ${isPositive ? '+' : ''}${cashflow.balance.toLocaleString()}`}
                >
                  {isPositive && (
                    <LuArrowUpRight
                      className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0'
                      aria-hidden='true'
                    />
                  )}
                  {isNegative && (
                    <LuArrowDownRight
                      className='size-4 text-rose-600 dark:text-rose-400 shrink-0'
                      aria-hidden='true'
                    />
                  )}
                  <span
                    className={cn(
                      isPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isNegative
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-muted-foreground',
                    )}
                  >
                    {isPositive ? '+' : ''}
                    {formatCurrencyCompact(cashflow.balance, defaultCurrency)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
