'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  LuTarget,
  LuSearch,
  LuTrendingUp,
  LuCalendar,
  LuFileText,
  LuEye,
  LuLoader,
} from 'react-icons/lu'
import { FiCheckCircle, FiClock, FiAlertTriangle, FiArchive } from 'react-icons/fi'
import { formatCurrency } from '@/lib/currency'
import { parseDateOnly, formatAppDate } from '@/lib/date-only'
import { cn } from '@/lib/utils'
import type { CashflowGoalDTO, CashflowEntryDTO } from '@/types/dto'
import { getGoalImageSignedUrl } from '../actions'
import ReceiptLightbox from './ReceiptLightbox'

interface GoalDetailProps {
  goal: CashflowGoalDTO
  entries: CashflowEntryDTO[]
  currency: string | null
}

export default function GoalDetail({ goal, entries, currency }: GoalDetailProps) {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || searchParams.get('search') || ''
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedMonth, setSelectedMonth] = useState('all')

  const isDebt = goal.type === 'debt'
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null)
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(
    () => Boolean(isDebt && goal.image_url && goal.cashflow_id),
  )
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  useEffect(() => {
    if (!isDebt || !goal.image_url || !goal.cashflow_id) return
    let isMounted = true
    getGoalImageSignedUrl(goal.cashflow_id, goal.id)
      .then((res) => {
        if (isMounted && res.signedUrl) {
          setSignedImageUrl(res.signedUrl)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingThumbnail(false)
      })
    return () => {
      isMounted = false
    }
  }, [isDebt, goal.image_url, goal.cashflow_id, goal.id])

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search')
    if (q !== null) {
      setSearchQuery(q)
    }
  }, [searchParams])

  const totalSaved = goal.saved_amount
  const progress = Math.min(100, Math.max(0, (totalSaved / goal.target_amount) * 100))
  const remaining = Math.max(0, goal.target_amount - totalSaved)
  const isCompleted = totalSaved >= goal.target_amount

  const deadline = goal.deadline ? parseDateOnly(goal.deadline) : null
  const today = new Date()
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const daysLeft = deadline
    ? Math.round(
        (Date.UTC(
          deadline.getFullYear(),
          deadline.getMonth(),
          deadline.getDate(),
        ) - todayUtc) / 86400000,
      )
    : null
  const isOverdue = daysLeft !== null && daysLeft < 0 && !isCompleted

  const uniqueMonths = useMemo(() => {
    const set = new Set<string>()
    for (const e of entries) {
      const d = parseDateOnly(e.date)
      const yr = d.getFullYear()
      const mo = String(d.getMonth() + 1).padStart(2, '0')
      set.add(yr + '-' + mo)
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [entries])

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch =
        !searchQuery ||
        (e.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.amount.toString().includes(searchQuery)
      const d = parseDateOnly(e.date)
      const mo = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
      const matchMonth = selectedMonth === 'all' || mo === selectedMonth
      return matchSearch && matchMonth
    })
  }, [entries, searchQuery, selectedMonth])

  const isArchived = Boolean(goal.is_archived)

  const statusIcon = isArchived
    ? <FiArchive className='w-5 h-5 text-muted-foreground' />
    : isCompleted
    ? <FiCheckCircle className={cn('w-5 h-5', isDebt ? 'text-indigo-500' : 'text-emerald-500')} />
    : isOverdue
    ? <FiAlertTriangle className='w-5 h-5 text-destructive' />
    : <FiClock className='w-5 h-5 text-amber-500' />

  const statusLabel = isArchived
    ? 'Archived'
    : isCompleted
    ? (isDebt ? 'Paid Off' : 'Completed')
    : isOverdue
    ? 'Overdue'
    : (isDebt ? 'Paying Down' : 'On Track')

  const statusVariant: 'default' | 'destructive' | 'secondary' | 'outline' = isArchived
    ? 'outline'
    : isCompleted
    ? 'default'
    : isOverdue
    ? 'destructive'
    : 'secondary'

  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='space-y-1.5 sm:space-y-2'>
        <BreadcrumbNav
          items={[
            { label: 'Cashflow', href: '/cashflow' },
            ...(goal.cashflow_id && goal.cashflow_title
              ? [
                  {
                    label: goal.cashflow_title,
                    href: `/cashflow/${goal.cashflow_id}`,
                  },
                ]
              : []),
            { label: goal.title },
          ]}
        />

        {/* Header */}
        <div className='flex items-center gap-3'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <h1 className='text-2xl font-bold tracking-tight'>{goal.title}</h1>
              {isDebt && (
                <Badge
                  variant='outline'
                  className='text-xs font-semibold text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/10'
                >
                  Debt Paydown
                </Badge>
              )}
              <Badge variant={statusVariant} className='gap-1 text-xs'>
                {statusIcon}
                {statusLabel}
              </Badge>
            </div>
            <p className='text-sm text-muted-foreground mt-0.5'>
              {isDebt ? 'Total Debt: ' : 'Target: '}
              {formatCurrency(goal.target_amount, currency)}
              {goal.cashflow_title && (
                <span className='ml-2'>
                  {' | Cashflow: ' + goal.cashflow_title}
                </span>
              )}
              {deadline && (
                <span className='ml-2'>
                  {isDebt ? ' · Payoff target ' : ' · Due '}
                  {formatAppDate(deadline)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {isArchived && (
        <div className='flex items-center gap-2.5 rounded-xl border border-border/80 bg-muted/40 p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground backdrop-blur-xs'>
          <FiArchive className='h-4 w-4 shrink-0 text-muted-foreground' />
          <span>
            {isDebt
              ? 'This debt target is archived. Historical payment records are preserved, but active payments and recurring deductions are paused.'
              : 'This savings goal is archived. Historical contribution records are preserved, but active contributions and recurring deductions are paused.'}
          </span>
        </div>
      )}

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-card border rounded-2xl p-6 space-y-4'
      >
        {isDebt ? (
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground uppercase tracking-wider font-semibold'>Left to Pay</p>
              <p className='text-2xl font-bold text-indigo-600 dark:text-indigo-400'>
                {formatCurrency(remaining, currency)}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground uppercase tracking-wider'>Total Debt</p>
              <p className='text-2xl font-bold'>{formatCurrency(goal.target_amount, currency)}</p>
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground uppercase tracking-wider'>Total Paid</p>
              <p className='text-2xl font-bold text-muted-foreground'>
                {formatCurrency(totalSaved, currency)}
              </p>
              {goal.initial_amount > 0 && (
                <p className='text-[11px] text-muted-foreground'>
                  (incl. {formatCurrency(goal.initial_amount, currency)} starting)
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground uppercase tracking-wider'>Saved</p>
              <p className='text-2xl font-bold text-emerald-500'>
                {formatCurrency(totalSaved, currency)}
              </p>
              {goal.initial_amount > 0 && (
                <p className='text-[11px] text-muted-foreground'>
                  (incl. {formatCurrency(goal.initial_amount, currency)} starting)
                </p>
              )}
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground uppercase tracking-wider'>Target</p>
              <p className='text-2xl font-bold'>{formatCurrency(goal.target_amount, currency)}</p>
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground uppercase tracking-wider'>Remaining</p>
              <p className='text-2xl font-bold text-muted-foreground'>
                {formatCurrency(remaining, currency)}
              </p>
            </div>
          </div>
        )}
        <div className='space-y-1.5'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>
              {goal.contribution_count} {isDebt ? 'payments in Kytbox' : 'contributions in Kytbox'}
              {goal.initial_amount > 0 ? ` · +${formatCurrency(goal.initial_amount, currency)} starting` : ''}
            </span>
            <span className='font-semibold'>{progress.toFixed(1)}%{isDebt ? ' paid' : ''}</span>
          </div>
          <div className='h-3 bg-muted rounded-full overflow-hidden'>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: progress + '%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn('h-full rounded-full', isDebt ? 'bg-indigo-500' : 'bg-emerald-500')}
            />
          </div>
        </div>
        {daysLeft !== null && !isCompleted && (
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <LuCalendar className='w-3.5 h-3.5' />
            {isOverdue
              ? Math.abs(daysLeft) + ' days overdue'
              : daysLeft + ' days remaining'}
          </div>
        )}
      </motion.div>

      {/* Attached Document Card (Debt only) */}
      {isDebt && goal.image_url && (
        <div className='flex items-center justify-between p-3.5 bg-card border rounded-xl gap-3'>
          <div
            role='button'
            tabIndex={0}
            onClick={() => setIsLightboxOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsLightboxOpen(true)
              }
            }}
            className='flex items-center gap-3 min-w-0 flex-1 cursor-pointer group'
            title='Click to view statement in full screen'
          >
            <div className='relative w-12 h-12 rounded-lg border border-border/70 bg-muted/40 overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-primary/50 transition-all flex items-center justify-center'>
              {isLoadingThumbnail ? (
                <LuLoader className='w-5 h-5 animate-spin text-muted-foreground' />
              ) : signedImageUrl ? (
                /* Senior justification: Native <img> is required because signedImageUrl is a short-lived Supabase Storage signed URL */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={signedImageUrl}
                  alt='Debt document thumbnail'
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
                />
              ) : (
                <LuFileText className='w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors' />
              )}
            </div>
            <div className='min-w-0'>
              <p className='text-sm font-semibold truncate group-hover:text-primary transition-colors'>
                Attached Statement / Document
              </p>
              <p className='text-xs text-muted-foreground'>
                Click to preview in full screen
              </p>
            </div>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setIsLightboxOpen(true)}
            className='gap-1.5 text-xs shrink-0 cursor-pointer'
          >
            <LuEye className='w-3.5 h-3.5' />
            <span>View Attachment</span>
          </Button>
        </div>
      )}

      {goal.contribution_count > entries.length && (
        <p className='text-xs text-muted-foreground'>
          Showing the 1,000 most recent contributions.
        </p>
      )}

      {/* Entries */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between gap-3 flex-wrap'>
          <h2 className='text-base font-semibold flex items-center gap-2'>
            <LuTrendingUp className='w-4 h-4' />
            {(isDebt ? 'Payments (' : 'Contributions (') + filtered.length + ')'}
          </h2>
          <div className='flex gap-2 flex-wrap'>
            <div className='relative'>
              <LuSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground' />
              <Input
                className='pl-8 h-8 w-44 text-sm'
                placeholder={isDebt ? 'Search payments...' : 'Search contributions...'}
                aria-label={isDebt ? 'Search payments' : 'Search contributions'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {uniqueMonths.length > 0 && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger
                  className='h-8 w-36 text-sm'
                  aria-label='Filter contributions by month'
                >
                  <SelectValue placeholder='All months' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All months</SelectItem>
                  {uniqueMonths.map((m) => {
                    const parts = m.split('-')
                    const label = new Date(
                      Number(parts[0]),
                      Number(parts[1]) - 1,
                    ).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    return (
                      <SelectItem key={m} value={m}>
                        {label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className='bg-card border border-dashed rounded-xl p-10 text-center'>
            <LuTarget className='w-8 h-8 text-muted-foreground mx-auto mb-3' />
            <p className='text-sm text-muted-foreground'>
              {entries.length === 0
                ? isDebt
                  ? 'No payments yet. Add an entry with category "Debt: ' + goal.title + '" in any cashflow book.'
                  : 'No contributions yet. Add an entry with category "Goal: ' + goal.title + '" in any cashflow book.'
                : (isDebt ? 'No matching payments.' : 'No matching contributions.')}
            </p>
          </div>
        ) : (
          <div className='bg-card border rounded-xl overflow-hidden'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider'>
                  <th scope='col' className='text-left px-4 py-3 font-medium'>Date</th>
                  <th scope='col' className='text-left px-4 py-3 font-medium hidden sm:table-cell'>Description</th>
                  <th scope='col' className='text-right px-4 py-3 font-medium'>Amount</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/50'>
                {filtered.map((entry) => (
                  <tr key={entry.id} className='hover:bg-muted/20 transition-colors'>
                    <td className='px-4 py-3 text-muted-foreground whitespace-nowrap'>
                      {formatAppDate(entry.date)}
                    </td>
                    <td className='px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-xs truncate'>
                      {entry.description ?? '—'}
                    </td>
                    <td className={cn('px-4 py-3 text-right font-semibold tabular-nums', isDebt ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-500')}>
                      +{formatCurrency(Number(entry.amount), currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isDebt && goal.image_url && (
        <ReceiptLightbox
          open={isLightboxOpen}
          onOpenChange={setIsLightboxOpen}
          cashflowId={goal.cashflow_id}
          goalId={goal.id}
          previewUrl={signedImageUrl}
          description={goal.title}
        />
      )}
    </div>
  )
}
