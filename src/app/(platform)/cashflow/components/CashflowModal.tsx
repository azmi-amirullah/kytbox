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
import { LuLoader, LuWallet } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { createCashflow, updateCashflow } from '../actions';
import type { CashflowDTO } from '@/types/dto';

interface CashflowModalProps {
  mode: 'create' | 'edit';
  cashflow?: CashflowDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CashflowModal({
  mode,
  cashflow = null,
  open,
  onOpenChange,
}: CashflowModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(cashflow?.title || '');

  const isBusy = isLoading || isPending;
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setTitle(cashflow?.title || '');
        setError(null);
        setIsLoading(false);
      });
    }
  }, [open, cashflow]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', title);

    let result;
    if (isEdit && cashflow) {
      result = await updateCashflow(cashflow.id, formData);
    } else {
      result = await createCashflow(formData);
    }

    if (result?.error) {
      setError(result.error);
      toast.error(
        isEdit ? 'Failed to update cashflow' : 'Failed to create cashflow',
      );
      setIsLoading(false);
    } else {
      toast.success(isEdit ? 'Cashflow updated!' : 'Cashflow created!');
      onOpenChange(false);
      startTransition(() => {
        router.refresh();
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px] overflow-hidden p-0 gap-0'>
        <div className='p-6 pb-0'>
          <DialogHeader className='mb-6'>
            <DialogTitle className='text-xl text-center'>
              {isEdit ? 'Edit Cashflow' : 'Create New Cashflow'}
            </DialogTitle>
            <DialogDescription className='text-center'>
              {isEdit
                ? 'Update your cashflow title.'
                : 'Give your cashflow a name to organize your transactions.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <Label
                  htmlFor='title'
                  className='font-medium text-foreground/80 gap-0.5'
                >
                  Cashflow Title<span className='text-destructive'>*</span>
                </Label>
                <div className='relative'>
                  <LuWallet className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='title'
                    name='title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='e.g., Monthly Budget, Trip Expenses'
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
                      {isEdit ? 'Saving...' : 'Creating...'}
                    </>
                  ) : isEdit ? (
                    'Save Changes'
                  ) : (
                    'Create Cashflow'
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
