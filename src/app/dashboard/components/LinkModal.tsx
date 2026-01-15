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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { addLink, updateLink } from '../actions';

interface Link {
  id: string;
  title: string;
  url: string;
}

interface LinkModalProps {
  mode: 'create' | 'edit';
  link?: Link | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function LinkModal({
  mode,
  link = null,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: LinkModalProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [shouldClose, setShouldClose] = useState(false);

  // Form state
  const [title, setTitle] = useState(link?.title || '');
  const [url, setUrl] = useState(link?.url || '');

  // Determine if controlled or uncontrolled
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const isBusy = isLoading || isPending;
  const isEdit = mode === 'edit';

  // Reset form when link changes (for edit mode) or modal opens
  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setTitle(link?.title || '');
        setUrl(link?.url || '');
        setError(null);
      });
    }
  }, [open, link]);

  // Close modal only after refresh completes
  useEffect(() => {
    if (shouldClose && !isPending) {
      queueMicrotask(() => {
        setOpen(false);
        setShouldClose(false);
      });
    }
  }, [shouldClose, isPending, setOpen]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('url', url);

    let result;
    if (isEdit && link) {
      result = await updateLink(link.id, formData);
    } else {
      result = await addLink(formData);
    }

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setIsLoading(false);
      startTransition(() => {
        router.refresh();
      });
      setShouldClose(true);
    }
  }

  const dialogContent = (
    <DialogContent className='sm:max-w-[425px]'>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Link' : 'Add New Link'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update your link details.'
            : 'Add a new link to your page.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='title'>Title</Label>
            <Input
              id='title'
              name='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='My Website'
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='url'>URL</Label>
            <Input
              id='url'
              name='url'
              type='text'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder='https://example.com'
              required
            />
          </div>
          {error && (
            <p className='text-sm text-destructive text-center'>{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isBusy}>
            {isBusy ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {isEdit ? 'Saving...' : 'Adding...'}
              </>
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Add Link'
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );

  // For create mode with trigger button
  if (!isControlled && trigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {dialogContent}
      </Dialog>
    );
  }

  // For controlled mode (edit) or uncontrolled without trigger
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {dialogContent}
    </Dialog>
  );
}
