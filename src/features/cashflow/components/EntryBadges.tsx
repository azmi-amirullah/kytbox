'use client'

import type { CashflowEntryDTO, CashflowTagDTO } from '@/types/dto'
import { TagBadges } from './TagPicker'
import { LuRepeat, LuPaperclip } from 'react-icons/lu'
import { formatCurrencyCompact } from '@/lib/currency'
import { cn } from '@/lib/utils'

export const BADGE_BASE_CLASS =
  'inline-flex items-center h-5 px-1.5 rounded text-[10px] font-medium border leading-none shrink-0 select-none'

export function EntryTypeBadge({
  type,
  className,
}: {
  type: string
  className?: string
}) {
  const isIncome = type === 'income'
  return (
    <span
      className={cn(
        BADGE_BASE_CLASS,
        'font-bold uppercase tracking-wide',
        isIncome
          ? 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 border-emerald-400/60 dark:border-emerald-400/50'
          : 'bg-rose-500/5 text-rose-700 dark:text-rose-300 border-rose-400/60 dark:border-rose-400/50',
        className,
      )}
    >
      {type}
    </span>
  )
}

export function EntryCategoryBadge({
  category,
  className,
}: {
  category?: string | null
  className?: string
}) {
  if (!category) return null
  return (
    <span
      className={cn(
        BADGE_BASE_CLASS,
        'bg-secondary/50 text-secondary-foreground border-border/70 capitalize',
        className,
      )}
    >
      {category}
    </span>
  )
}

export function EntryReceiptBadge({
  hasReceipt,
  onClick,
  className,
}: {
  hasReceipt?: boolean
  onClick?: () => void
  className?: string
}) {
  if (!hasReceipt) return null
  return (
    <button
      type='button'
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation()
          onClick()
        }
      }}
      title='View receipt attachment'
      aria-label='View receipt attachment'
      className={cn(
        BADGE_BASE_CLASS,
        'gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-400/60 dark:border-amber-400/50 hover:bg-amber-500/20 transition-colors cursor-pointer',
        className,
      )}
    >
      <LuPaperclip className='w-2.5 h-2.5' />
      <span>Receipt</span>
    </button>
  )
}

export function EntryRecurringBadge({
  interval,
  className,
}: {
  interval?: string | null
  className?: string
}) {
  if (!interval) return null
  return (
    <span
      className={cn(
        BADGE_BASE_CLASS,
        'gap-0.5 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 border-emerald-400/60 dark:border-emerald-400/50',
        className,
      )}
    >
      <LuRepeat className='w-2.5 h-2.5' />
      <span className='capitalize text-[10px]'>{interval}</span>
    </span>
  )
}

export function EntrySplitItemsBadge({
  items,
  currency,
  className,
}: {
  items?: CashflowEntryDTO['items']
  currency?: string | null
  className?: string
}) {
  if (!items || items.length === 0) return null
  return (
    <span
      className={cn(
        BADGE_BASE_CLASS,
        'gap-1 font-semibold bg-sky-500/5 text-sky-700 dark:text-sky-300 border-sky-400/60 dark:border-sky-400/50 cursor-default',
        className,
      )}
      title={items
        .map((i) => `${i.item_name}: ${formatCurrencyCompact(i.amount, currency)}`)
        .join('\n')}
    >
      🛒 {items.length} items ({items.map((i) => i.item_name).join(', ')})
    </span>
  )
}

/**
 * Unified badge row for entries — shared by desktop table cells and mobile cards.
 */
export function EntryMetadataBadges({
  entry,
  currency,
  bookTags,
  availableTags,
  onViewReceipt,
  className,
}: {
  entry: CashflowEntryDTO
  currency?: string | null
  bookTags?: CashflowTagDTO[]
  availableTags?: string[]
  onViewReceipt?: (entry: CashflowEntryDTO) => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      <EntryCategoryBadge category={entry.category} />
      <EntrySplitItemsBadge items={entry.items} currency={currency} />
      <EntryReceiptBadge
        hasReceipt={Boolean(entry.receipt_url)}
        onClick={onViewReceipt ? () => onViewReceipt(entry) : undefined}
      />
      {entry.is_recurring && (
        <EntryRecurringBadge interval={entry.recurrence_interval} />
      )}
      <TagBadges
        tags={entry.tags}
        bookTags={bookTags}
        availableTags={availableTags}
      />
    </div>
  )
}
