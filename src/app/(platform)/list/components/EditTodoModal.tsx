'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { LuX, LuAlignLeft } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { ListItemDTO } from '@/types/dto';
import { updateItem, toggleItem } from '../actions';
import { toast } from 'react-toastify';
import { Checkbox } from '@/components/ui/checkbox';

interface EditTodoModalProps {
  item: ListItemDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (item: ListItemDTO) => void;
}

export default function EditTodoModal({
  item,
  open,
  onOpenChange,
  onUpdated,
}: EditTodoModalProps) {
  const [isPending, startTransition] = useTransition();
  const [prevItemId, setPrevItemId] = useState(item.id);
  const [prevOpen, setPrevOpen] = useState(open);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');
  const [isCompleted, setIsCompleted] = useState(item.is_completed);

  // Reset local state synchronously when props change (avoids useEffect cascading renders)
  if (item.id !== prevItemId || open !== prevOpen) {
    setPrevItemId(item.id);
    setPrevOpen(open);
    setTitle(item.title);
    setDescription(item.description || '');
    setIsCompleted(item.is_completed);
  }

  const handleToggleCompleted = () => {
    if (isPending) return;
    startTransition(async () => {
      const result = await toggleItem(item.id, !isCompleted);
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsCompleted(!isCompleted);
        onUpdated({ ...item, is_completed: !isCompleted });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('title', title.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const result = await updateItem(item.id, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        onUpdated({
          ...item,
          title: title.trim(),
          description: description.trim() || null,
          is_completed: isCompleted,
        });
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className='p-4 sm:max-w-xl gap-3'>
        <form onSubmit={handleSubmit} className='space-y-3'>
          <DialogHeader className='flex flex-row items-center gap-3 space-y-0 pb-1.5'>
            <Checkbox
              id='edit-completed'
              checked={isCompleted}
              onCheckedChange={handleToggleCompleted}
              className={`shrink-0 mt-0.5 ${isPending ? 'cursor-wait' : 'cursor-pointer'} border-muted-foreground/60 dark:border-muted-foreground/40 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:border-emerald-500`}
              aria-label='Toggle task completion status'
            />
            <DialogTitle className='flex-1'>
              <Input
                id='edit-title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Task title'
                maxLength={300}
                className='w-full text-xl! font-bold border-transparent bg-transparent shadow-none hover:border-input/40 focus:border-input focus:bg-background focus:ring-1 focus:ring-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-input transition-all py-0 px-0 focus:px-1 h-11'
                required
              />
            </DialogTitle>
            <DialogClose className='text-muted-foreground/75 hover:text-foreground hover:bg-accent rounded-xs p-1 transition-colors cursor-pointer shrink-0'>
              <LuX className='w-5 h-5' />
              <span className='sr-only'>Close</span>
            </DialogClose>
          </DialogHeader>

          <div className='space-y-3'>
            <div className='space-y-1.5'>
              <div className='flex items-center gap-3 text-muted-foreground/45'>
                <LuAlignLeft className='w-4 h-4' />
                <Label className='text-foreground text-base font-semibold'>
                  Description
                </Label>
              </div>
              <div className='pl-7'>
                <Textarea
                  id='edit-desc'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Add details to this task...'
                  className='min-h-[100px]'
                  maxLength={1000}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='ghost'
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isPending || !title.trim()}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
