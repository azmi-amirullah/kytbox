'use client';

import { useState, useTransition } from 'react';
import {
  LuPaperclip,
  LuPlus,
  LuExternalLink,
  LuTrash2,
  LuLoader,
  LuGlobe,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ListItemResourceDTO } from '@/types/dto';
import { addResourceBookmark, deleteResourceBookmark } from '../actions';
import { toast } from 'react-toastify';

interface CardResourceBookmarksProps {
  itemId: string;
  resources: ListItemResourceDTO[];
  onResourcesChange: (resources: ListItemResourceDTO[]) => void;
  disabled?: boolean;
}

export default function CardResourceBookmarks({
  itemId,
  resources,
  onResourcesChange,
  disabled = false,
}: CardResourceBookmarksProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    const raw = urlInput.trim();
    if (!raw || isPending) return;

    // Prepend https:// if user omitted protocol
    const normalizedUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

    startTransition(async () => {
      const result = await addResourceBookmark(itemId, normalizedUrl);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        onResourcesChange([...resources, result.data]);
        setUrlInput('');
        setIsAdding(false);
        toast.success('Resource bookmark linked (0 bytes storage)');
      }
    });
  };

  const handleDelete = (resourceId: string) => {
    if (isPending) return;
    startTransition(async () => {
      const result = await deleteResourceBookmark(resourceId);
      if (result.error) {
        toast.error(result.error);
      } else {
        onResourcesChange(resources.filter((r) => r.id !== resourceId));
      }
    });
  };

  return (
    <div className='space-y-3 pt-2'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 text-xs font-semibold text-foreground'>
          <LuPaperclip className='h-3.5 w-3.5 text-primary' />
          <span>Cloud Attachments & Links</span>
          <span className='text-[11px] text-muted-foreground font-normal'>
            ({resources.length})
          </span>
          <span className='ml-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
            0 Bytes
          </span>
        </div>

        {!isAdding && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={disabled}
            onClick={() => setIsAdding(true)}
            className='h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground'
          >
            <LuPlus className='h-3.5 w-3.5' />
            Add Link
          </Button>
        )}
      </div>

      {/* Add Resource Input Form */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className='flex items-center gap-2 p-2 rounded-xl bg-muted/40 border border-border/80'
        >
          <Input
            type='url'
            placeholder='Paste link (Drive, Figma, GitHub, Loom, Notion)...'
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={isPending}
            className='h-8 text-xs flex-1 bg-background'
          />
          <Button
            type='submit'
            size='sm'
            disabled={!urlInput.trim() || isPending}
            className='h-8 px-3 text-xs gap-1'
          >
            {isPending ? (
              <LuLoader className='h-3.5 w-3.5 animate-spin' />
            ) : (
              'Attach'
            )}
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => setIsAdding(false)}
            className='h-8 px-2 text-xs text-muted-foreground hover:text-foreground'
          >
            Cancel
          </Button>
        </form>
      )}

      {/* Resource List */}
      {resources.length > 0 && (
        <div className='space-y-1.5'>
          {resources.map((res) => (
            <div
              key={res.id}
              className='group flex items-center justify-between p-2 rounded-xl bg-muted/20 hover:bg-muted/50 border border-border/50 text-xs transition-colors'
            >
              <a
                href={res.url}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-2.5 min-w-0 flex-1 pr-2'
              >
                {res.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={res.icon_url}
                    alt=''
                    className='w-4 h-4 rounded shrink-0 object-contain'
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <LuGlobe className='w-4 h-4 text-muted-foreground shrink-0' />
                )}
                <div className='min-w-0 flex-1'>
                  <div className='truncate font-medium text-foreground group-hover:text-primary transition-colors'>
                    {res.title || res.domain || 'External Resource'}
                  </div>
                  <div className='truncate text-[10px] text-muted-foreground'>
                    {res.domain || res.url}
                  </div>
                </div>
                <LuExternalLink className='w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground shrink-0' />
              </a>

              <button
                type='button'
                onClick={() => handleDelete(res.id)}
                disabled={isPending}
                className='opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded transition-opacity'
                title='Remove attachment'
                aria-label='Remove resource attachment'
              >
                <LuTrash2 className='w-3.5 h-3.5' />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
