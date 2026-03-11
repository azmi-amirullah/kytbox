'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { LuPencil, LuTrash2, LuLoader } from 'react-icons/lu';
import type { CashflowBudgetDTO, CashflowEntryDTO } from '@/types/dto';
import { formatCurrencyCompact } from '@/lib/currency';

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food & Dining',
  transport: 'Transportation',
  utilities: 'Utilities & Bills',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  health: 'Health & Fitness',
  other: 'Other Expense',
};

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
  const { spent, pct } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const spent = entries
      .filter((e) => {
        if (e.type !== 'expense') return false;
        if (e.category !== budget.category) return false;
        const [year, month] = e.date.split('-').map(Number);
        return year === currentYear && month - 1 === currentMonth;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    return { spent, pct };
  }, [entries, budget]);

  // Compare raw amounts to avoid floating-point imprecision from percentage math.
  // Over budget = strictly exceeded. At limit = exactly used up.
  const isOverBudget = spent > budget.amount;
  const isAtLimit = !isOverBudget && pct >= 100;
  const isWarning = pct >= 80 && pct < 100;

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

  return (
    <div className='bg-card border rounded-xl p-4 space-y-3'>
      {/* Header row */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2 min-w-0'>
          <span className='font-medium text-sm truncate'>
            {CATEGORY_LABELS[budget.category] ?? budget.category}
          </span>
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
              aria-label={`Edit ${CATEGORY_LABELS[budget.category] ?? budget.category} budget`}
            >
              <LuPencil className='w-3.5 h-3.5' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 text-destructive hover:text-destructive'
              onClick={() => onDelete(budget.id)}
              disabled={isDeleting}
              aria-label={`Delete ${CATEGORY_LABELS[budget.category] ?? budget.category} budget`}
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
        aria-label={`${CATEGORY_LABELS[budget.category] ?? budget.category} budget: ${Math.round(pct)}% used`}
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
          of {formatCurrencyCompact(budget.amount, currency)} limit
        </span>
      </div>
    </div>
  );
}
