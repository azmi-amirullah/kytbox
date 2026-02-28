'use client';

import { useState, useTransition, useEffect } from 'react';
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
import { LuLoader, LuFileText, LuCalendar } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { addEntry, updateEntry } from '../actions';
import type { CashflowEntryDTO } from '@/types/dto';
import { getCurrencySymbol } from '@/lib/currency';
import { entryTypeSchema } from '@/lib/validation.schemas.client';

interface EntryModalProps {
  cashflowId: string;
  entry?: CashflowEntryDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string | null;
}

export default function EntryModal({
  cashflowId,
  entry = null,
  open,
  onOpenChange,
  currency,
}: EntryModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [shouldClose, setShouldClose] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [description, setDescription] = useState(entry?.description || '');
  const [amount, setAmount] = useState(entry?.amount?.toString() || '');
  const [type, setType] = useState<'income' | 'expense'>(
    entryTypeSchema.parse(entry?.type),
  );
  const [date, setDate] = useState(entry?.date || today);

  const isBusy = isLoading || isPending;
  const isEdit = !!entry;

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setDescription(entry?.description || '');
        setAmount(entry?.amount?.toString() || '');
        setType(entryTypeSchema.parse(entry?.type));
        setDate(entry?.date || today);
        setError(null);
        setIsLoading(false);
      });
    }
  }, [open, entry, today]);

  useEffect(() => {
    if (shouldClose && !isPending) {
      queueMicrotask(() => {
        onOpenChange(false);
        setShouldClose(false);
      });
    }
  }, [shouldClose, isPending, onOpenChange]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('cashflowId', cashflowId);
    formData.append('description', description);
    formData.append('amount', amount);
    formData.append('type', type);
    formData.append('date', date);

    let result;
    if (isEdit && entry) {
      result = await updateEntry(entry.id, formData);
    } else {
      result = await addEntry(formData);
    }

    if (result?.error) {
      setError(result.error);
      toast.error(isEdit ? 'Failed to update entry' : 'Failed to add entry');
      setIsLoading(false);
    } else {
      toast.success(isEdit ? 'Entry updated!' : 'Entry added!');
      // Keep isLoading true to prevent button flicker before modal closes
      startTransition(() => {
        router.refresh();
      });
      setShouldClose(true);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px] overflow-hidden p-0 gap-0'>
        <div className='p-6 pb-0'>
          <DialogHeader className='mb-6'>
            <DialogTitle className='text-xl text-center'>
              {isEdit ? 'Edit Entry' : 'Add Entry'}
            </DialogTitle>
            <DialogDescription className='text-center'>
              {isEdit
                ? 'Update your transaction details.'
                : 'Add a new income or expense entry.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid gap-4'>
              {/* Description */}
              <div className='grid gap-2'>
                <Label
                  htmlFor='description'
                  className='font-medium text-foreground/80 gap-0.5'
                >
                  Description<span className='text-destructive'>*</span>
                </Label>
                <div className='relative'>
                  <LuFileText className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='description'
                    name='description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='e.g., Groceries, Salary'
                    required
                    className='pl-9 bg-background/50 border-input/60 focus:border-primary/50 transition-colors'
                  />
                </div>
              </div>

              {/* Amount */}
              <div className='grid gap-2'>
                <Label
                  htmlFor='amount'
                  className='font-medium text-foreground/80 gap-0.5'
                >
                  Amount<span className='text-destructive'>*</span>
                </Label>
                <div className='relative'>
                  <div className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex items-center justify-center font-semibold text-sm'>
                    {getCurrencySymbol(currency || 'USD')}
                  </div>
                  <Input
                    id='amount'
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

              {/* Type */}
              <div className='grid gap-2'>
                <Label className='font-medium text-foreground/80'>
                  Type<span className='text-destructive'>*</span>
                </Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(entryTypeSchema.parse(v))}
                >
                  <SelectTrigger className='bg-background/50 border-input/60'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='expense'>
                      <span className='flex items-center gap-2'>
                        <span className='w-2 h-2 rounded-full bg-red-500'></span>
                        Expense
                      </span>
                    </SelectItem>
                    <SelectItem value='income'>
                      <span className='flex items-center gap-2'>
                        <span className='w-2 h-2 rounded-full bg-green-500'></span>
                        Income
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className='grid gap-2'>
                <Label
                  htmlFor='date'
                  className='font-medium text-foreground/80 gap-0.5'
                >
                  Date<span className='text-destructive'>*</span>
                </Label>
                <div className='relative'>
                  <LuCalendar className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='date'
                    name='date'
                    type='date'
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
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
                      {isEdit ? 'Saving...' : 'Adding...'}
                    </>
                  ) : isEdit ? (
                    'Save Changes'
                  ) : (
                    'Add Entry'
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
