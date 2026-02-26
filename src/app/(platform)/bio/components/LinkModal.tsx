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
import { LuLoader, LuType, LuGlobe } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { addLink, updateLink, createFolder } from '../actions';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LuFolderOpen } from 'react-icons/lu';

interface Link {
  id: string;
  title: string;
  url: string;
  is_folder: boolean | null;
}

interface LinkModalProps {
  mode: 'create' | 'edit';
  link?: Link | null;
  parentId?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function LinkModal({
  mode,
  link = null,
  parentId = null,
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
  const [type, setType] = useState<'link' | 'folder'>('link');
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
        setType(link?.is_folder ? 'folder' : 'link');
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
    if (type === 'link') formData.append('url', url);
    formData.append('isFolder', type === 'folder' ? 'true' : 'false');
    if (parentId) formData.append('parentId', parentId);

    let result;
    if (isEdit && link) {
      result = await updateLink(link.id, formData);
    } else if (type === 'folder') {
      const folderData = new FormData();
      folderData.append('title', title);
      folderData.append('isFolder', 'true');
      if (parentId) folderData.append('parentId', parentId);
      result = await createFolder(folderData);
    } else {
      result = await addLink(formData);
    }

    if (result?.error) {
      setError(result.error);
      toast.error(
        isEdit ? `Failed to update ${type}` : `Failed to add ${type}`,
      );
      setIsLoading(false);
    } else {
      toast.success(
        isEdit
          ? `${type === 'folder' ? 'Folder' : 'Link'} updated!`
          : `${type === 'folder' ? 'Folder' : 'Link'} added!`,
      );
      setIsLoading(false);
      startTransition(() => {
        router.refresh();
      });
      setShouldClose(true);
    }
  }

  const dialogContent = (
    <DialogContent className='sm:max-w-[425px] overflow-hidden p-0 gap-0'>
      <div className='p-6 pb-0'>
        <DialogHeader className='mb-6'>
          <DialogTitle className='text-xl text-center'>
            {isEdit
              ? `Edit ${type === 'folder' ? 'Folder' : 'Link'}`
              : `Add New ${type === 'folder' ? 'Folder' : 'Link'}`}
          </DialogTitle>
          <DialogDescription className='text-center'>
            {isEdit
              ? `Make changes to your ${type} here. Click save when you're done.`
              : `Add a new ${type} to share with your audience.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {!isEdit && (
            <Tabs
              value={type}
              onValueChange={(val) => setType(val as 'link' | 'folder')}
              className='w-full'
            >
              <TabsList className='w-full grid grid-cols-2 bg-secondary'>
                <TabsTrigger value='link' className='gap-2'>
                  <LuGlobe className='w-4 h-4' />
                  Link
                </TabsTrigger>
                <TabsTrigger value='folder' className='gap-2'>
                  <LuFolderOpen className='w-4 h-4' />
                  Folder
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className='grid gap-4'>
            <div className='grid gap-2'>
              <Label
                htmlFor='title'
                className='font-medium text-foreground/80 gap-0.5'
              >
                {type === 'folder' ? 'Folder Name' : 'Link Title'}
                <span className='text-destructive'>*</span>
              </Label>
              <div className='relative'>
                <LuType className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='title'
                  name='title'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    type === 'folder'
                      ? 'My Awesome Folder'
                      : 'My Awesome Website'
                  }
                  required
                  className='pl-9 bg-background/50 border-input/60 focus:border-primary/50 transition-colors'
                />
              </div>
            </div>

            {type === 'link' && (
              <div className='grid gap-2'>
                <Label
                  htmlFor='url'
                  className='font-medium text-foreground/80 gap-0.5'
                >
                  Destination URL<span className='text-destructive'>*</span>
                </Label>
                <div className='relative'>
                  <LuGlobe className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='url'
                    name='url'
                    type='text'
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder='https://example.com/awesome-page'
                    required
                    className='pl-9 bg-background/50 border-input/60 focus:border-primary/50 transition-colors'
                  />
                </div>
              </div>
            )}

            {error && (
              <p className='text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md font-medium'>
                {error}
              </p>
            )}
          </div>

          <DialogFooter className='py-4 mt-4'>
            <div className='flex w-full gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={isBusy}
                className='flex-1'
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isBusy} className='flex-1'>
                {isBusy ? (
                  <>
                    <LuLoader className='mr-2 h-4 w-4 animate-spin' />
                    {isEdit
                      ? 'Saving...'
                      : `Adding ${type === 'folder' ? 'Folder' : 'Link'}...`}
                  </>
                ) : isEdit ? (
                  'Save Changes'
                ) : (
                  `Add ${type === 'folder' ? 'Folder' : 'Link'}`
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </div>
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
