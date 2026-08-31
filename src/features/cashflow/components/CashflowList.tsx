'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav'
import {
  LuPlus,
  LuWallet,
  LuEllipsisVertical,
  LuShare2,
  LuPencil,
  LuTrash2,
  LuLoader,
  LuArrowUpRight,
  LuArrowDownRight,
  LuRotateCcw,
  LuEyeOff,
} from 'react-icons/lu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'react-toastify'
import {
  deleteCashflow,
  toggleCashflowInclusion,
  toggleCashflowPin,
} from '../actions'
// import type { Cashflow } from '@/types/supabase';
import { formatCurrencyCompact } from '@/lib/currency'
import dynamic from 'next/dynamic'
import CashflowModal from './CashflowModal'
import ShareModal from './ShareModal'
import { Loader } from '@/components/ui/loader'
const CashflowCharts = dynamic(
  () => import('./CashflowCharts').then((mod) => mod.CashflowCharts),
  {
    ssr: false,
    loading: () => (
      <Loader
        className='min-h-90 py-12 bg-card border rounded-xl'
        text='Loading financial overview...'
      />
    ),
  },
)
import { CashflowSummaryStats } from './CashflowSummaryStats'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import type {
  CashflowWithSummaryDTO,
  CashflowChartAggregateDTO,
} from '@/types/dto'

interface CashflowListProps {
  cashflows: CashflowWithSummaryDTO[]
  aggregates?: CashflowChartAggregateDTO[]
  currency: string | null
  currentUserId?: string
}

export default function CashflowList({
  cashflows,
  aggregates = [],
  currency,
  currentUserId,
}: CashflowListProps) {
  const searchParams = useSearchParams()
  const action = searchParams.get('action')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(action === 'add')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [activeCashflow, setActiveCashflow] =
    useState<CashflowWithSummaryDTO | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [prevAction, setPrevAction] = useState(action)
  const [sharedTab, setSharedTab] = useState<'active' | 'hidden'>('active')
  const [isPendingPinId, setIsPendingPinId] = useState<string | null>(null)
  const [pinnedOverrides, setPinnedOverrides] = useState<Record<string, boolean>>({})

  if (action !== prevAction) {
    setPrevAction(action)
    if (action === 'add') {
      setIsCreateModalOpen(true)
    }
  }

  const handleCreateOpenChange = (open: boolean) => {
    setIsCreateModalOpen(open)
    if (!open && action === 'add') {
      const params = new URLSearchParams(window.location.search)
      params.delete('action')
      const newUrl = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname
      window.history.replaceState(null, '', newUrl)
    }
  }

  // Initialize from props
  const [includedSharedIds, setIncludedSharedIds] = useState<Set<string>>(
    () => {
      const included = new Set<string>()
      cashflows.forEach((c) => {
        if (c.user_id !== currentUserId && c.isIncluded) {
          included.add(c.id)
        }
      })
      return included
    },
  )

  const ownedCashflows = useMemo(
    () => cashflows.filter((c) => c.user_id === currentUserId),
    [cashflows, currentUserId],
  )

  const allSharedCashflows = useMemo(
    () => cashflows.filter((c) => c.user_id !== currentUserId),
    [cashflows, currentUserId],
  )

  const activeSharedCashflows = useMemo(
    () =>
      allSharedCashflows.filter((c) => {
        const isPinned = pinnedOverrides[c.id] ?? c.isPinned ?? true
        return isPinned
      }),
    [allSharedCashflows, pinnedOverrides],
  )

  const hiddenSharedCashflows = useMemo(
    () =>
      allSharedCashflows.filter((c) => {
        const isPinned = pinnedOverrides[c.id] ?? c.isPinned ?? true
        return !isPinned
      }),
    [allSharedCashflows, pinnedOverrides],
  )

  // Calculate overall stats for OWNED cashflows + INCLUDED active shared cashflows
  const flowsToCount = useMemo(() => {
    const shared = activeSharedCashflows.filter((c) => includedSharedIds.has(c.id))
    return [...ownedCashflows, ...shared]
  }, [ownedCashflows, activeSharedCashflows, includedSharedIds])

  const totalIncome = flowsToCount.reduce((sum, c) => sum + c.income, 0)
  const totalExpense = flowsToCount.reduce((sum, c) => sum + c.expense, 0)
  const balance = totalIncome - totalExpense

  const activeCashflowIds = useMemo(() => {
    return new Set(flowsToCount.map((c) => c.id))
  }, [flowsToCount])

  const activeAggregates = useMemo(() => {
    return aggregates.filter((a) => activeCashflowIds.has(a.cashflow_id))
  }, [aggregates, activeCashflowIds])

  async function handleToggleInclusion(cashflowId: string) {
    // Optimistic update
    const isIncluded = !includedSharedIds.has(cashflowId)

    setIncludedSharedIds((prev) => {
      const next = new Set(prev)
      if (isIncluded) {
        next.add(cashflowId)
      } else {
        next.delete(cashflowId)
      }
      return next
    })

    // Server update
    const result = await toggleCashflowInclusion(cashflowId, isIncluded)
    if (result?.error) {
      toast.error('Failed to save preference')
      // Revert if failed
      setIncludedSharedIds((prev) => {
        const next = new Set(prev)
        if (!isIncluded) {
          next.add(cashflowId)
        } else {
          next.delete(cashflowId)
        }
        return next
      })
    }
  }

  async function handleTogglePin(cashflowId: string, isPinned: boolean) {
    setIsPendingPinId(cashflowId)
    const prevPinned = pinnedOverrides[cashflowId] ?? activeSharedCashflows.some((c) => c.id === cashflowId)
    const prevIncluded = includedSharedIds.has(cashflowId)

    // Optimistic update
    setPinnedOverrides((prev) => ({ ...prev, [cashflowId]: isPinned }))
    if (!isPinned) {
      setIncludedSharedIds((prev) => {
        const next = new Set(prev)
        next.delete(cashflowId)
        return next
      })
    }

    try {
      const result = await toggleCashflowPin(cashflowId, isPinned)
      if (result?.error) {
        toast.error(result.error || 'Failed to update visibility')
        // Revert
        setPinnedOverrides((prev) => ({ ...prev, [cashflowId]: prevPinned }))
        if (prevIncluded) {
          setIncludedSharedIds((prev) => new Set(prev).add(cashflowId))
        }
      } else {
        toast.success(
          isPinned
            ? 'Cashflow restored to dashboard'
            : 'Cashflow hidden from dashboard',
        )
      }
    } catch {
      toast.error('Failed to update visibility')
      setPinnedOverrides((prev) => ({ ...prev, [cashflowId]: prevPinned }))
      if (prevIncluded) {
        setIncludedSharedIds((prev) => new Set(prev).add(cashflowId))
      }
    } finally {
      setIsPendingPinId(null)
    }
  }

  async function handleDelete() {
    if (!activeCashflow) return
    setIsDeleting(true)
    const result = await deleteCashflow(activeCashflow.id)
    if (result.error) {
      toast.error('Failed to delete cashflow')
      setIsDeleting(false)
    } else {
      setDeleteDialogOpen(false)
      setIsDeleting(false)
      toast.success('Cashflow deleted')
    }
  }

  function openShare(e: React.MouseEvent, cashflow: CashflowWithSummaryDTO) {
    e.stopPropagation()
    setActiveCashflow(cashflow)
    setIsShareModalOpen(true)
  }

  function openEdit(e: React.MouseEvent, cashflow: CashflowWithSummaryDTO) {
    e.stopPropagation()
    setActiveCashflow(cashflow)
    setIsEditModalOpen(true)
  }

  function openDelete(e: React.MouseEvent, cashflow: CashflowWithSummaryDTO) {
    e.stopPropagation()
    setActiveCashflow(cashflow)
    setIsDeleting(false)
    setDeleteDialogOpen(true)
  }

  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='space-y-1.5 sm:space-y-2'>
        <BreadcrumbNav />
        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <h1 className='text-3xl font-bold tracking-tight text-foreground truncate'>
              Cashflow
            </h1>
            <p className='text-sm sm:text-base text-muted-foreground mt-1 truncate'>
              Track your income and expenses
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className='gap-2'>
            <LuPlus className='w-4 h-4' />
            New Cashflow
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <CashflowSummaryStats
        income={totalIncome}
        expense={totalExpense}
        balance={balance}
        currency={currency}
      />

      {/* Cashflow Sections */}
      {(() => {
        const renderCashflowItem = (cashflow: CashflowWithSummaryDTO) => {
          const isPositive = cashflow.balance > 0
          const isNegative = cashflow.balance < 0
          const isOwned = currentUserId === cashflow.user_id
          const isItemPinned = pinnedOverrides[cashflow.id] ?? cashflow.isPinned ?? true

          return (
            <div
              key={cashflow.id}
              className={cn(
                'group relative bg-card border rounded-2xl p-3.5 sm:p-4.5 hover:border-primary/40 hover:shadow-md transition-all overflow-hidden',
                !isItemPinned && 'border-dashed bg-muted/10 opacity-90',
              )}
            >
              <div className='flex flex-col gap-3 w-full min-w-0'>
                {/* Header Row: Left (Icon + Title + Txns), Right (Balance + Action Menu) */}
                <div className='flex items-center justify-between gap-3 min-w-0'>
                  {/* Title & Icon */}
                  <div className='flex items-center gap-3 min-w-0 flex-1'>
                    <div
                      className={cn(
                        'p-2 sm:p-2.5 rounded-xl shrink-0 border',
                        isItemPinned
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
                          : 'bg-muted text-muted-foreground border-border/40',
                      )}
                    >
                      <LuWallet className='w-4.5 h-4.5 sm:w-5 sm:h-5' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2 flex-wrap min-w-0'>
                        <h2 className='font-semibold text-base sm:text-lg group-hover:text-primary transition-colors truncate'>
                          <Link
                            href={`/cashflow/${cashflow.id}`}
                            className='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm'
                          >
                            {cashflow.title}
                          </Link>
                        </h2>
                        {!isItemPinned && (
                          <span className='text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0'>
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className='text-xs text-muted-foreground font-medium truncate'>
                        {cashflow.entryCount} transactions
                      </p>
                    </div>
                  </div>

                  {/* Right: Net Balance with single up/down icon & Action Menu */}
                  <div className='flex items-center gap-2 sm:gap-3 shrink-0'>
                    <div
                      title={`Balance: ${isPositive ? '+' : ''}${cashflow.balance.toLocaleString()}`}
                      className='flex items-center gap-1 text-right'
                    >
                      {isPositive && (
                        <LuArrowUpRight className='w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0' />
                      )}
                      {isNegative && (
                        <LuArrowDownRight className='w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0' />
                      )}
                      <span
                        className={cn(
                          'text-sm sm:text-base font-semibold tracking-tight tabular-nums truncate',
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isNegative
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-muted-foreground',
                        )}
                      >
                        {isPositive ? '+' : ''}
                        {formatCurrencyCompact(cashflow.balance, currency)}
                      </span>
                    </div>

                    {/* Action Menu on Mobile / Desktop */}
                    <div className='shrink-0 flex items-center'>
                      {isOwned ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                            }}
                          >
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 rounded-full cursor-pointer'
                              aria-label={'Actions for ' + cashflow.title}
                            >
                              <LuEllipsisVertical
                                className='w-4 h-4'
                                aria-hidden='true'
                              />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align='end'
                            onCloseAutoFocus={(e) => e.preventDefault()}
                          >
                            <DropdownMenuItem
                              className='cursor-pointer'
                              onClick={(e) => openShare(e, cashflow)}
                            >
                              <LuShare2 className='w-3.5 h-3.5 mr-2' />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='cursor-pointer'
                              onClick={(e) => openEdit(e, cashflow)}
                            >
                              <LuPencil className='w-3.5 h-3.5 mr-2' />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='text-destructive focus:text-destructive cursor-pointer'
                              onClick={(e) => openDelete(e, cashflow)}
                            >
                              <LuTrash2 className='w-3.5 h-3.5 mr-2' />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : !isItemPinned ? (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleTogglePin(cashflow.id, true)
                          }}
                          disabled={isPendingPinId === cashflow.id}
                          className='gap-1.5 h-8 text-xs font-semibold hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 cursor-pointer'
                        >
                          {isPendingPinId === cashflow.id ? (
                            <LuLoader className='w-3.5 h-3.5 animate-spin' />
                          ) : (
                            <LuRotateCcw className='w-3.5 h-3.5' />
                          )}
                          <span>Restore</span>
                        </Button>
                      ) : (
                        <div className='flex items-center gap-1 sm:gap-2'>
                          <div className='flex items-center gap-1.5'>
                            <Switch
                              id={`include-${cashflow.id}`}
                              aria-label={`Include ${cashflow.title} in totals`}
                              checked={includedSharedIds.has(cashflow.id)}
                              onCheckedChange={() =>
                                handleToggleInclusion(cashflow.id)
                              }
                              className='scale-75 data-[state=checked]:bg-primary'
                            />
                            <Label
                              htmlFor={`include-${cashflow.id}`}
                              className='cursor-pointer text-[10px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:inline'
                            >
                              Include
                            </Label>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                              }}
                            >
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8 rounded-full cursor-pointer text-muted-foreground hover:text-foreground'
                                aria-label={'Actions for ' + cashflow.title}
                              >
                                <LuEllipsisVertical
                                  className='w-4 h-4'
                                  aria-hidden='true'
                                />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align='end'
                              onCloseAutoFocus={(e) => e.preventDefault()}
                            >
                              <DropdownMenuItem
                                className='cursor-pointer text-muted-foreground hover:text-foreground'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleTogglePin(cashflow.id, false)
                                }}
                              >
                                <LuEyeOff className='w-3.5 h-3.5 mr-2' />
                                Hide from dashboard
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metric Row: Dual Inflow / Outflow Pills */}
                <div className='grid grid-cols-2 gap-2 pt-2.5 border-t border-border/40'>
                  {/* Inflow Pill */}
                  <div className='flex items-center justify-between px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 text-xs min-w-0'>
                    <span className='text-muted-foreground font-medium flex items-center gap-1 truncate'>
                      <LuArrowUpRight className='w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0' />
                      <span className='truncate'>Inflow</span>
                    </span>
                    <span
                      title={`+${cashflow.income.toLocaleString()}`}
                      className='font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums truncate pl-1'
                    >
                      +{formatCurrencyCompact(cashflow.income, currency)}
                    </span>
                  </div>

                  {/* Outflow Pill */}
                  <div className='flex items-center justify-between px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15 text-xs min-w-0'>
                    <span className='text-muted-foreground font-medium flex items-center gap-1 truncate'>
                      <LuArrowDownRight className='w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0' />
                      <span className='truncate'>Outflow</span>
                    </span>
                    <span
                      title={`-${cashflow.expense.toLocaleString()}`}
                      className='font-semibold text-rose-600 dark:text-rose-400 tabular-nums truncate pl-1'
                    >
                      -{formatCurrencyCompact(cashflow.expense, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        if (cashflows.length === 0) {
          return (
            <div className='bg-card border border-dashed rounded-xl p-12 text-center'>
              <div className='mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4'>
                <LuWallet className='w-6 h-6 text-muted-foreground' />
              </div>
              <h3 className='font-semibold mb-1'>No cashflows yet</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Create your first cashflow to start tracking
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className='gap-2'
              >
                <LuPlus className='w-4 h-4' />
                Create Cashflow
              </Button>
            </div>
          )
        }

        return (
          <div className='space-y-8'>
            {/* My Cashflows */}
            {ownedCashflows.length > 0 && (
              <div className='space-y-4'>
                <div className='grid gap-4'>
                  {ownedCashflows.map(renderCashflowItem)}
                </div>
              </div>
            )}

            {/* Shared With Me Section */}
            {allSharedCashflows.length > 0 && (
              <div className='space-y-4'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2 pt-2'>
                  <div className='flex items-center gap-2'>
                    <div className='p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500'>
                      <LuShare2 className='w-4 h-4' />
                    </div>
                    <h2 className='text-lg font-bold tracking-tight'>
                      Shared with me
                    </h2>
                  </div>

                  {(hiddenSharedCashflows.length > 0 || sharedTab === 'hidden') && (
                    <div className='inline-flex items-center rounded-lg bg-muted/60 p-0.5 border border-border/40 text-xs font-medium self-start sm:self-auto'>
                      <button
                        type='button'
                        onClick={() => setSharedTab('active')}
                        className={cn(
                          'px-2.5 py-1 rounded-md transition-all cursor-pointer',
                          sharedTab === 'active'
                            ? 'bg-background text-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        Active ({activeSharedCashflows.length})
                      </button>
                      <button
                        type='button'
                        onClick={() => setSharedTab('hidden')}
                        className={cn(
                          'px-2.5 py-1 rounded-md transition-all cursor-pointer',
                          sharedTab === 'hidden'
                            ? 'bg-background text-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        Hidden ({hiddenSharedCashflows.length})
                      </button>
                    </div>
                  )}
                </div>

                {sharedTab === 'active' ? (
                  activeSharedCashflows.length > 0 ? (
                    <div className='grid gap-4'>
                      {activeSharedCashflows.map(renderCashflowItem)}
                    </div>
                  ) : (
                    <div className='bg-card border border-dashed rounded-xl p-8 text-center'>
                      <p className='text-sm text-muted-foreground'>
                        No active shared cashflows. Check the Hidden tab to restore previously unpinned cashflows.
                      </p>
                    </div>
                  )
                ) : (
                  hiddenSharedCashflows.length > 0 ? (
                    <div className='grid gap-4'>
                      {hiddenSharedCashflows.map(renderCashflowItem)}
                    </div>
                  ) : (
                    <div className='bg-card border border-dashed rounded-xl p-8 text-center'>
                      <p className='text-sm text-muted-foreground'>
                        No hidden cashflows.
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* Dashboard Charts */}
      <CashflowCharts
        aggregates={activeAggregates}
        cashflows={flowsToCount}
        currency={currency}
      />

      {/* Modals */}
      <CashflowModal
        mode='create'
        open={isCreateModalOpen}
        onOpenChange={handleCreateOpenChange}
      />

      <CashflowModal
        mode='edit'
        cashflow={activeCashflow}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      {activeCashflow && (
        <ShareModal
          cashflow={activeCashflow}
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cashflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{activeCashflow?.title}&quot;
              and all its entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? (
                <div className='flex items-center gap-2'>
                  <LuLoader className='w-4 h-4 animate-spin' />
                  <span>Deleting...</span>
                </div>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
