'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addColumn } from '../column-actions';
import { toast } from 'react-toastify';
import type { ListColumnDTO } from '@/types/dto';

interface AddColumnModalProps {
  listId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onColumnAdded: (column: ListColumnDTO) => void;
}

export default function AddColumnModal({
  listId,
  open,
  onOpenChange,
  onColumnAdded,
}: AddColumnModalProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await addColumn(listId, title);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        onColumnAdded(result.data);
        toast.success('Column added');
        setTitle('');
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Add Column</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='column-title'>Column Name</Label>
            <Input
              id='column-title'
              placeholder='e.g. Backlog'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending || !title.trim()}>
              {isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
