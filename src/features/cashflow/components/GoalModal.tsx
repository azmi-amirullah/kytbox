'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  ModalHeader,
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
import { addGoal, updateGoal } from '../actions';
import type { CashflowGoalDTO } from '@/types/dto';
import { getCurrencySymbol } from '@/lib/currency';

interface GoalModalProps {
  cashflowId: string;
  goal?: CashflowGoalDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string | null;
  cashflows?: { id: string; title: string }[];
}

interface GoalFormProps {
  cashflowId: string;
  goal?: CashflowGoalDTO | null;
  currency: string | null;
  onClose: () => void;
  cashflows?: { id: string; title: string }[];
}

function GoalForm({ cashflowId, goal = null, currency, onClose, cashflows = [] }: GoalFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!goal;
  const isBusy = isLoading || isPending;

  const [title, setTitle] = useState(goal?.title ?? '');
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount?.toString() ?? '');
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');
  const [selectedCashflowId, setSelectedCashflowId] = useState(goal?.cashflow_id ?? cashflowId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('cashflowId', selectedCashflowId);
    formData.append('title', title.trim());
    formData.append('targetAmount', targetAmount);
    if (deadline) {
      formData.append('deadline', deadline);
    }

    if (isEdit && goal) {
      formData.append('goalId', goal.id);
    }

    const result = isEdit ? await updateGoal(formData) : await addGoal(formData);

    if (result?.error) {
      setError(result.error);
      toast.error('Failed to save savings goal');
      setIsLoading(false);
    } else {
      toast.success(isEdit ? 'Savings goal updated!' : 'Savings goal created!');
      setIsLoading(false);
      startTransition(() => {
        router.refresh();
      });
      onClose();
    }
  }

  return (
    <>
      <ModalHeader
        title={isEdit ? 'Edit Savings Goal' : 'New Savings Goal'}
        description={
          isEdit
            ? 'Update your target savings amount and deadline.'
            : 'Set a target savings goal to track contributions from your cashflows.'
        }
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4">
          {/* Link to Cashflow Book */}
          {!isEdit && cashflows.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="goal-cashflow" className="font-medium text-foreground/80">
                Link to Cashflow Book<span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedCashflowId}
                onValueChange={setSelectedCashflowId}
              >
                <SelectTrigger id="goal-cashflow" className="w-full">
                  <SelectValue placeholder="Select Cashflow Book" />
                </SelectTrigger>
                <SelectContent>
                  {cashflows.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="goal-title" className="font-medium text-foreground/80">
              Goal Title<span className="text-destructive">*</span>
            </Label>
            <Input
              id="goal-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vacation Fund, New Laptop, Emergency Fund"
              required
              maxLength={100}
            />
          </div>

          {/* Target Amount */}
          <div className="grid gap-2">
            <Label htmlFor="goal-target-amount" className="font-medium text-foreground/80">
              Target Amount<span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex items-center justify-center font-semibold text-sm">
                {getCurrencySymbol(currency || 'USD')}
              </div>
              <Input
                id="goal-target-amount"
                name="targetAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="5000.00"
                required
                className="pl-9"
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="grid gap-2">
            <Label htmlFor="goal-deadline" className="font-medium text-foreground/80">
              Target Deadline <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <DatePicker
              id="goal-deadline"
              value={deadline}
              onChange={setDeadline}
              placeholder="Select target deadline"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center bg-destructive/10 p-2.5 rounded-md font-medium">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="py-4 mt-4">
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isBusy}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isBusy} className="flex-1">
              {isBusy ? (
                <>
                  <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                'Save Goal'
              ) : (
                'Create Goal'
              )}
            </Button>
          </div>
        </DialogFooter>
        </form>
    </>
  );
}

export default function GoalModal({
  cashflowId,
  goal = null,
  open,
  onOpenChange,
  currency,
  cashflows = [],
}: GoalModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <GoalForm
            key={goal?.id ?? 'new-goal'}
            cashflowId={cashflowId}
            goal={goal}
            currency={currency}
            onClose={() => onOpenChange(false)}
            cashflows={cashflows}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
