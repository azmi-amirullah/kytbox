'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LuPlus, LuLoader, LuChartBar } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { deleteBudget } from '../actions';
import type { CashflowBudgetDTO, CashflowEntryDTO } from '@/types/dto';
import BudgetProgress from './BudgetProgress';
import BudgetModal from './BudgetModal';

interface BudgetManagerProps {
  cashflowId: string;
  budgets: CashflowBudgetDTO[];
  entries: CashflowEntryDTO[];
  currency: string | null;
  canEdit: boolean;
}

export default function BudgetManager({
  cashflowId,
  budgets,
  entries,
  currency,
  canEdit,
}: BudgetManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<CashflowBudgetDTO | null>(
    null,
  );
  const [modalKey, setModalKey] = useState(0);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Sort budgets by spend percentage descending (highest risk first)
  const sortedBudgets = useMemo(() => {
    if (budgets.length === 0) return budgets;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return [...budgets].sort((a, b) => {
      const spentFor = (item: CashflowBudgetDTO) =>
        entries
          .filter((e) => {
            if (e.type !== 'expense' || e.category !== item.category)
              return false;
            const [year, month] = e.date.split('-').map(Number);
            return year === currentYear && month - 1 === currentMonth;
          })
          .reduce((sum, e) => sum + Number(e.amount), 0);

      const pctA = a.amount > 0 ? spentFor(a) / a.amount : 0;
      const pctB = b.amount > 0 ? spentFor(b) / b.amount : 0;
      return pctB - pctA;
    });
  }, [budgets, entries]);

  function openAdd() {
    setEditingBudget(null);
    setModalKey((k) => k + 1);
    setIsModalOpen(true);
  }

  function openEdit(budget: CashflowBudgetDTO) {
    setEditingBudget(budget);
    setModalKey((k) => k + 1);
    setIsModalOpen(true);
  }

  async function handleDelete(budgetId: string) {
    setIsDeletingId(budgetId);
    startTransition(async () => {
      const result = await deleteBudget(budgetId);
      if (result.error) {
        toast.error('Failed to delete budget');
        setIsDeletingId(null);
        setDeletingBudgetId(null);
      } else {
        toast.success('Budget removed');
        setDeletingBudgetId(null);
        router.refresh();
      }
    });
  }

  return (
    <div className='space-y-4'>
      {/* Section Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-bold tracking-tight flex items-center gap-2'>
            <LuChartBar className='w-5 h-5 text-muted-foreground' />
            Budget Tracker
          </h2>
          <p className='text-sm text-muted-foreground'>
            Monthly spending limits by category
          </p>
        </div>
        {canEdit && (
          <Button onClick={openAdd} variant='outline' size='sm' className='gap-2'>
            <LuPlus className='w-4 h-4' />
            Set Budget
          </Button>
        )}
      </div>

      {/* Budget Cards */}
      {sortedBudgets.length === 0 ? (
        <div className='bg-card border rounded-xl p-8 text-center text-muted-foreground'>
          <LuChartBar className='w-8 h-8 mx-auto mb-3 opacity-30' />
          <p className='text-sm mb-3'>No budgets set yet.</p>
          {canEdit && (
            <Button onClick={openAdd} variant='outline' size='sm' className='gap-2'>
              <LuPlus className='w-4 h-4' />
              Set your first budget
            </Button>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 @md:grid-cols-2 @4xl:grid-cols-3 gap-3'>
          {sortedBudgets.map((budget) => (
            <BudgetProgress
              key={budget.id}
              budget={budget}
              entries={entries}
              currency={currency}
              canEdit={canEdit}
              onEdit={openEdit}
              onDelete={(id) => setDeletingBudgetId(id)}
              isDeleting={isDeletingId === budget.id && isPending}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal — key forces full remount on every open so state is always fresh */}
      <BudgetModal
        key={`${modalKey}-${editingBudget?.id ?? 'new'}`}
        cashflowId={cashflowId}
        budget={editingBudget}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        currency={currency}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingBudgetId}
        onOpenChange={() => setDeletingBudgetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Budget?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this spending limit. Your transaction
              history will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deletingBudgetId) handleDelete(deletingBudgetId);
              }}
              disabled={!!isDeletingId && isPending}
              className='bg-destructive text-white hover:bg-destructive/90 min-w-[80px]'
            >
              {isDeletingId && isPending ? (
                <div className='flex items-center gap-2'>
                  <LuLoader className='w-3.5 h-3.5 animate-spin' />
                  <span>Removing...</span>
                </div>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
