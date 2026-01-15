'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  ExternalLink,
  Trash2,
  Copy,
  BarChart2,
  Check,
  Pencil,
} from 'lucide-react';
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
import type { Database } from '@/types/supabase';

type Link = Database['public']['Tables']['links']['Row'];

interface SortableLinkProps {
  link: Link;
  onToggle: (linkId: string, isActive: boolean) => void;
  onDelete: (linkId: string) => void;
}

export default function SortableLink({
  link,
  onToggle,
  onDelete,
}: SortableLinkProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`
          group flex items-center gap-3 p-3 rounded-xl border
          bg-card border-border transition-all duration-200
          hover:border-primary/20 hover:shadow-sm
          ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary/20' : ''}
        `}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className='p-2 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground touch-none transition-colors'
        >
          <GripVertical className='w-5 h-5' />
        </button>

        {/* Toggle */}
        <div className='flex items-center'>
          <Switch
            checked={link.is_active}
            onCheckedChange={(checked) => onToggle(link.id, checked)}
            className='data-[state=checked]:bg-primary'
          />
        </div>

        {/* Link Info */}
        <div className='flex-1 min-w-0 ml-1'>
          <div className='flex items-center gap-2'>
            <h3
              className={`font-semibold truncate text-sm sm:text-base ${
                !link.is_active &&
                'text-muted-foreground line-through decoration-muted-foreground/50'
              }`}
            >
              {link.title}
            </h3>
            {!link.is_active && (
              <span className='text-[10px] uppercase tracking-wider font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm'>
                Hidden
              </span>
            )}
          </div>
          <p className='text-xs text-muted-foreground truncate hover:text-primary transition-colors'>
            {link.url}
          </p>
        </div>

        {/* Stats - Desktop: Visible, Mobile: Hidden or Smaller */}
        <div className='hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50 text-secondary-foreground text-xs font-medium'>
          <BarChart2 className='w-3.5 h-3.5' />
          {link.clicks}
          <span className='opacity-70'>clicks</span>
        </div>

        <div className='flex items-center gap-1 sm:gap-2'>
          <TooltipProvider>
            <Tooltip open={hasCopied || undefined}>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='w-8 h-8 text-primary hover:text-primary hover:bg-primary/10'
                  onClick={copyToClipboard}
                >
                  {hasCopied ? (
                    <Check className='w-4 h-4' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                  <span className='sr-only'>Copy URL</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hasCopied ? 'Copied!' : 'Copy URL'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='w-8 h-8 text-primary hover:text-primary hover:bg-primary/10'
                  onClick={() => setShowEditModal(true)}
                >
                  <Pencil className='w-4 h-4' />
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
                  className='w-8 h-8 text-primary hover:text-primary hover:bg-primary/10'
                  asChild
                >
                  <a href={link.url} target='_blank' rel='noopener noreferrer'>
                    <ExternalLink className='w-4 h-4' />
                    <span className='sr-only'>Visit Link</span>
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Visit Link</p>
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
                  onClick={handleDeleteClick}
                >
                  <Trash2 className='w-4 h-4' />
                  <span className='sr-only'>Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{link.title}&quot;? This
              action cannot be undone.
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

      {/* Edit Link Modal */}
      <LinkModal
        mode='edit'
        link={link}
        open={showEditModal}
        onOpenChange={setShowEditModal}
      />
    </>
  );
}
