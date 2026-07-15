'use client';

import { useState, memo } from 'react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  LuGripVertical,
  LuTrash2,
  LuCopy,
  LuActivity,
  LuCheck,
  LuPencil,
  LuFolderOpen,
  LuFolderInput,
  LuTriangleAlert,
  LuType,
} from 'react-icons/lu';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import LinkModal from './LinkModal';
import type { LinkDTO } from '@/types/dto';
import { cn } from '@/lib/utils';

interface SortableLinkProps {
  link: LinkDTO;
  childCount?: number;
  isParentHidden?: boolean;
  onToggle: (linkId: string, isActive: boolean) => void;
  onDelete: (linkId: string) => void;
  onMove: (linkId: string) => void;
  onDrillDown: (folderId: string) => void;
  onUpdate?: (link: LinkDTO) => void;
}

const LinkItemContent = memo(function LinkItemContent({
  link,
  childCount,
  isParentHidden,
  attributes,
  listeners,
  onToggle,
  onDelete,
  onMove,
  onUpdate,
}: {
  link: LinkDTO;
  childCount?: number;
  isParentHidden?: boolean;
  attributes?: ReturnType<typeof useSortable>['attributes'];
  listeners?: ReturnType<typeof useSortable>['listeners'];
  onToggle: (linkId: string, isActive: boolean) => void;
  onDelete: (linkId: string) => void;
  onMove: (linkId: string) => void;
  onUpdate?: (link: LinkDTO) => void;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link.url);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete(link.id);
    setShowDeleteDialog(false);
  };

  const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
  const isScheduled = link.scheduled_at && new Date(link.scheduled_at) > new Date();

  const getScheduleBadge = () => {
    if (!link.scheduled_at && !link.expires_at) return null;
    const now = new Date();
    const start = link.scheduled_at ? new Date(link.scheduled_at) : null;
    const end = link.expires_at ? new Date(link.expires_at) : null;

    if (start && start > now) {
      return (
        <span className='text-[10px] uppercase tracking-wider font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-sm flex items-center gap-1 border border-sky-500/20'>
          🕐 Goes live {format(start, 'MMM d, h:mm a')}
        </span>
      );
    }
    if (end && end < now) {
      return (
        <span className='text-[10px] uppercase tracking-wider font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-sm flex items-center gap-1 border border-destructive/20'>
          🔴 Expired {format(end, 'MMM d, h:mm a')}
        </span>
      );
    }
    if (end) {
      return (
        <span className='text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm flex items-center gap-1 border border-emerald-500/20'>
          🟢 Live until {format(end, 'MMM d, h:mm a')}
        </span>
      );
    }
    return null;
  };

  return (
    <>
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className='p-2 cursor-move text-muted-foreground/50 hover:text-foreground touch-none select-none transition-colors'
        aria-label='Drag to reorder'
      >
        <LuGripVertical className='w-5 h-5' />
      </button>

      {/* Toggle */}
      <div
        className='flex items-center'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' && !isParentHidden) {
            e.stopPropagation();
            onToggle(link.id, !link.is_active);
          }
        }}
        role='button'
        tabIndex={isParentHidden ? -1 : 0}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={isParentHidden ? 'cursor-not-allowed' : ''}>
                <Switch
                  checked={isParentHidden ? false : !!link.is_active}
                  onCheckedChange={(checked) => !isParentHidden && onToggle(link.id, checked)}
                  disabled={isParentHidden}
                  className={cn(
                    'data-[state=checked]:bg-green-500',
                    isParentHidden && 'opacity-50 grayscale'
                  )}
                />
              </div>
            </TooltipTrigger>
            {isParentHidden && (
              <TooltipContent side='bottom'>
                <p>Cannot activate: Folder is hidden</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Link Info */}
      <div className='flex-1 min-w-0 ml-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <h3
            className={cn(
              'font-semibold truncate text-sm sm:text-base flex items-center gap-1.5',
              (!link.is_active || isExpired) && (link.is_header ? 'text-muted-foreground' : 'text-muted-foreground line-through decoration-muted-foreground/50'),
              isScheduled && 'text-muted-foreground'
            )}
          >
            {link.is_folder && (
              <LuFolderOpen className='w-4 h-4 shrink-0 text-muted-foreground' />
            )}
            {link.is_header && (
              <LuType className='w-4 h-4 shrink-0 text-muted-foreground' />
            )}
            {link.title}
          </h3>
          {isParentHidden ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='text-[10px] uppercase tracking-wider font-bold bg-amber-500/10 text-amber-600 dark:text-amber-500 px-1.5 py-0.5 rounded-sm flex items-center gap-1 cursor-help'>
                    <LuTriangleAlert className='w-3 h-3' />
                    Folder Hidden
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This item is hidden because its folder is inactive.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : !link.is_active && (
            <span className='text-[10px] uppercase tracking-wider font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm'>
              Hidden
            </span>
          )}
        </div>
        <div className='flex flex-wrap items-center gap-2 mt-1'>
          {getScheduleBadge()}
          {!link.is_folder && !link.is_header && (
            <a
              href={link.url}
              target='_blank'
              rel='noopener noreferrer'
              className='text-xs text-muted-foreground truncate hover:text-primary transition-colors hover:underline block'
              onClick={(e) => e.stopPropagation()}
            >
              {link.url}
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      {link.is_folder ? (
        typeof childCount === 'number' && (
          <div className='hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-foreground text-xs font-medium'>
            <LuFolderOpen className='w-3.5 h-3.5' />
            {childCount}
            <span className='opacity-70'>items</span>
          </div>
        )
      ) : link.is_header ? null : (
        <div className='hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-foreground text-xs font-medium'>
          <LuActivity className='w-3.5 h-3.5' />
          {link.clicks ?? 0}
          <span className='opacity-70'>clicks</span>
        </div>
      )}

      {/* Actions */}
      <div
        className='flex items-center gap-1 sm:gap-2'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
        }}
        role='toolbar'
        aria-label='Link actions'
      >
        {!link.is_folder && !link.is_header && (
          <TooltipProvider>
            <Tooltip open={hasCopied || undefined}>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='w-8 h-8 text-primary hover:text-primary hover:bg-primary/10'
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard();
                  }}
                >
                  {hasCopied ? (
                    <LuCheck className='w-4 h-4' />
                  ) : (
                    <LuCopy className='w-4 h-4' />
                  )}
                  <span className='sr-only'>Copy URL</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hasCopied ? 'Copied!' : 'Copy URL'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {!link.is_folder && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='w-8 h-8 text-primary hover:text-primary hover:bg-primary/10'
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(link.id);
                  }}
                >
                  <LuFolderInput className='w-4 h-4' />
                  <span className='sr-only'>Move</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Move</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='w-8 h-8 text-primary hover:text-primary hover:bg-primary/10'
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
              >
                <LuPencil className='w-4 h-4' />
                <span className='sr-only'>Edit</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick();
                }}
              >
                <LuTrash2 className='w-4 h-4' />
                <span className='sr-only'>Delete</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Dialogs */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='pb-2 border-b mb-2'>
              Delete {link.is_folder ? 'Folder' : link.is_header ? 'Header' : 'Link'}
            </AlertDialogTitle>
            <AlertDialogDescription className='space-y-3' asChild>
              <div>
                <p>
                  Are you sure you want to delete &quot;{link.title}&quot;? This
                  action cannot be undone.
                </p>
                {link.is_folder && (
                  <div className='p-3 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg flex items-start gap-2 text-left mt-2 dark:text-amber-500'>
                    <LuTriangleAlert className='w-4 h-4 shrink-0 mt-0.5' />
                    <p className='text-sm font-medium'>
                      This will permanently delete ALL links inside this folder.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <LinkModal
        mode='edit'
        link={link}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={onUpdate}
      />
    </>
  );
});

export default function SortableLink({
  link,
  childCount,
  onToggle,
  onDelete,
  onMove,
  onDrillDown,
  onUpdate,
  isParentHidden,
}: SortableLinkProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: link.id,
    animateLayoutChanges: (args) =>
      defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
  });

  const style = {
    // Revert to standard Transform for better compatibility
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
    touchAction: 'none',
  };

  const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
  const isScheduled = link.scheduled_at && new Date(link.scheduled_at) > new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        if (!link.is_folder) return;
        if (!(e.target instanceof HTMLElement)) return;
        if (!(e.currentTarget instanceof HTMLElement)) return;
        const target = e.target;
        const currentTarget = e.currentTarget;
        if (
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input')
        )
          return;
        if (!currentTarget.contains(target)) return;
        onDrillDown(link.id);
      }}
      onKeyDown={(e) => {
        if (!link.is_folder) return;
        if (e.key === 'Enter' || e.key === ' ') {
          if (!(e.target instanceof HTMLElement)) return;
          const target = e.target;
          if (
            target.closest('button') ||
            target.closest('a') ||
            target.closest('input')
          )
            return;
          e.preventDefault();
          onDrillDown(link.id);
        }
      }}
      role={link.is_folder ? 'button' : undefined}
      tabIndex={link.is_folder ? 0 : undefined}
      className={`
        group flex items-center gap-3 p-3 rounded-xl border
        bg-secondary/50 border-border transition-all duration-200
        ${
          isDragging
            ? 'opacity-50 shadow-xl ring-1 ring-primary/20'
            : 'hover:border-primary/20 hover:shadow-sm hover:bg-secondary/80'
        }
        ${link.is_folder && !isDragging ? 'cursor-pointer hover:border-primary/50' : ''}
        ${isParentHidden ? 'opacity-70 bg-secondary/30' : ''}
        ${isExpired ? 'opacity-50 grayscale' : ''}
        ${isScheduled ? 'opacity-75 bg-secondary/40' : ''}
      `}
    >
      <LinkItemContent
        link={link}
        childCount={childCount}
        isParentHidden={isParentHidden}
        attributes={attributes}
        listeners={listeners}
        onToggle={onToggle}
        onDelete={onDelete}
        onMove={onMove}
        onUpdate={onUpdate}
      />
    </div>
  );
}

// Unified Skeleton Component
SortableLink.Skeleton = function SortableLinkSkeleton() {
  return (
    <div className='group flex items-center gap-3 p-3 rounded-xl border bg-secondary/50 border-border'>
      <Skeleton className='w-5 h-5 rounded' />
      <Skeleton className='w-9 h-5 rounded-full' />
      <div className='flex-1 min-w-0 ml-1 space-y-2'>
        <Skeleton className='h-4 w-32 rounded-md' />
        <Skeleton className='h-3 w-48 rounded-md' />
      </div>
      <div className='flex items-center gap-1 sm:gap-2'>
        <Skeleton className='w-8 h-8 rounded-md' />
        <Skeleton className='w-8 h-8 rounded-md' />
        <Skeleton className='w-8 h-8 rounded-md' />
      </div>
    </div>
  );
};
