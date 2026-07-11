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
import { deleteColumn } from '../actions';
import { toast } from 'react-toastify';
import type { ListColumnDTO } from '@/types/dto';

interface DeleteColumnDialogProps {
  column: ListColumnDTO;
  itemCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (columnId: string) => void;
}

export default function DeleteColumnDialog({
  column,
  itemCount,
  open,
  onOpenChange,
  onDeleted,
}: DeleteColumnDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteColumn(column.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Column deleted');
        onDeleted(column.id);
        onOpenChange(false);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete &quot;{column.title}&quot; column?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {itemCount > 0 ? (
              <>
                This will permanently delete this column and all{' '}
                <strong>{itemCount}</strong>{' '}
                {itemCount === 1 ? 'card' : 'cards'} inside it. This action
                cannot be undone.
              </>
            ) : (
              'This empty column will be permanently deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isPending
              ? 'Deleting...'
              : itemCount > 0
                ? `Delete Column & ${itemCount} ${itemCount === 1 ? 'Card' : 'Cards'}`
                : 'Delete Column'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
