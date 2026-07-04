'use client';

import { useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteList } from '../actions';
import { toast } from 'react-toastify';
import type { ListDTO } from '@/types/dto';

interface DeleteListDialogProps {
  list: ListDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteListDialog({
  list,
  open,
  onOpenChange,
}: DeleteListDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteList(list.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('List deleted');
        onOpenChange(false);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{list.title}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this list and all{' '}
            <strong>{list.item_count}</strong>{' '}
            {list.item_count === 1 ? 'item' : 'items'} inside it. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
