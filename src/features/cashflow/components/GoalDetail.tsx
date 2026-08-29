'use client'

import { useState, useMemo } from 'react'
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
import { LuTarget, LuSearch, LuTrendingUp, LuCalendar } from 'react-icons/lu'
import { FiCheckCircle, FiClock, FiAlertTriangle } from 'react-icons/fi'
import { formatCurrency } from '@/lib/currency'
import { parseDateOnly, formatAppDate } from '@/lib/date-only'
import type { CashflowGoalDTO, CashflowEntryDTO } from '@/types/dto'

interface GoalDetailProps {
  goal: CashflowGoalDTO
  entries: CashflowEntryDTO[]
  currency: string | null
}

export default function GoalDetail({ goal, entries, currency }: GoalDetailProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('all')

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

  const statusIcon = isCompleted
    ? <FiCheckCircle className='w-5 h-5 text-emerald-500' />
    : isOverdue
    ? <FiAlertTriangle className='w-5 h-5 text-destructive' />
    : <FiClock className='w-5 h-5 text-amber-500' />

  const statusLabel = isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'On Track'
  const statusVariant: 'default' | 'destructive' | 'secondary' = isCompleted
    ? 'default'
    : isOverdue
    ? 'destructive'
    : 'secondary'

  return (
    <div className='space-y-6'>
      {/* Breadcrumbs */}
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
              <Badge variant={statusVariant} className='gap-1 text-xs'>
                {statusIcon}
                {statusLabel}
              </Badge>
            </div>
            <p className='text-sm text-muted-foreground mt-0.5'>
              Target: {formatCurrency(goal.target_amount, currency)}
              {goal.cashflow_title && (
                <span className='ml-2'>
                  {' | Cashflow: ' + goal.cashflow_title}
                </span>
              )}
              {deadline && (
                <span className='ml-2'>
                  {' · Due '}
                  {formatAppDate(deadline)}
                </span>
              )}
            </p>
          </div>
        </div>

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-card border rounded-2xl p-6 space-y-4'
      >
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='space-y-1'>
            <p className='text-xs text-muted-foreground uppercase tracking-wider'>Saved</p>
            <p className='text-2xl font-bold text-emerald-500'>
              {formatCurrency(totalSaved, currency)}
            </p>
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
        <div className='space-y-1.5'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>
              {goal.contribution_count} contributions
            </span>
            <span className='font-semibold'>{progress.toFixed(1)}%</span>
          </div>
          <div className='h-3 bg-muted rounded-full overflow-hidden'>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: progress + '%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className='h-full rounded-full bg-emerald-500'
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
            {'Contributions (' + filtered.length + ')'}
          </h2>
          <div className='flex gap-2 flex-wrap'>
            <div className='relative'>
              <LuSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground' />
              <Input
                className='pl-8 h-8 w-44 text-sm'
                placeholder='Search...'
                aria-label='Search contributions'
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
                ? 'No contributions yet. Add an entry with category "Goal: ' + goal.title + '" in any cashflow book.'
                : 'No matching contributions.'}
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
                    <td className='px-4 py-3 text-right font-semibold text-emerald-500 tabular-nums'>
                      +{formatCurrency(Number(entry.amount), currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
