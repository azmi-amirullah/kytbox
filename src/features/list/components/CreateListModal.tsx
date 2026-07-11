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
import { LuLayoutGrid, LuHeart, LuLightbulb } from 'react-icons/lu';
import { createList, seedDefaultColumns } from '../actions';
import { toast } from 'react-toastify';
import type { ListType } from '@/types/dto';

interface CreateListModalProps {
  type: ListType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_META: Record<
  ListType,
  { label: string; placeholder: string; icon: typeof LuLayoutGrid }
> = {
  todo: {
    label: 'New Board',
    placeholder: 'e.g. Website Redesign',
    icon: LuLayoutGrid,
  },
  wishlist: {
    label: 'New Wishlist',
    placeholder: 'e.g. Birthday Gifts',
    icon: LuHeart,
  },
  idea: {
    label: 'New Idea List',
    placeholder: 'e.g. Startup Ideas',
    icon: LuLightbulb,
  },
};

export default function CreateListModal({
  type,
  open,
  onOpenChange,
}: CreateListModalProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const meta = TYPE_META[type];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.set('title', title);
    formData.set('type', type);
    formData.set('description', description);

    startTransition(async () => {
      const result = await createList(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        // Seed default Kanban columns for todo boards
        if (type === 'todo' && result.data) {
          await seedDefaultColumns(result.data.id);
        }
        toast.success(`${meta.label.replace('New ', '')} created`);
        setTitle('');
        setDescription('');
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{meta.label}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='create-list-title'>Title</Label>
            <Input
              id='create-list-title'
              placeholder={meta.placeholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='create-list-desc'>
              Description{' '}
              <span className='text-muted-foreground font-normal'>
                (optional)
              </span>
            </Label>
            <Input
              id='create-list-desc'
              placeholder='What is this list about?'
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
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
