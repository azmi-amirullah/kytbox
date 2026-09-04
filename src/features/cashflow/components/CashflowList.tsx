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
  LuPin,
  LuPinOff,
  LuArchive,
  LuArchiveRestore,
} from 'react-icons/lu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  archiveCashflow,
  restoreCashflow,
} from '../actions'
import { formatCurrencyCompact } from '@/lib/currency'
import dynamic from 'next/dynamic'
import CashflowModal from './CashflowModal'
import ShareModal from './ShareModal'
import { Loader } from '@/components/ui/loader'
import { SortSelector } from '@/components/ui/sort-selector'
import { StatusTabs, type StatusTabItem } from '@/components/ui/status-tabs'
import { sortEntities, type SortOption } from '@/lib/sorting'

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
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [cashflowToArchive, setCashflowToArchive] =
    useState<CashflowWithSummaryDTO | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)
  const [prevAction, setPrevAction] = useState(action)

  // Organization state
  const [dashboardTab, setDashboardTab] = useState<'active' | 'archived'>('active')
  const [sharedTab, setSharedTab] = useState<'active' | 'hidden'>('active')
  const [sortBy, setSortBy] = useState<SortOption>('last_activity')
  const [isPendingPinId, setIsPendingPinId] = useState<string | null>(null)
  const [isPendingArchiveId, setIsPendingArchiveId] = useState<string | null>(null)
  const [pinnedOverrides, setPinnedOverrides] = useState<Record<string, boolean>>({})
  const [archiveOverrides, setArchiveOverrides] = useState<Record<string, boolean>>({})

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

  // Partition owned vs shared
  const allOwnedCashflows = useMemo(
    () => cashflows.filter((c) => c.user_id === currentUserId),
    [cashflows, currentUserId],
  )

  const activeOwnedCashflows = useMemo(
    () =>
      allOwnedCashflows.filter((c) => {
        const isArchived = archiveOverrides[c.id] ?? c.isArchived ?? false
        return !isArchived
      }),
    [allOwnedCashflows, archiveOverrides],
  )

  const archivedOwnedCashflows = useMemo(
    () =>
      allOwnedCashflows.filter((c) => {
        const isArchived = archiveOverrides[c.id] ?? c.isArchived ?? false
        return isArchived
      }),
    [allOwnedCashflows, archiveOverrides],
  )

  const pinnedOwnedCashflows = useMemo(
    () =>
      activeOwnedCashflows.filter((c) => {
        const isPinned = pinnedOverrides[c.id] ?? c.isPinned ?? false
        return isPinned
      }),
    [activeOwnedCashflows, pinnedOverrides],
  )

  const unpinnedOwnedCashflows = useMemo(
    () =>
      activeOwnedCashflows.filter((c) => {
        const isPinned = pinnedOverrides[c.id] ?? c.isPinned ?? false
        return !isPinned
      }),
    [activeOwnedCashflows, pinnedOverrides],
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

  // Sorted views using reusable sorting utility
  const sortedPinnedOwned = useMemo(
    () => sortEntities(pinnedOwnedCashflows, sortBy),
    [pinnedOwnedCashflows, sortBy],
  )

  const sortedUnpinnedOwned = useMemo(
    () => sortEntities(unpinnedOwnedCashflows, sortBy),
    [unpinnedOwnedCashflows, sortBy],
  )

  const sortedArchivedOwned = useMemo(
    () => sortEntities(archivedOwnedCashflows, sortBy),
    [archivedOwnedCashflows, sortBy],
  )

  const sortedActiveShared = useMemo(
    () => sortEntities(activeSharedCashflows, sortBy),
    [activeSharedCashflows, sortBy],
  )

  const sortedHiddenShared = useMemo(
    () => sortEntities(hiddenSharedCashflows, sortBy),
    [hiddenSharedCashflows, sortBy],
  )

  // Calculate overall stats for ACTIVE OWNED cashflows + INCLUDED active shared cashflows (never archived)
  const flowsToCount = useMemo(() => {
    const shared = activeSharedCashflows.filter((c) => includedSharedIds.has(c.id))
    return [...activeOwnedCashflows, ...shared]
  }, [activeOwnedCashflows, activeSharedCashflows, includedSharedIds])

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

    const result = await toggleCashflowInclusion(cashflowId, isIncluded)
    if (result?.error) {
      toast.error('Failed to save preference')
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
    const isOwned = allOwnedCashflows.some((c) => c.id === cashflowId)
    const prevPinned =
      pinnedOverrides[cashflowId] ??
      (isOwned
        ? allOwnedCashflows.find((c) => c.id === cashflowId)?.isPinned ?? false
        : activeSharedCashflows.some((c) => c.id === cashflowId))
    const prevIncluded = includedSharedIds.has(cashflowId)

    // Optimistic update
    setPinnedOverrides((prev) => ({ ...prev, [cashflowId]: isPinned }))
    if (isPinned) {
      setArchiveOverrides((prev) => ({ ...prev, [cashflowId]: false }))
    } else if (!isOwned) {
      setIncludedSharedIds((prev) => {
        const next = new Set(prev)
        next.delete(cashflowId)
        return next
      })
    }

    try {
      const result = await toggleCashflowPin(cashflowId, isPinned)
      if (result?.error) {
        toast.error(result.error || 'Failed to update pin status')
        setPinnedOverrides((prev) => ({ ...prev, [cashflowId]: prevPinned }))
        if (prevIncluded) {
          setIncludedSharedIds((prev) => new Set(prev).add(cashflowId))
        }
      } else {
        toast.success(
          isPinned
            ? isOwned
              ? 'Cashflow pinned to top'
              : 'Cashflow restored to dashboard'
            : isOwned
              ? 'Cashflow unpinned'
              : 'Cashflow hidden from dashboard',
        )
      }
    } catch {
      toast.error('Failed to update pin status')
      setPinnedOverrides((prev) => ({ ...prev, [cashflowId]: prevPinned }))
      if (prevIncluded) {
        setIncludedSharedIds((prev) => new Set(prev).add(cashflowId))
      }
    } finally {
      setIsPendingPinId(null)
    }
  }

  async function handleArchiveConfirm() {
    if (!cashflowToArchive) return
    const id = cashflowToArchive.id
    const title = cashflowToArchive.title
    setIsArchiving(true)

    try {
      const result = await archiveCashflow(id)
      if (result?.error) {
        toast.error(result.error || 'Failed to archive cashflow')
        setIsArchiving(false)
      } else {
        setArchiveOverrides((prev) => ({ ...prev, [id]: true }))
        setPinnedOverrides((prev) => ({ ...prev, [id]: false }))
        toast.success(
          `"${title}" archived. You can view or restore it in the Archived tab.`,
        )
        setArchiveDialogOpen(false)
      }
    } catch {
      toast.error('Failed to archive cashflow')
      setIsArchiving(false)
    }
  }

  async function handleRestore(cashflow: CashflowWithSummaryDTO) {
    const id = cashflow.id
    setIsPendingArchiveId(id)

    try {
      const result = await restoreCashflow(id)
      if (result?.error) {
        toast.error(result.error || 'Failed to restore cashflow')
      } else {
        setArchiveOverrides((prev) => ({ ...prev, [id]: false }))
        toast.success(`"${cashflow.title}" restored to active dashboard.`)
      }
    } catch {
      toast.error('Failed to restore cashflow')
    } finally {
      setIsPendingArchiveId(null)
    }
  }

  async function handleDelete() {
    if (!activeCashflow) return
    setIsDeleting(true)
    const result = await deleteCashflow(activeCashflow.id)
    if (result?.error) {
      toast.error('Failed to delete cashflow')
      setIsDeleting(false)
    } else {
      setDeleteDialogOpen(false)
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

  function openArchiveModal(e: React.MouseEvent, cashflow: CashflowWithSummaryDTO) {
    e.stopPropagation()
    setCashflowToArchive(cashflow)
    setIsArchiving(false)
    setArchiveDialogOpen(true)
  }

  const renderCashflowItem = (cashflow: CashflowWithSummaryDTO) => {
    const isPositive = cashflow.balance > 0
    const isNegative = cashflow.balance < 0
    const isOwned = currentUserId === cashflow.user_id
    const isItemPinned = isOwned
      ? pinnedOverrides[cashflow.id] ?? cashflow.isPinned ?? false
      : pinnedOverrides[cashflow.id] ?? cashflow.isPinned ?? true
    const isArchived = archiveOverrides[cashflow.id] ?? cashflow.isArchived ?? false
    const isPendingArchive = isPendingArchiveId === cashflow.id

    return (
      <div
        key={cashflow.id}
        className={cn(
          'group relative bg-card border rounded-2xl p-3.5 sm:p-4.5 hover:border-primary/40 hover:shadow-md transition-all overflow-hidden',
          !isItemPinned && !isOwned && 'border-dashed bg-muted/10 opacity-90',
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
                  isArchived
                    ? 'bg-muted text-muted-foreground border-border/40'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15',
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

                  {/* Pinned Badge on Owned Books */}
                  {isOwned && isItemPinned && !isArchived && (
                    <span className='inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full shrink-0'>
                      <LuPin className='w-2.5 h-2.5' />
                      Pinned
                    </span>
                  )}

                  {/* Archived Badge */}
                  {isArchived && (
                    <span className='inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full shrink-0'>
                      <LuArchive className='w-2.5 h-2.5' />
                      Archived
                    </span>
                  )}

                  {/* Hidden Badge for Shared Books */}
                  {!isOwned && !isItemPinned && (
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

            {/* Right: Net Balance & Actions */}
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

              {/* Action Menu */}
              <div className='shrink-0 flex items-center gap-1'>
                {isOwned ? (
                  isArchived ? (
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRestore(cashflow)
                        }}
                        disabled={isPendingArchive}
                        className='gap-1.5 h-8 text-xs font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/30 cursor-pointer'
                      >
                        {isPendingArchive ? (
                          <LuLoader className='w-3.5 h-3.5 animate-spin' />
                        ) : (
                          <LuArchiveRestore className='w-3.5 h-3.5' />
                        )}
                        <span>{isPendingArchive ? 'Restoring...' : 'Restore'}</span>
                      </Button>
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
                            <LuEllipsisVertical className='w-4 h-4' aria-hidden='true' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' onCloseAutoFocus={(e) => e.preventDefault()}>
                          <DropdownMenuItem
                            className='cursor-pointer'
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRestore(cashflow)
                            }}
                          >
                            <LuArchiveRestore className='w-3.5 h-3.5 mr-2' />
                            Restore to Active
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='text-destructive focus:text-destructive cursor-pointer'
                            onClick={(e) => openDelete(e, cashflow)}
                          >
                            <LuTrash2 className='w-3.5 h-3.5 mr-2' />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <div className='flex items-center gap-1'>
                      {/* 3-Dot Actions Menu */}
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
                            <LuEllipsisVertical className='w-4 h-4' aria-hidden='true' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' onCloseAutoFocus={(e) => e.preventDefault()}>
                          <DropdownMenuItem
                            className='cursor-pointer'
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTogglePin(cashflow.id, !isItemPinned)
                            }}
                          >
                            {isItemPinned ? (
                              <>
                                <LuPinOff className='w-3.5 h-3.5 mr-2' />
                                Unpin from top
                              </>
                            ) : (
                              <>
                                <LuPin className='w-3.5 h-3.5 mr-2' />
                                Pin to top
                              </>
                            )}
                          </DropdownMenuItem>
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
                            className='cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-600'
                            onClick={(e) => openArchiveModal(e, cashflow)}
                          >
                            <LuArchive className='w-3.5 h-3.5 mr-2' />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='text-destructive focus:text-destructive cursor-pointer'
                            onClick={(e) => openDelete(e, cashflow)}
                          >
                            <LuTrash2 className='w-3.5 h-3.5 mr-2' />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
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
                        onCheckedChange={() => handleToggleInclusion(cashflow.id)}
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
                          <LuEllipsisVertical className='w-4 h-4' aria-hidden='true' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' onCloseAutoFocus={(e) => e.preventDefault()}>
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

      {/* Organization Controls Bar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1'>
        {(() => {
          const statusTabs: StatusTabItem<'active' | 'archived'>[] = [
            {
              id: 'active',
              label: 'Active',
              count: activeOwnedCashflows.length + activeSharedCashflows.length,
              icon: LuWallet,
            },
            {
              id: 'archived',
              label: 'Archived',
              count: archivedOwnedCashflows.length,
              icon: LuArchive,
            },
          ]
          return (
            <StatusTabs
              tabs={statusTabs}
              activeTab={dashboardTab}
              onChange={setDashboardTab}
            />
          )
        })()}

        <SortSelector value={sortBy} onChange={setSortBy} />
      </div>

      {/* Cashflow Content Section */}
      {(() => {
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
              <Button onClick={() => setIsCreateModalOpen(true)} className='gap-2'>
                <LuPlus className='w-4 h-4' />
                Create Cashflow
              </Button>
            </div>
          )
        }

        if (dashboardTab === 'archived') {
          return (
            <div className='space-y-4'>
              {sortedArchivedOwned.length > 0 ? (
                <div className='grid gap-4'>
                  {sortedArchivedOwned.map((cf) => renderCashflowItem(cf))}
                </div>
              ) : (
                <div className='bg-card border border-dashed rounded-xl p-12 text-center'>
                  <div className='mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4'>
                    <LuArchive className='w-6 h-6 text-muted-foreground' />
                  </div>
                  <h3 className='font-semibold mb-1'>No archived cashflows</h3>
                  <p className='text-sm text-muted-foreground'>
                    Completed or inactive cashflows you archive will appear here.
                  </p>
                </div>
              )}
            </div>
          )
        }

        // Active tab rendering
        return (
          <div className='space-y-8'>
            {/* Pinned Cashflows (if any) */}
            {sortedPinnedOwned.length > 0 && (
              <div className='space-y-3'>
                <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  <LuPin className='w-3.5 h-3.5 text-primary' />
                  <span>Pinned ({sortedPinnedOwned.length})</span>
                </div>
                <div className='grid gap-4'>
                  {sortedPinnedOwned.map((cf) => renderCashflowItem(cf))}
                </div>
              </div>
            )}

            {/* Other Active Owned Cashflows */}
            {sortedUnpinnedOwned.length > 0 && (
              <div className='space-y-3'>
                {sortedPinnedOwned.length > 0 && (
                  <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    <span>All ({sortedUnpinnedOwned.length})</span>
                  </div>
                )}
                <div className='grid gap-4'>
                  {sortedUnpinnedOwned.map((cf) => renderCashflowItem(cf))}
                </div>
              </div>
            )}

            {/* Empty state if all owned are archived and no shared */}
            {activeOwnedCashflows.length === 0 && allSharedCashflows.length === 0 && (
              <div className='bg-card border border-dashed rounded-xl p-10 text-center'>
                <p className='text-sm text-muted-foreground mb-3'>
                  All your cashflows are currently archived.
                </p>
                <Button variant='outline' size='sm' onClick={() => setDashboardTab('archived')}>
                  View Archived ({archivedOwnedCashflows.length})
                </Button>
              </div>
            )}

            {/* Shared With Me Section */}
            {allSharedCashflows.length > 0 && (
              <div className='space-y-4 pt-2'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2'>
                  <div className='flex items-center gap-2'>
                    <div className='p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500'>
                      <LuShare2 className='w-4 h-4' />
                    </div>
                    <h2 className='text-lg font-bold tracking-tight'>Shared with me</h2>
                  </div>

                  {(hiddenSharedCashflows.length > 0 || sharedTab === 'hidden') && (
                    <div className='inline-flex items-center rounded-lg bg-muted/60 p-0.5 border border-border/40 text-xs font-medium self-start sm:self-auto'>
                      <button
                        type='button'
                        onClick={() => setSharedTab('active')}
                        className={cn(
                          'px-2.5 py-1 rounded-md transition-all',
                          sharedTab === 'active'
                            ? 'bg-background text-foreground shadow-xs font-semibold cursor-default'
                            : 'text-muted-foreground hover:text-foreground cursor-pointer',
                        )}
                      >
                        Active ({activeSharedCashflows.length})
                      </button>
                      <button
                        type='button'
                        onClick={() => setSharedTab('hidden')}
                        className={cn(
                          'px-2.5 py-1 rounded-md transition-all',
                          sharedTab === 'hidden'
                            ? 'bg-background text-foreground shadow-xs font-semibold cursor-default'
                            : 'text-muted-foreground hover:text-foreground cursor-pointer',
                        )}
                      >
                        Hidden ({hiddenSharedCashflows.length})
                      </button>
                    </div>
                  )}
                </div>

                {sharedTab === 'active' ? (
                  sortedActiveShared.length > 0 ? (
                    <div className='grid gap-4'>
                      {sortedActiveShared.map((cf) => renderCashflowItem(cf))}
                    </div>
                  ) : (
                    <div className='bg-card border border-dashed rounded-xl p-8 text-center'>
                      <p className='text-sm text-muted-foreground'>
                        No active shared cashflows. Check the Hidden tab to restore previously
                        unpinned cashflows.
                      </p>
                    </div>
                  )
                ) : sortedHiddenShared.length > 0 ? (
                  <div className='grid gap-4'>
                    {sortedHiddenShared.map((cf) => renderCashflowItem(cf))}
                  </div>
                ) : (
                  <div className='bg-card border border-dashed rounded-xl p-8 text-center'>
                    <p className='text-sm text-muted-foreground'>No hidden cashflows.</p>
                  </div>
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

      {/* Archive Confirmation Dialog */}
      <AlertDialog
        open={archiveDialogOpen}
        onOpenChange={(open) => {
          setArchiveDialogOpen(open)
          if (!open) {
            setIsArchiving(false)
            setCashflowToArchive(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Cashflow?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{cashflowToArchive?.title}&quot; will be moved to the Archived tab and hidden
              from your active totals. You can restore it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleArchiveConfirm()
              }}
              disabled={isArchiving}
              className='bg-amber-600 text-white hover:bg-amber-700'
            >
              {isArchiving ? (
                <div className='flex items-center gap-2'>
                  <LuLoader className='w-4 h-4 animate-spin' />
                  <span>Archiving...</span>
                </div>
              ) : (
                'Archive'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setIsDeleting(false)
            setActiveCashflow(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cashflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{activeCashflow?.title}&quot; and all its entries.
              This action cannot be undone.
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
