'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LuLoader,
  LuFolderInput,
  LuFolderOpen,
  LuFolderOutput,
} from 'react-icons/lu';
import { toast } from 'react-toastify';
import { moveToFolder } from '../actions';
import type { LinkDTO } from '@/types/dto';

interface MoveToFolderModalProps {
  link: LinkDTO;
  folders: LinkDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newParentId: string | null) => void;
}

export default function MoveToFolderModal({
  link,
  folders,
  open,
  onOpenChange,
  onSuccess,
}: MoveToFolderModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  async function handleMove(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFolderId) {
      return;
    }

    const folderId = selectedFolderId === 'main' ? null : selectedFolderId;

    // Skip if it's already in the selected folder
    if (folderId === link.parent_id) {
      onOpenChange(false);
      return;
    }

    const formData = new FormData();
    formData.append('linkId', link.id);
    if (folderId) formData.append('parentId', folderId);

    const result = await moveToFolder(formData);

    if (result?.error) {
      toast.error('Failed to move link');
    } else {
      toast.success(folderId ? 'Moved to folder!' : 'Moved to main list!');
      if (onSuccess) {
        onSuccess(folderId);
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
            <DialogTitle className='text-xl text-center flex items-center justify-center gap-2'>
              <LuFolderInput className='w-5 h-5 text-primary' />
              Move &quot;{link.title}&quot;
            </DialogTitle>
            <DialogDescription className='text-center'>
              Select a folder to move this link into.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMove}>
            <div className='mb-6 px-1'>
              <Select
                value={selectedFolderId}
                onValueChange={setSelectedFolderId}
                disabled={isPending}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a destination' />
                </SelectTrigger>
                <SelectContent>
                  {link.parent_id !== null && (
                    <SelectItem value='main'>
                      <div className='flex items-center gap-2'>
                        <LuFolderOutput className='w-4 h-4' />
                        Main List
                      </div>
                    </SelectItem>
                  )}
                  {folders
                    .filter((f) => f.id !== link.id && f.id !== link.parent_id) // Can't move into itself or current folder
                    .map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className='flex items-center gap-2'>
                          <LuFolderOpen className='w-4 h-4 text-primary' />
                          {folder.title}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className='py-4 mt-2 px-1 border-t'>
              <div className='flex w-full gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                  className='flex-1'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isPending || !selectedFolderId}
                  className='flex-1'
                >
                  {isPending ? (
                    <>
                      <LuLoader className='mr-2 h-4 w-4 animate-spin' />
                      Moving...
                    </>
                  ) : (
                    'Move Link'
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
