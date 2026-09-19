'use client'

import { useState, useMemo } from 'react'
import {
  LuShieldCheck,
  LuTriangleAlert,
  LuCalendar,
  LuChevronDown,
  LuChevronUp,
  LuRefreshCw,
  LuCheck,
} from 'react-icons/lu'
import {
  calculateSafeToSpend,
  type SafeToSpendResult,
} from '../lib/safe-to-spend'
import type { CashflowRecurringRuleDTO } from '@/types/dto'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface SafeToSpendCardProps {
  balance: number
  recurringRules: CashflowRecurringRuleDTO[]
  currency: string | null
  onReconcileBalance?: (
    reconciledAmount: number,
    difference: number,
  ) => Promise<void> | void
  className?: string
}

export function SafeToSpendCard({
  balance,
  recurringRules,
  currency,
  onReconcileBalance,
  className,
}: SafeToSpendCardProps) {
  const [showBills, setShowBills] = useState(false)
  const [isReconcileOpen, setIsReconcileOpen] = useState(false)
  const [actualBalanceInput, setActualBalanceInput] = useState<string>('')
  const savingsGoalInput = 0
  const [isReconciling, setIsReconciling] = useState(false)

  const safeData: SafeToSpendResult = useMemo(() => {
    return calculateSafeToSpend({
      balance,
      recurringRules,
      savingsGoal: savingsGoalInput,
    })
  }, [balance, recurringRules, savingsGoalInput])

  const parsedActualBalance = parseFloat(actualBalanceInput)
  const balanceDifference = !isNaN(parsedActualBalance)
    ? parsedActualBalance - balance
    : 0

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isNaN(parsedActualBalance) || !onReconcileBalance) return
    try {
      setIsReconciling(true)
      await onReconcileBalance(parsedActualBalance, balanceDifference)
      setIsReconcileOpen(false)
      setActualBalanceInput('')
    } finally {
      setIsReconciling(false)
    }
  }

  return (
    <div
      className={cn(
        'w-full @container bg-card border rounded-2xl p-4 sm:p-5 shadow-xs transition-all relative overflow-hidden',
        safeData.isDeficit
          ? 'border-amber-500/40 dark:border-amber-500/30'
          : 'border-emerald-500/30 dark:border-emerald-500/20',
        className,
      )}
    >
      {/* Top Gradient Stripe */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1',
          safeData.isDeficit ? 'bg-amber-500' : 'bg-emerald-500',
        )}
      />

      {/* Main Header & Metric Row */}
      <div className='flex flex-col @md:flex-row @md:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2 mb-1.5'>
            {safeData.isDeficit ? (
              <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'>
                <LuTriangleAlert className='w-3.5 h-3.5 shrink-0' />
                <span>Tight Budget Alert</span>
              </span>
            ) : (
              <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
                <LuShieldCheck className='w-3.5 h-3.5 shrink-0' />
                <span>Safe to Spend Active</span>
              </span>
            )}
            <span className='text-xs text-muted-foreground flex items-center gap-1'>
              <LuCalendar className='w-3 h-3' />
              {safeData.daysRemaining} days left in cycle
            </span>
          </div>

          <div className='flex items-baseline gap-2'>
            <h3 className='text-2xl @md:text-3xl font-extrabold tracking-tight'>
              {formatCurrency(safeData.safeToSpendDaily, currency)}
              <span className='text-xs sm:text-sm font-medium text-muted-foreground ml-1'>
                / day
              </span>
            </h3>
          </div>

          <p className='text-xs text-muted-foreground mt-1'>
            {safeData.isDeficit ? (
              <span className='text-amber-600 dark:text-amber-400 font-medium'>
                {formatCurrency(safeData.deficitAmount, currency)} needed to
                cover remaining bills and sinking funds this month.
              </span>
            ) : (
              <>
                <strong className='text-foreground font-semibold'>
                  {formatCurrency(safeData.safeToSpendTotal, currency)}
                </strong>{' '}
                unallocated after reserving upcoming bills
                {safeData.totalSinkingFundsMonthly > 0 && (
                  <>
                    {' '}
                    and{' '}
                    <strong className='text-foreground font-semibold'>
                      {formatCurrency(
                        safeData.totalSinkingFundsMonthly,
                        currency,
                      )}
                    </strong>
                    /mo in sinking funds
                  </>
                )}
                .
              </>
            )}
          </p>
        </div>

        {/* Quick Actions & Upcoming Bills / Sinking Funds Count */}
        <div className='flex items-center gap-2 self-start @md:self-center'>
          {(safeData.upcomingBills.length > 0 ||
            safeData.sinkingFunds.length > 0) && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='text-xs h-8 gap-1.5 rounded-lg'
              onClick={() => setShowBills(!showBills)}
            >
              <span>
                {safeData.upcomingBills.length + safeData.sinkingFunds.length}{' '}
                Commitments
                {safeData.sinkingFunds.length > 0
                  ? ` (${safeData.upcomingBills.length} Bills, ${safeData.sinkingFunds.length} Sinking)`
                  : ''}
              </span>
              {showBills ? (
                <LuChevronUp className='w-3.5 h-3.5' />
              ) : (
                <LuChevronDown className='w-3.5 h-3.5' />
              )}
            </Button>
          )}

          {onReconcileBalance && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='text-xs h-8 gap-1 rounded-lg text-muted-foreground hover:text-foreground'
              onClick={() => setIsReconcileOpen(true)}
            >
              <LuRefreshCw className='w-3.5 h-3.5' />
              <span>Reconcile</span>
            </Button>
          )}
        </div>
      </div>

      {/* Collapsible Commitments Timeline (Bills & Sinking Funds) */}
      {showBills &&
        (safeData.upcomingBills.length > 0 ||
          safeData.sinkingFunds.length > 0) && (
          <div className='mt-4 pt-3 border-t border-border/60 space-y-4 animate-in fade-in duration-200'>
            {/* Upcoming Bills Section */}
            {safeData.upcomingBills.length > 0 && (
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
                  <span>Upcoming Recurring Bills</span>
                  <span>Due Date</span>
                </div>
                <div className='divide-y divide-border/40 max-h-48 overflow-y-auto pr-1'>
                  {safeData.upcomingBills.map((bill) => (
                    <div
                      key={bill.id}
                      className='py-2 flex items-center justify-between text-sm gap-2'
                    >
                      <div className='min-w-0'>
                        <p className='font-medium truncate text-foreground'>
                          {bill.description}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {formatCurrency(bill.amount, currency)}
                          {bill.category ? ` • ${bill.category}` : ''}
                        </p>
                      </div>
                      <div className='text-right shrink-0'>
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded text-xs font-medium',
                            bill.isDueIn7Days
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {bill.daysUntilDue === 0
                            ? 'Due Today'
                            : bill.daysUntilDue === 1
                              ? 'Due Tomorrow'
                              : `In ${bill.daysUntilDue} days`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sinking Funds (True Expenses) Section */}
            {safeData.sinkingFunds.length > 0 && (
              <div className='space-y-1.5 pt-2 border-t border-border/40'>
                <div className='flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
                  <span className='flex items-center gap-1.5'>
                    <span>Sinking Funds (True Expenses)</span>
                    <span className='lowercase font-normal text-muted-foreground'>
                      (
                      {formatCurrency(
                        safeData.totalSinkingFundsMonthly,
                        currency,
                      )}
                      /mo reserved)
                    </span>
                  </span>
                  <span>Anniversary</span>
                </div>
                <div className='divide-y divide-border/40 max-h-48 overflow-y-auto pr-1'>
                  {safeData.sinkingFunds.map((fund) => (
                    <div
                      key={fund.id}
                      className='py-2 flex items-center justify-between text-sm gap-2'
                    >
                      <div className='min-w-0'>
                        <div className='flex items-center gap-1.5'>
                          <p className='font-medium truncate text-foreground'>
                            {fund.description}
                          </p>
                          <span className='inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20'>
                            Sinking Fund
                          </span>
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {formatCurrency(fund.monthlyReserve, currency)}/mo •{' '}
                          {formatCurrency(fund.annualAmount, currency)}/yr
                          {fund.category ? ` • ${fund.category}` : ''}
                        </p>
                      </div>
                      <div className='text-right shrink-0'>
                        <span className='inline-block px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground'>
                          Due {fund.anniversaryDate} (
                          {fund.monthsUntilDue === 0
                            ? 'This month'
                            : `in ${fund.monthsUntilDue} mo`}
                          )
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Balance Reality Check (Reconcile Dialog) */}
      <Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <LuRefreshCw className='w-5 h-5 text-primary' />
              <span>Reconcile Tracked Balance</span>
            </DialogTitle>
            <DialogDescription>
              Keep your Safe-to-Spend numbers grounded in reality by updating
              your actual bank account balance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReconcileSubmit} className='space-y-4 py-2'>
            <div className='rounded-lg bg-muted/50 p-3 text-xs space-y-1.5'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>
                  Current Tracked Balance:
                </span>
                <span className='font-semibold'>
                  {formatCurrency(balance, currency)}
                </span>
              </div>
              {!isNaN(parsedActualBalance) && (
                <div className='flex justify-between border-t border-border/40 pt-1'>
                  <span className='text-muted-foreground'>
                    Adjustment Difference:
                  </span>
                  <span
                    className={cn(
                      'font-bold',
                      balanceDifference >= 0
                        ? 'text-emerald-500'
                        : 'text-rose-500',
                    )}
                  >
                    {balanceDifference >= 0 ? '+' : ''}
                    {formatCurrency(balanceDifference, currency)}
                  </span>
                </div>
              )}
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='actual-balance'>
                Actual Bank Balance ({currency || 'USD'})
              </Label>
              <Input
                id='actual-balance'
                type='number'
                step='any'
                placeholder='e.g. 1450.00'
                value={actualBalanceInput}
                onChange={(e) => setActualBalanceInput(e.target.value)}
                required
              />
            </div>

            <div className='flex justify-end gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsReconcileOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isReconciling || isNaN(parsedActualBalance)}
                className='gap-1.5'
              >
                <LuCheck className='w-4 h-4' />
                <span>{isReconciling ? 'Saving...' : 'Apply Correction'}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
