'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LuPlus, LuCheck, LuHandCoins, LuReceipt } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { addSplitExpenseAction } from '../../split-actions';
import { getCurrencySymbol } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface AddSplitExpenseModalProps {
  groupId: string;
  currency: string;
  deviceToken: string;
  knownParticipants: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialSettlement?: { from: string; to: string; amount: number } | null;
}

export function AddSplitExpenseModal({
  groupId,
  currency,
  deviceToken,
  knownParticipants,
  open,
  onOpenChange,
  onSuccess,
  initialSettlement = null,
}: AddSplitExpenseModalProps) {
  const [description, setDescription] = useState(
    initialSettlement ? `Payoff to ${initialSettlement.to}` : ''
  );
  const [amount, setAmount] = useState(
    initialSettlement ? String(initialSettlement.amount) : ''
  );
  const [paidBy, setPaidBy] = useState(
    initialSettlement ? initialSettlement.from : ''
  );
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    initialSettlement
      ? [initialSettlement.to]
      : knownParticipants.length > 0
      ? [...knownParticipants]
      : []
  );
  const [customNameInput, setCustomNameInput] = useState('');
  const [isSettlement, setIsSettlement] = useState(Boolean(initialSettlement));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Merge known participants with any custom ones added
  const [allParticipants, setAllParticipants] = useState<string[]>(
    Array.from(new Set([...knownParticipants, ...(initialSettlement ? [initialSettlement.from, initialSettlement.to] : [])]))
  );

  const handleAddCustomParticipant = () => {
    const trimmed = customNameInput.trim();
    if (!trimmed) return;
    if (!allParticipants.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setAllParticipants([...allParticipants, trimmed]);
    }
    if (!selectedParticipants.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedParticipants([...selectedParticipants, trimmed]);
    }
    if (!paidBy) {
      setPaidBy(trimmed);
    }
    setCustomNameInput('');
  };

  const toggleParticipant = (name: string) => {
    if (isSettlement) {
      // In settlement mode, select exactly one recipient
      setSelectedParticipants([name]);
      return;
    }
    if (selectedParticipants.includes(name)) {
      setSelectedParticipants(selectedParticipants.filter((p) => p !== name));
    } else {
      setSelectedParticipants([...selectedParticipants, name]);
    }
  };

  const handleSelectAll = () => {
    setSelectedParticipants([...allParticipants]);
  };

  const handleDeselectAll = () => {
    setSelectedParticipants([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paidBy.trim()) {
      toast.error('Please specify who paid');
      return;
    }
    if (selectedParticipants.length === 0) {
      toast.error(
        isSettlement
          ? 'Please specify who is receiving the payment'
          : 'Please select at least one person sharing the expense'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('groupId', groupId);
      formData.append('deviceToken', deviceToken);
      formData.append('description', description.trim());
      formData.append('amount', amount);
      formData.append('paid_by', paidBy.trim());
      for (const p of selectedParticipants) {
        formData.append('split_between', p);
      }
      formData.append('is_settlement', String(isSettlement));
      formData.append('honeypot', ''); // Anti-bot

      const res = await addSplitExpenseAction(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(
          isSettlement ? 'Settlement recorded!' : 'Expense added!'
        );
        onOpenChange(false);
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {isSettlement ? (
              <LuHandCoins className='w-5 h-5 text-emerald-500' />
            ) : (
              <LuReceipt className='w-5 h-5 text-primary' />
            )}
            <span>{isSettlement ? 'Record Debt Settlement' : 'Add Shared Expense'}</span>
          </DialogTitle>
          <DialogDescription>
            {isSettlement
              ? 'Log a direct debt payoff between group members.'
              : 'Add an expense to split among group members with zero sign-up required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-1'>
          {/* Settlement Toggle */}
          <div className='flex items-center justify-between rounded-lg border p-2.5 bg-muted/20'>
            <div className='space-y-0.5 pr-2'>
              <Label htmlFor='is-settlement' className='text-xs font-semibold cursor-pointer'>
                This is a Settlement / Debt Payoff
              </Label>
              <p className='text-[11px] text-muted-foreground'>
                Payoffs adjust individual balances without inflating the group trip total.
              </p>
            </div>
            <Switch
              id='is-settlement'
              checked={isSettlement}
              onCheckedChange={setIsSettlement}
            />
          </div>

          {/* Description */}
          <div className='space-y-1.5'>
            <Label htmlFor='split-desc'>Description<span className='text-destructive'>*</span></Label>
            <Input
              id='split-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isSettlement ? 'e.g. Settle up for Airbnb' : 'e.g. Seafood Dinner'}
              required
            />
          </div>

          {/* Amount */}
          <div className='space-y-1.5'>
            <Label htmlFor='split-amount'>
              Amount ({currency})<span className='text-destructive'>*</span>
            </Label>
            <div className='relative'>
              <span className='pointer-events-none absolute inset-y-0 left-3 flex items-center font-medium text-muted-foreground text-sm select-none'>
                {getCurrencySymbol(currency)}
              </span>
              <Input
                id='split-amount'
                type='number'
                step='any'
                min='0.01'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder='0.00'
                required
                className={cn('font-medium', getCurrencySymbol(currency).length > 1 ? 'pl-10' : 'pl-8')}
              />
            </div>
          </div>

          {/* Paid By */}
          <div className='space-y-1.5'>
            <Label htmlFor='split-payer'>
              {isSettlement ? 'Paid By (Debtor)' : 'Paid By'}<span className='text-destructive'>*</span>
            </Label>
            <Input
              id='split-payer'
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              placeholder='Name of person who paid'
              required
            />
            {allParticipants.length > 0 && (
              <div className='flex items-center gap-1.5 flex-wrap pt-1'>
                <span className='text-[11px] text-muted-foreground'>Quick select:</span>
                {allParticipants.map((p) => (
                  <button
                    key={p}
                    type='button'
                    onClick={() => setPaidBy(p)}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full border transition-all',
                      paidBy.toLowerCase() === p.toLowerCase()
                        ? 'bg-primary text-primary-foreground font-semibold border-primary'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Split Between / Beneficiaries */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs font-semibold'>
                {isSettlement ? 'Paid To (Creditor)' : 'Split Between'}
                <span className='text-destructive'>*</span>
              </Label>
              {!isSettlement && allParticipants.length > 1 && (
                <div className='flex gap-2 text-[11px]'>
                  <button
                    type='button'
                    onClick={handleSelectAll}
                    className='text-primary hover:underline'
                  >
                    All
                  </button>
                  <span className='text-muted-foreground'>•</span>
                  <button
                    type='button'
                    onClick={handleDeselectAll}
                    className='text-muted-foreground hover:underline'
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Participant Chips */}
            {allParticipants.length > 0 && (
              <div className='flex items-center gap-1.5 flex-wrap'>
                {allParticipants.map((p) => {
                  const isSelected = selectedParticipants.some(
                    (s) => s.toLowerCase() === p.toLowerCase()
                  );
                  return (
                    <button
                      key={p}
                      type='button'
                      onClick={() => toggleParticipant(p)}
                      className={cn(
                        'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all',
                        isSelected
                          ? 'bg-primary/10 text-primary border-primary/40 font-semibold'
                          : 'bg-card text-muted-foreground border-border hover:bg-muted/50'
                      )}
                    >
                      {isSelected && <LuCheck className='w-3 h-3' />}
                      <span>{p}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Add New Participant Input */}
            <div className='flex gap-1.5 pt-1'>
              <Input
                value={customNameInput}
                onChange={(e) => setCustomNameInput(e.target.value)}
                placeholder='Add participant name...'
                className='h-8 text-xs'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomParticipant();
                  }
                }}
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleAddCustomParticipant}
                className='h-8 text-xs gap-1 shrink-0'
              >
                <LuPlus className='w-3 h-3' />
                <span>Add</span>
              </Button>
            </div>
          </div>

          {/* Footer Submit */}
          <div className='flex justify-end gap-2 pt-3 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : isSettlement
                ? 'Record Settlement'
                : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
