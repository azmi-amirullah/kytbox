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
import { updateList } from '../actions';
import { toast } from 'react-toastify';
import type { ListDTO } from '@/types/dto';

interface EditListModalProps {
  list: ListDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditListModal({
  list,
  open,
  onOpenChange,
}: EditListModalProps) {
  const [isPending, startTransition] = useTransition();
  const [prevListId, setPrevListId] = useState(list.id);
  const [prevOpen, setPrevOpen] = useState(open);
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description || '');

  // Reset local state synchronously when props change
  if (list.id !== prevListId || open !== prevOpen) {
    setPrevListId(list.id);
    setPrevOpen(open);
    setTitle(list.title);
    setDescription(list.description || '');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.set('title', title);
    formData.set('description', description);

    startTransition(async () => {
      const result = await updateList(list.id, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('List updated');
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='edit-list-title'>Title</Label>
            <Input
              id='edit-list-title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit-list-desc'>
              Description{' '}
              <span className='text-muted-foreground font-normal'>
                (optional)
              </span>
            </Label>
            <Input
              id='edit-list-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
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
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
