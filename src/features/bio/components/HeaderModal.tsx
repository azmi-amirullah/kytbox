'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LuLoader, LuType } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { addHeader } from '../actions';
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

interface HeaderModalProps {
  parentId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function HeaderModal({
  parentId = null,
  open,
  onOpenChange,
  onSuccess,
}: HeaderModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isBusy = isLoading || isPending;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await addHeader(title, parentId);

    if (result?.error) {
      setError(result.error);
      toast.error('Failed to add section header');
      setIsLoading(false);
    } else {
      toast.success('Section header added!');
      setTitle('');
      setIsLoading(false);
      if (onSuccess) {
        onSuccess();
      }
      startTransition(() => {
        router.refresh();
      });
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px] overflow-hidden p-0 gap-0'>
        <div className='p-6 pb-0'>
          <DialogHeader className='mb-6'>
            <DialogTitle className='text-xl text-center'>
              Add Section Header
            </DialogTitle>
            <DialogDescription className='text-center'>
              Create a non-clickable text label to organize your bio page.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <Label
                  htmlFor='header-title'
                  className='font-medium text-foreground/80 gap-0.5'
                >
                  Header Title<span className='text-destructive'>*</span>
                </Label>
                <div className='relative'>
                  <LuType className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='header-title'
                    name='title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='e.g., Social Links, My Projects...'
                    required
                    maxLength={100}
                    className='pl-9 bg-background/50 border-input/60 focus:border-primary/50 transition-colors'
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className='text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md font-medium'>
                {error}
              </p>
            )}

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
                      Adding...
                    </>
                  ) : (
                    'Add Header'
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
