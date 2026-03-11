'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LuLoader } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { upsertBudget } from '../actions';
import type { CashflowBudgetDTO } from '@/types/dto';
import { getCurrencySymbol } from '@/lib/currency';
import { budgetExpenseCategorySchema } from '@/lib/validation.schemas.client';

const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transportation' },
  { value: 'utilities', label: 'Utilities & Bills' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'other', label: 'Other Expense' },
] as const;

interface BudgetModalProps {
  cashflowId: string;
  budget?: CashflowBudgetDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string | null;
}

export default function BudgetModal({
  cashflowId,
  budget = null,
  open,
  onOpenChange,
  currency,
}: BudgetModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!budget;
  const isBusy = isLoading || isPending;

  const [category, setCategory] = useState(
    budgetExpenseCategorySchema.parse(budget?.category),
  );
  const [amount, setAmount] = useState(budget?.amount?.toString() ?? '');

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('cashflowId', cashflowId);
    formData.append('category', category);
    formData.append('amount', amount);

    const result = await upsertBudget(formData);

    if (result?.error) {
      setError(result.error);
      toast.error('Failed to save budget');
      setIsLoading(false);
    } else {
      toast.success(isEdit ? 'Budget updated!' : 'Budget created!');
      setIsLoading(false);
      startTransition(() => {
        router.refresh();
      });
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[400px] overflow-hidden p-0 gap-0'>
        <div className='p-6 pb-0'>
          <DialogHeader className='mb-6'>
            <DialogTitle className='text-xl text-center'>
              {isEdit ? 'Edit Budget' : 'Set Budget'}
            </DialogTitle>
            <DialogDescription className='text-center'>
              {isEdit
                ? 'Update the spending limit for this category.'
                : 'Set a monthly spending limit for an expense category.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid gap-4'>
              {/* Category */}
              <div className='grid gap-2'>
                <Label className='font-medium text-foreground/80'>
                  Category<span className='text-destructive'>*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(v) =>
                    setCategory(budgetExpenseCategorySchema.parse(v))
                  }
                  disabled={isEdit}
                >
                  <SelectTrigger className='bg-background/50 border-input/60'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEdit && (
                  <p className='text-[10px] text-muted-foreground'>
                    Category cannot be changed. Delete and create a new budget
                    to change it.
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className='grid gap-2'>
                <Label
                  htmlFor='budget-amount'
                  className='font-medium text-foreground/80 gap-0.5'
                >
                  Monthly Limit<span className='text-destructive'>*</span>
                </Label>
                <div className='relative'>
                  <div className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex items-center justify-center font-semibold text-sm'>
                    {getCurrencySymbol(currency || 'USD')}
                  </div>
                  <Input
                    id='budget-amount'
                    name='amount'
                    type='number'
                    step='0.01'
                    min='0.01'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder='0.00'
                    required
                    className='pl-9 bg-background/50 border-input/60 focus:border-primary/50 transition-colors'
                  />
                </div>
              </div>

              {error && (
                <p className='text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md font-medium'>
                  {error}
                </p>
              )}
            </div>

            <DialogFooter className='py-4 mt-4'>
              <div className='flex w-full gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  disabled={isBusy}
                  className='flex-1'
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isBusy} className='flex-1'>
                  {isBusy ? (
                    <>
                      <LuLoader className='mr-2 h-4 w-4 animate-spin' />
                      Saving...
                    </>
                  ) : isEdit ? (
                    'Save Changes'
                  ) : (
                    'Set Budget'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
