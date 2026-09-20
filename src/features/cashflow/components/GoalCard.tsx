'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
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
import {
  FiTarget,
  FiPlus,
  FiEdit2,
  FiArchive,
  FiRotateCcw,
  FiCalendar,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiTrash2,
} from 'react-icons/fi'
import { LuLoader, LuPaperclip } from 'react-icons/lu'
import { toast } from 'react-toastify'
import { archiveGoal, unarchiveGoal, deleteGoal } from '../actions'
import GoalModal from './GoalModal'
import ReceiptLightbox from './ReceiptLightbox'
import type { CashflowGoalDTO } from '@/types/dto'
import { formatCurrency } from '@/lib/currency'
import { parseDateOnly, formatAppDate } from '@/lib/date-only'
import { cn } from '@/lib/utils'

interface GoalCardProps {
  cashflowId: string
  goals: CashflowGoalDTO[]
  currency: string | null
  isOwner: boolean
  canEdit?: boolean
  cashflows?: { id: string; title: string }[]
  onGoalChange?: (goal: CashflowGoalDTO) => void
  onGoalDelete?: (goalId: string) => void
}

export default function GoalCard({
  cashflowId,
  goals = [],
  currency,
  isOwner,
  canEdit = false,
  cashflows = [],
  onGoalChange,
  onGoalDelete,
}: GoalCardProps) {
  const shouldReduceMotion = useReducedMotion()

  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<CashflowGoalDTO | null>(null)
  const [viewingAttachmentGoal, setViewingAttachmentGoal] =
    useState<CashflowGoalDTO | null>(null)
  const [archiveDialogGoal, setArchiveDialogGoal] =
    useState<CashflowGoalDTO | null>(null)
  const [deleteDialogGoal, setDeleteDialogGoal] =
    useState<CashflowGoalDTO | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [unarchivingId, setUnarchivingId] = useState<string | null>(null)

  const canManage = isOwner || canEdit

  // ── Synchronized local goals state (updated instantly on API response) ───
  const [localGoals, setLocalGoals] = useState<CashflowGoalDTO[]>(goals)
  const [prevGoalsProp, setPrevGoalsProp] = useState(goals)

  if (goals !== prevGoalsProp) {
    setPrevGoalsProp(goals)
    setLocalGoals(goals)
  }

  if (!cashflowId) return null

  const activeGoals = localGoals.filter((g) => !g.is_archived)
  const archivedGoals = localGoals.filter((g) => Boolean(g.is_archived))
  const displayedGoals = tab === 'active' ? activeGoals : archivedGoals

  function handleCreateNew() {
    setEditingGoal(null)
    setModalOpen(true)
  }

  function handleEdit(goal: CashflowGoalDTO) {
    setEditingGoal(goal)
    setModalOpen(true)
  }

  function handleGoalSuccess(savedGoal: CashflowGoalDTO) {
    setLocalGoals((prev) => {
      const exists = prev.some((g) => g.id === savedGoal.id)
      if (exists) {
        return prev.map((g) => (g.id === savedGoal.id ? savedGoal : g))
      }
      return [...prev, savedGoal]
    })
    onGoalChange?.(savedGoal)
  }

  function requestArchive(goal: CashflowGoalDTO) {
    setArchiveDialogGoal(goal)
  }

  function requestPermanentDelete(goal: CashflowGoalDTO) {
    setDeleteDialogGoal(goal)
  }

  async function handleArchive(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (!archiveDialogGoal || archivingId) return

    const goal = archiveDialogGoal
    setArchivingId(goal.id)

    try {
      const result = await archiveGoal(goal.id, goal.cashflow_id)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      const updatedGoal: CashflowGoalDTO = { ...goal, is_archived: true }
      setLocalGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? updatedGoal : g)),
      )
      onGoalChange?.(updatedGoal)
      setArchiveDialogGoal(null)
      toast.success(
        goal.type === 'lent'
          ? 'Lent record archived'
          : goal.type === 'debt'
            ? 'Debt payoff archived'
            : 'Savings goal archived',
      )
    } catch (error) {
      console.error('Failed to archive target:', error)
      toast.error(
        goal.type === 'lent'
          ? 'Failed to archive lent record'
          : goal.type === 'debt'
            ? 'Failed to archive debt payoff'
            : 'Failed to archive savings goal',
      )
    } finally {
      setArchivingId(null)
    }
  }

  async function handlePermanentDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (!deleteDialogGoal || deletingId) return

    const goal = deleteDialogGoal
    setDeletingId(goal.id)

    try {
      const result = await deleteGoal(goal.id, goal.cashflow_id)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      setLocalGoals((prev) => prev.filter((g) => g.id !== goal.id))
      onGoalDelete?.(goal.id)
      setDeleteDialogGoal(null)
      toast.success(
        goal.type === 'lent'
          ? 'Lent record permanently deleted'
          : goal.type === 'debt'
            ? 'Debt payoff permanently deleted'
            : 'Savings goal permanently deleted',
      )
    } catch (error) {
      console.error('Failed to delete target:', error)
      toast.error(
        goal.type === 'lent'
          ? 'Failed to delete lent record'
          : goal.type === 'debt'
            ? 'Failed to delete debt payoff'
            : 'Failed to delete savings goal',
      )
    } finally {
      setDeletingId(null)
    }
  }

  async function handleUnarchive(goal: CashflowGoalDTO) {
    if (unarchivingId) return
    setUnarchivingId(goal.id)

    try {
      const result = await unarchiveGoal(goal.id, goal.cashflow_id)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      const updatedGoal: CashflowGoalDTO = { ...goal, is_archived: false }
      setLocalGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? updatedGoal : g)),
      )
      onGoalChange?.(updatedGoal)
      toast.success(
        goal.type === 'lent'
          ? 'Lent record restored'
          : goal.type === 'debt'
            ? 'Debt payoff restored'
            : 'Savings goal restored',
      )
    } catch (error) {
      console.error('Failed to restore target:', error)
      toast.error(
        goal.type === 'lent'
          ? 'Failed to restore lent record'
          : goal.type === 'debt'
            ? 'Failed to restore debt payoff'
            : 'Failed to restore savings goal',
      )
    } finally {
      setUnarchivingId(null)
    }
  }

  if (localGoals.length === 0) {
    if (!isOwner) return null

    return (
      <>
        <div className='rounded-xl border border-dashed border-border/80 bg-card/40 p-3 sm:p-4 backdrop-blur-xs transition-colors hover:border-primary/40'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2.5 min-w-0'>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <FiTarget className='h-4 w-4' />
              </div>
              <div className='min-w-0'>
                <h3 className='font-semibold text-foreground text-sm truncate'>
                  Track Savings, Debts & Lent
                </h3>
                <p className='text-[11px] text-muted-foreground hidden sm:block truncate'>
                  Set goals to save, track debts to pay down, or track money lent to others.
                </p>
              </div>
            </div>
            <Button
              onClick={handleCreateNew}
              size='sm'
              className='h-8 text-xs gap-1.5 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs px-3 cursor-pointer'
            >
              <FiPlus className='h-3.5 w-3.5' />
              <span>Add Target</span>
            </Button>
          </div>
        </div>

        <GoalModal
          cashflowId={cashflowId}
          goal={null}
          open={modalOpen}
          onOpenChange={setModalOpen}
          currency={currency}
          cashflows={cashflows}
          onSuccess={handleGoalSuccess}
        />
      </>
    )
  }

  return (
    <>
      <div className='space-y-4'>
        <div className='flex items-center justify-between gap-2 flex-wrap'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2'>
              <FiTarget className='h-4 w-4 text-primary' />
              <h3 className='font-semibold text-sm uppercase tracking-wider text-muted-foreground'>
                Goals, Debts & Lent
              </h3>
            </div>
            {(archivedGoals.length > 0 || tab === 'archived') && (
              <div className='inline-flex items-center rounded-lg bg-muted/60 p-0.5 border border-border/40 text-xs font-medium'>
                <button
                  type='button'
                  onClick={() => setTab('active')}
                  className={cn(
                    'px-2.5 py-1 rounded-md transition-all',
                    tab === 'active'
                      ? 'bg-background text-foreground shadow-xs font-semibold cursor-default'
                      : 'text-muted-foreground hover:text-foreground cursor-pointer',
                  )}
                >
                  Active ({activeGoals.length})
                </button>
                <button
                  type='button'
                  onClick={() => setTab('archived')}
                  className={cn(
                    'px-2.5 py-1 rounded-md transition-all',
                    tab === 'archived'
                      ? 'bg-background text-foreground shadow-xs font-semibold cursor-default'
                      : 'text-muted-foreground hover:text-foreground cursor-pointer',
                  )}
                >
                  Archived ({archivedGoals.length})
                </button>
              </div>
            )}
          </div>
          {canManage && (
            <Button
              onClick={handleCreateNew}
              variant='outline'
              size='sm'
              className='h-8 gap-1.5 text-xs border-border/60 hover:bg-accent cursor-pointer'
            >
              <FiPlus className='h-3.5 w-3.5' />
              <span>New Target</span>
            </Button>
          )}
        </div>

        {displayedGoals.length === 0 ? (
          <div className='rounded-xl border border-dashed border-border/80 bg-card/40 p-6 text-center backdrop-blur-xs'>
            {tab === 'archived' ? (
              <>
                <FiArchive className='h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-70' />
                <p className='text-sm font-medium text-foreground'>
                  No archived goals or debts
                </p>
                <p className='text-xs text-muted-foreground mt-0.5'>
                  Targets you archive will be stored here and can be restored
                  anytime.
                </p>
              </>
            ) : (
              <>
                <FiTarget className='h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-70' />
                <p className='text-sm font-medium text-foreground'>
                  No active goals or debts
                </p>
                {canManage && (
                  <Button
                    onClick={handleCreateNew}
                    size='sm'
                    className='mt-3 h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer'
                  >
                    <FiPlus className='h-3.5 w-3.5' />
                    <span>Add Target</span>
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {displayedGoals.map((goal) => {
              const isArchived = Boolean(goal.is_archived)
              const isDebt = goal.type === 'debt'
              const isLent = goal.type === 'lent'
              const hasAttachment = (isDebt || isLent) && Boolean(goal.image_url)
              const canManageGoal =
                canManage &&
                (cashflows.length === 0 ||
                  cashflows.some(
                    (cashflow) => cashflow.id === goal.cashflow_id,
                  ))
              const rawSaved = goal.saved_amount
              const progress = Math.min(
                100,
                Math.max(0, (rawSaved / goal.target_amount) * 100),
              )
              const isCompleted = progress >= 100
              const remaining = Math.max(0, goal.target_amount - rawSaved)

              // Deadline calculation
              let daysLeft: number | null = null
              let isPastDeadline = false
              if (goal.deadline) {
                const deadlineDate = parseDateOnly(goal.deadline)
                const today = new Date()
                const todayUtc = Date.UTC(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate(),
                )
                const deadlineUtc = Date.UTC(
                  deadlineDate.getFullYear(),
                  deadlineDate.getMonth(),
                  deadlineDate.getDate(),
                )
                daysLeft = Math.round((deadlineUtc - todayUtc) / 86400000)
                if (daysLeft < 0 && !isCompleted) {
                  isPastDeadline = true
                }
              }

              // Status Pace & Color Badge
              let barColor = isArchived
                ? 'from-muted-foreground/40 to-muted-foreground/30'
                : isLent
                ? 'from-amber-500 to-orange-400'
                : isDebt
                ? 'from-indigo-500 to-violet-400'
                : 'from-emerald-500 to-teal-400'
              let badgeBg = isLent
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : isDebt
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              let statusText = isLent ? 'Collecting' : isDebt ? 'Paying Down' : 'On Track'
              let StatusIcon = FiCheckCircle

              if (isArchived) {
                statusText = 'Archived'
                badgeBg =
                  'bg-muted text-muted-foreground border-border/60 font-medium'
                StatusIcon = FiArchive
              } else if (isCompleted) {
                statusText = isLent ? 'Repaid! 🎉' : isDebt ? 'Paid Off! 🎉' : 'Completed! 🎉'
                barColor = isLent
                  ? 'from-amber-400 via-orange-400 to-yellow-400'
                  : isDebt
                  ? 'from-indigo-400 via-violet-400 to-cyan-400'
                  : 'from-emerald-400 via-teal-400 to-cyan-400'
                badgeBg = isLent
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
                  : isDebt
                  ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/30'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
              } else if (isPastDeadline) {
                statusText = 'Past Deadline'
                barColor = 'from-rose-500 to-pink-500'
                badgeBg =
                  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                StatusIcon = FiAlertTriangle
              } else if (daysLeft !== null && daysLeft <= 14 && progress < 70) {
                statusText = 'Needs Push'
                barColor = 'from-amber-500 to-orange-400'
                badgeBg =
                  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                StatusIcon = FiClock
              }

              return (
                <article
                  key={goal.id}
                  className={cn(
                    'group relative overflow-hidden rounded-xl border p-5 shadow-xs transition-all',
                    isArchived
                      ? 'border-border/60 bg-card/50 opacity-85 hover:opacity-100 hover:border-border'
                      : isLent
                      ? 'border-border/80 bg-card hover:border-amber-500/40 hover:shadow-md'
                      : isDebt
                      ? 'border-border/80 bg-card hover:border-indigo-500/40 hover:shadow-md'
                      : 'border-border/80 bg-card hover:border-primary/30 hover:shadow-md',
                  )}
                >
                  {/* Header info */}
                  <div className='flex items-start justify-between gap-3 mb-3'>
                    <div>
                      <div className='flex items-center gap-1.5 flex-wrap'>
                        <h4 className='font-semibold text-foreground text-base tracking-tight'>
                          <Link
                            href={`/cashflow/goal/${goal.id}`}
                            className='hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm'
                          >
                            {goal.title}
                          </Link>
                        </h4>
                        {isDebt && (
                          <span className='inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'>
                            Debt
                          </span>
                        )}
                        {isLent && (
                          <span className='inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'>
                            Lent
                          </span>
                        )}
                        {hasAttachment && (
                          <button
                            type='button'
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setViewingAttachmentGoal(goal)
                            }}
                            className='inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/60 dark:border-amber-400/50 hover:bg-amber-500/20 transition-colors cursor-pointer'
                            title='Click to preview statement/document attachment'
                            aria-label={`View attachment for ${goal.title}`}
                          >
                            <LuPaperclip className='w-2.5 h-2.5' />
                            <span>Attachment</span>
                          </button>
                        )}
                      </div>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        {isLent ? 'Total Lent: ' : isDebt ? 'Total Debt: ' : 'Target: '}
                        {formatCurrency(goal.target_amount, currency || 'USD')}
                      </p>
                      {goal.cashflow_title && (
                        <p className='text-xs text-muted-foreground mt-0.5'>
                          Cashflow: {goal.cashflow_title}
                        </p>
                      )}
                    </div>

                    <div className='flex items-center gap-2'>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeBg}`}
                      >
                        <StatusIcon className='h-3.5 w-3.5' />
                        <span>{statusText}</span>
                      </span>

                      {canManageGoal && (
                        <div className='flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity'>
                          {isArchived ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUnarchive(goal)
                                }}
                                disabled={unarchivingId === goal.id || deletingId === goal.id}
                                className='inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer border border-border/50 shadow-2xs'
                                title='Restore Target'
                                aria-label={`Restore ${goal.title}`}
                              >
                                {unarchivingId === goal.id ? (
                                  <LuLoader className='h-3.5 w-3.5 animate-spin text-primary' />
                                ) : (
                                  <FiRotateCcw className='h-3.5 w-3.5 text-primary' />
                                )}
                                <span>Restore</span>
                              </button>

                              {isOwner && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    requestPermanentDelete(goal)
                                  }}
                                  disabled={deletingId === goal.id || unarchivingId === goal.id}
                                  className='p-1 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors rounded cursor-pointer'
                                  title='Permanently Delete Target'
                                  aria-label={`Permanently delete ${goal.title}`}
                                >
                                  {deletingId === goal.id ? (
                                    <LuLoader className='h-3.5 w-3.5 animate-spin text-destructive' />
                                  ) : (
                                    <FiTrash2 className='h-3.5 w-3.5 text-destructive' />
                                  )}
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(goal)
                                }}
                                className='p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors rounded cursor-pointer'
                                title='Edit Target'
                                aria-label={`Edit ${goal.title}`}
                              >
                                <FiEdit2 className='h-3.5 w-3.5' />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  requestArchive(goal)
                                }}
                                disabled={archivingId === goal.id}
                                className='p-1 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors rounded cursor-pointer'
                                title='Archive Target'
                                aria-label={`Archive ${goal.title}`}
                              >
                                {archivingId === goal.id ? (
                                  <LuLoader className='h-3.5 w-3.5 animate-spin text-destructive' />
                                ) : (
                                  <FiArchive className='h-3.5 w-3.5' />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amount details */}
                  <div className='flex items-baseline justify-between mb-2'>
                    <div>
                      <span className='text-2xl font-bold text-foreground tracking-tight'>
                        {isLent || isDebt
                          ? formatCurrency(remaining, currency || 'USD')
                          : formatCurrency(rawSaved, currency || 'USD')}
                      </span>
                      <span className='text-xs text-muted-foreground ml-1.5 font-medium'>
                        {isLent ? 'left to collect' : isDebt ? 'left to pay' : 'saved'}
                      </span>
                    </div>
                    <div className='text-right'>
                      <span className='text-sm font-bold text-muted-foreground'>
                        {progress.toFixed(0)}%
                      </span>
                      {(isDebt || isLent) && (
                        <span className='text-[10px] text-muted-foreground block'>
                          {isLent ? 'Collected: ' : 'Paid: '}
                          {formatCurrency(rawSaved, currency || 'USD')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar container */}
                  <div
                    role='progressbar'
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${goal.title} ${isLent ? 'lent repayment' : isDebt ? 'debt payoff' : 'savings'} progress`}
                    className='h-2.5 w-full overflow-hidden rounded-full bg-secondary/60 relative'
                  >
                    <motion.div
                      initial={
                        shouldReduceMotion
                          ? { width: `${progress}%` }
                          : { width: 0 }
                      }
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className={`h-full rounded-full bg-linear-to-r ${barColor}`}
                    />
                  </div>

                  {/* Footer deadline & days remaining */}
                  {goal.deadline && (
                    <div className='mt-3 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40'>
                      <div className='flex items-center gap-1.5'>
                        <FiCalendar className='h-3 w-3 opacity-70' />
                        <span>Deadline: {formatAppDate(goal.deadline)}</span>
                      </div>
                      <span>
                        {isPastDeadline
                          ? `${Math.abs(daysLeft ?? 0)} days overdue`
                          : daysLeft === 0
                            ? 'Due today'
                            : `${daysLeft} days left`}
                      </span>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>

      <GoalModal
        cashflowId={cashflowId}
        goal={editingGoal}
        open={modalOpen}
        onOpenChange={setModalOpen}
        currency={currency}
        cashflows={cashflows}
        onSuccess={handleGoalSuccess}
      />

      <AlertDialog
        open={archiveDialogGoal !== null}
        onOpenChange={(open) => {
          if (!open && !archivingId) setArchiveDialogGoal(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archiveDialogGoal?.type === 'lent'
                ? 'Archive lent record?'
                : archiveDialogGoal?.type === 'debt'
                  ? 'Archive debt payoff?'
                  : 'Archive savings goal?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Archive &quot;{archiveDialogGoal?.title}&quot;? Contributions and
              history will be kept. You can view or restore this{' '}
              {archiveDialogGoal?.type === 'lent'
                ? 'lent record'
                : archiveDialogGoal?.type === 'debt'
                  ? 'debt payoff'
                  : 'goal'}{' '}
              anytime from the Archived tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archivingId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={archivingId !== null}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer'
            >
              {archivingId !== null
                ? 'Archiving...'
                : archiveDialogGoal?.type === 'lent'
                  ? 'Archive lent record'
                  : archiveDialogGoal?.type === 'debt'
                    ? 'Archive debt payoff'
                    : 'Archive goal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteDialogGoal !== null}
        onOpenChange={(open) => {
          if (!open && !deletingId) setDeleteDialogGoal(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialogGoal?.type === 'lent'
                ? 'Permanently delete lent record?'
                : deleteDialogGoal?.type === 'debt'
                  ? 'Permanently delete debt payoff?'
                  : 'Permanently delete savings goal?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete &quot;{deleteDialogGoal?.title}&quot;?
              This action cannot be undone. Any linked transaction history and recurring rules will be detached from this target.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={deletingId !== null}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer'
            >
              {deletingId !== null ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReceiptLightbox
        open={Boolean(viewingAttachmentGoal)}
        onOpenChange={(open) => {
          if (!open) setViewingAttachmentGoal(null)
        }}
        cashflowId={viewingAttachmentGoal?.cashflow_id || cashflowId}
        goalId={viewingAttachmentGoal?.id}
        description={viewingAttachmentGoal?.title || 'Debt Document'}
      />
    </>
  )
}
