'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { LuPencil, LuTrash2, LuLoader } from 'react-icons/lu';
import { calculateBudgetStatus, formatCategoryName } from '../math';
import type { CashflowBudgetDTO, CashflowEntryDTO } from '@/types/dto';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface BudgetProgressProps {
  budget: CashflowBudgetDTO;
  entries: CashflowEntryDTO[];
  currency: string | null;
  canEdit: boolean;
  onEdit: (budget: CashflowBudgetDTO) => void;
  onDelete: (budgetId: string) => void;
  isDeleting: boolean;
}

export default function BudgetProgress({
  budget,
  entries,
  currency,
  canEdit,
  onEdit,
  onDelete,
  isDeleting,
}: BudgetProgressProps) {
  const status = useMemo(
    () => calculateBudgetStatus(budget, entries),
    [entries, budget],
  );
  const { spent, pct, isOverBudget, isAtLimit, isWarning, hasRollover, rolloverSurplus, effectiveLimit, availableSpend } = status;

  const barColor = isOverBudget
    ? 'bg-red-700'
    : isAtLimit
      ? 'bg-red-500'
      : isWarning
        ? 'bg-amber-400'
        : 'bg-emerald-500';

  const textColor = isOverBudget
    ? 'text-red-700 dark:text-red-400'
    : isAtLimit
      ? 'text-red-600 dark:text-red-400'
      : isWarning
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-emerald-600 dark:text-emerald-400';

  const categoryLabel = formatCategoryName(budget.category);

  return (
    <div className='bg-card border rounded-xl p-4 space-y-3'>
      {/* Header row */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-1.5 min-w-0 flex-wrap'>
          <span className='font-medium text-sm truncate'>
            {categoryLabel}
          </span>
          {hasRollover && rolloverSurplus !== undefined && rolloverSurplus !== 0 && (
            <span
              className={cn(
                'shrink-0 text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded-full border',
                rolloverSurplus > 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              )}
            >
              {rolloverSurplus > 0 ? '+' : ''}
              {formatCurrencyCompact(rolloverSurplus, currency)} Rollover
            </span>
          )}
          {isOverBudget && (
            <span className='shrink-0 text-[10px] font-bold uppercase tracking-widest bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded-full'>
              Over Budget
            </span>
          )}
          {isAtLimit && (
            <span className='shrink-0 text-[10px] font-bold uppercase tracking-widest bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full'>
              Maxed Out
            </span>
          )}
        </div>

        {canEdit && (
          <div className='flex items-center gap-1 shrink-0'>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
              onClick={() => onEdit(budget)}
              aria-label={`Edit ${categoryLabel} budget`}
            >
              <LuPencil className='w-3.5 h-3.5' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 text-destructive hover:text-destructive'
              onClick={() => onDelete(budget.id)}
              disabled={isDeleting}
              aria-label={`Delete ${categoryLabel} budget`}
            >
              {isDeleting ? (
                <LuLoader className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <LuTrash2 className='w-3.5 h-3.5' />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div
        role='progressbar'
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${categoryLabel} budget: ${Math.round(pct)}% used`}
        className='h-2 w-full rounded-full bg-secondary overflow-hidden'
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Spend vs. limit */}
      <div className='flex items-center justify-between text-xs'>
        <span className={`font-semibold ${textColor}`}>
          {formatCurrencyCompact(spent, currency)} spent
        </span>
        <span className='text-muted-foreground'>
          of {formatCurrencyCompact(effectiveLimit ?? budget.amount, currency)} limit
          {availableSpend !== undefined && (
            <span className='ml-1 text-[11px] opacity-80'>
              ({formatCurrencyCompact(Math.max(0, availableSpend), currency)} left)
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
