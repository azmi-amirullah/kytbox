'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LuGauge, LuInfo } from 'react-icons/lu';
import { setColumnWipLimit } from '../actions';
import { toast } from 'react-toastify';
import type { ListColumnDTO } from '@/types/dto';

interface ColumnWipLimitModalProps {
  column: ListColumnDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (column: ListColumnDTO) => void;
}

export default function ColumnWipLimitModal({
  column,
  open,
  onOpenChange,
  onUpdated,
}: ColumnWipLimitModalProps) {
  const [limitInput, setLimitInput] = useState<string>(
    column.wip_limit ? String(column.wip_limit) : '',
  );
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = limitInput.trim();
    let newLimit: number | null = null;

    if (trimmed !== '') {
      const parsed = Number.parseInt(trimmed, 10);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 99) {
        toast.error('WIP limit must be a positive number between 1 and 99');
        return;
      }
      newLimit = parsed;
    }

    startTransition(async () => {
      const result = await setColumnWipLimit(column.id, newLimit);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          newLimit !== null
            ? `WIP limit set to ${newLimit} for "${column.title}"`
            : `WIP limit removed for "${column.title}"`,
        );
        onUpdated({ ...column, wip_limit: newLimit });
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md p-6 bg-card rounded-2xl border-border'>
        <DialogHeader className='space-y-1.5'>
          <DialogTitle className='text-base font-semibold flex items-center gap-2 text-foreground'>
            <LuGauge className='h-4 w-4 text-primary' />
            Column WIP Limit: {column.title}
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Work-in-progress (WIP) limits prevent bottlenecks by highlighting when too many active tasks accumulate in a column.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className='space-y-4 pt-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='wip-limit-input' className='text-xs font-medium'>
              Max Recommended Cards (1–99)
            </Label>
            <Input
              id='wip-limit-input'
              type='number'
              min={1}
              max={99}
              placeholder='Leave empty for no limit'
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              disabled={isPending}
              className='h-9 text-sm'
            />
            <p className='text-[11px] text-muted-foreground flex items-center gap-1 pt-1'>
              <LuInfo className='h-3.5 w-3.5 text-amber-500 shrink-0' />
              <span>
                <strong>Soft Limit:</strong> Cards can still be freely moved into this column; exceeding the limit triggers an amber warning indicator without blocking your workflow.
              </span>
            </p>
          </div>

          <DialogFooter className='gap-2 sm:gap-0 pt-2'>
            {column.wip_limit !== null && column.wip_limit !== undefined && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                disabled={isPending}
                onClick={() => {
                  setLimitInput('');
                  startTransition(async () => {
                    const result = await setColumnWipLimit(column.id, null);
                    if (result.error) {
                      toast.error(result.error);
                    } else {
                      toast.success(`Removed WIP limit for "${column.title}"`);
                      onUpdated({ ...column, wip_limit: null });
                      onOpenChange(false);
                    }
                  });
                }}
                className='text-destructive hover:text-destructive text-xs mr-auto'
              >
                Clear Limit
              </Button>
            )}

            <DialogClose asChild>
              <Button type='button' variant='outline' size='sm' disabled={isPending} className='text-xs'>
                Cancel
              </Button>
            </DialogClose>
            <Button type='submit' size='sm' disabled={isPending} className='text-xs'>
              {isPending ? 'Saving...' : 'Save Limit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
