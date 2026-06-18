'use client';

import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { LuLoader, LuFileText, LuCalendar, LuRepeat } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { addEntry, updateEntry } from '../actions';
import type { CashflowEntryDTO } from '@/types/dto';
import { getCurrencySymbol } from '@/lib/currency';
import { z } from 'zod';
import {
  entryTypeSchema,
  entryCategorySchema,
} from '@/lib/validation.schemas.client';

interface EntryModalProps {
  cashflowId: string;
  entry?: CashflowEntryDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string | null;
  onSuccess: () => void;
}

export default function EntryModal({
  cashflowId,
  entry = null,
  open,
  onOpenChange,
  currency,
  onSuccess,
}: EntryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevEntry, setPrevEntry] = useState(entry);

  const [description, setDescription] = useState(entry?.description || '');
  const [amount, setAmount] = useState(entry?.amount?.toString() || '');
  const [type, setType] = useState<'income' | 'expense'>(
    entryTypeSchema.parse(entry?.type),
  );
  const [category, setCategory] = useState<string | null>(
    entryCategorySchema.parse(entry?.category),
  );
  const [date, setDate] = useState(entry?.date || today);
  const [isRecurring, setIsRecurring] = useState(entry?.is_recurring || false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<
    'monthly' | 'yearly'
  >(entry?.recurrence_interval || 'monthly');
  const [yearlyCalculation, setYearlyCalculation] = useState<
    'prorated' | 'exact'
  >(entry?.yearly_calculation || 'prorated');

  if (open !== prevOpen || entry !== prevEntry) {
    setPrevOpen(open);
    setPrevEntry(entry);
    if (open) {
      setDescription(entry?.description || '');
      setAmount(entry?.amount?.toString() || '');
      setType(entryTypeSchema.parse(entry?.type));
      setCategory(entryCategorySchema.parse(entry?.category));
      setDate(entry?.date || today);
      setIsRecurring(entry?.is_recurring || false);
      setRecurrenceInterval(entry?.recurrence_interval || 'monthly');
      setYearlyCalculation(entry?.yearly_calculation || 'prorated');
      setError(null);
      setIsLoading(false);
    }
  }

  const isBusy = isLoading;
  const isEdit = !!entry;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('cashflowId', cashflowId);
    formData.append('description', description);
    formData.append('amount', amount);
    formData.append('type', type);
    if (category) formData.append('category', category);
    formData.append('date', date);
    formData.append('is_recurring', isRecurring.toString());
    if (isRecurring) formData.append('recurrence_interval', recurrenceInterval);
    if (isRecurring && recurrenceInterval === 'yearly') {
      formData.append('yearly_calculation', yearlyCalculation);
    }

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
      onOpenChange(false);
      onSuccess();
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
                  onValueChange={(v) => {
                    const newType = entryTypeSchema.parse(v);

                    // If the user's changing the type, reset the category to uncategorized,
                    // unless they're currently on 'other' or already uncategorized.
                    if (newType !== type && category && category !== 'other') {
                      setCategory(null);
                    }

                    setType(newType);
                  }}
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

              {/* Category */}
              <div className='grid gap-2'>
                <Label className='font-medium text-foreground/80'>
                  Category
                </Label>
                <Select
                  value={category || 'uncategorized'}
                  onValueChange={(v) =>
                    setCategory(v === 'uncategorized' ? null : v)
                  }
                >
                  <SelectTrigger className='bg-background/50 border-input/60'>
                    <SelectValue placeholder='Select a category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='uncategorized'>
                      <span className='italic text-muted-foreground'>
                        Uncategorized
                      </span>
                    </SelectItem>
                    {type === 'income' ? (
                      <>
                        <SelectItem value='salary'>Salary</SelectItem>
                        <SelectItem value='freelance'>Freelance</SelectItem>
                        <SelectItem value='investment'>Investment</SelectItem>
                        <SelectItem value='other'>Other Income</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value='food'>Food & Dining</SelectItem>
                        <SelectItem value='transport'>
                          Transportation
                        </SelectItem>
                        <SelectItem value='utilities'>
                          Utilities & Bills
                        </SelectItem>
                        <SelectItem value='entertainment'>
                          Entertainment
                        </SelectItem>
                        <SelectItem value='shopping'>Shopping</SelectItem>
                        <SelectItem value='health'>Health & Fitness</SelectItem>
                        <SelectItem value='other'>Other Expense</SelectItem>
                      </>
                    )}
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

              {/* Recurring Switch */}
              <div className='flex items-center justify-between mt-2 p-3 bg-secondary/50 rounded-lg'>
                <div className='space-y-0.5'>
                  <Label className='font-medium text-foreground gap-1.5 flex items-center'>
                    <LuRepeat className='text-muted-foreground w-4 h-4' />{' '}
                    Recurring Transaction
                  </Label>
                  <p className='text-xs text-muted-foreground'>
                    Repeat this transaction automatically in forecasts
                  </p>
                </div>
                <Switch
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>

              {/* Recurrence Interval (Conditional) */}
              {isRecurring && (
                <div className='grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300 border border-border p-4 rounded-xl bg-muted/20 dark:bg-muted/10'>
                  <div className='grid gap-2'>
                    <Label className='font-medium text-foreground/80'>
                      Recurrence Interval
                      <span className='text-destructive'>*</span>
                    </Label>
                    <Select
                      value={recurrenceInterval}
                      onValueChange={(v) =>
                        setRecurrenceInterval(
                          z.enum(['monthly', 'yearly']).parse(v),
                        )
                      }
                    >
                      <SelectTrigger className='bg-background/50 border-input/60'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='monthly'>Monthly</SelectItem>
                        <SelectItem value='yearly'>Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Yearly Calculation Method (Conditional) */}
                  {recurrenceInterval === 'yearly' && (
                    <div className='grid gap-2 pt-2 border-t border-border/50'>
                      <Label className='font-medium text-foreground/80'>
                        Projection Calculation
                        <span className='text-destructive'>*</span>
                      </Label>
                      <Select
                        value={yearlyCalculation}
                        onValueChange={(v) =>
                          setYearlyCalculation(
                            z.enum(['prorated', 'exact']).parse(v),
                          )
                        }
                      >
                        <SelectTrigger className='bg-background/50 border-input/60'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='prorated'>
                            Prorated (1/12th per month)
                          </SelectItem>
                          <SelectItem value='exact'>
                            Exact Anniversary Date
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className='text-[10px] text-muted-foreground mt-1'>
                        {yearlyCalculation === 'prorated'
                          ? "Smooths out massive annual charges so they don't destroy a single month's budget projection."
                          : 'Only deducts this from your projected balance if the anniversary falls within the next month.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

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
