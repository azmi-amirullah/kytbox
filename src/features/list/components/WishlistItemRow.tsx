'use client';

import { useState, useTransition } from 'react';
import { LuTrash2, LuExternalLink } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ListItemDTO } from '@/types/dto';
import { toggleItem, deleteItem } from '../actions';
import { toast } from 'react-toastify';
import { wishlistMetadataClientSchema } from '../schemas.client';
import EditWishlistItemModal from './EditWishlistItemModal';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WishlistItemRowProps {
  item: ListItemDTO;
  onUpdate: (item: ListItemDTO) => void;
  onDelete: (itemId: string) => void;
}

export default function WishlistItemRow({
  item,
  onUpdate,
  onDelete,
}: WishlistItemRowProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: isPending,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    touchAction: 'none',
  };

  const { price: rawPrice, currency: rawCurrency, purchase_url: rawUrl } = wishlistMetadataClientSchema.parse(item.metadata);
  const price = rawPrice ?? 0;
  const currency = rawCurrency ?? '';
  const purchaseUrl = rawUrl ?? undefined;

  const handleToggle = () => {
    if (isPending) return;
    startTransition(async () => {
      const result = await toggleItem(item.id, !item.is_completed);
      if (result.error) {
        toast.error(result.error);
      } else {
        onUpdate({ ...item, is_completed: !item.is_completed });
      }
    });
  };

  const handleDelete = () => {
    if (isPending) return;
    startTransition(async () => {
      const result = await deleteItem(item.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        onDelete(item.id);
      }
    });
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`group flex items-center gap-3 p-4 bg-card border rounded-xl transition-all duration-300 cursor-pointer hover:border-pink-500/30 ${
          item.is_completed ? 'opacity-60' : ''
        } ${isDragging ? 'shadow-md border-pink-500/30 opacity-50 z-50' : ''}`}
        role='button'
        tabIndex={0}
        onClick={() => setIsEditOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsEditOpen(true);
          }
        }}
      >
        <Checkbox
          checked={item.is_completed}
          onCheckedChange={handleToggle}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={`cursor-pointer ${isPending ? 'cursor-wait' : 'cursor-pointer'} border-muted-foreground/60 dark:border-muted-foreground/40 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:border-emerald-500`}
          aria-label={`Mark "${item.title}" as ${item.is_completed ? 'not purchased' : 'purchased'}`}
        />

        <div className='flex-1 min-w-0'>
          <span
            className={`text-sm font-medium transition-all duration-300 ${
              item.is_completed ? 'line-through text-muted-foreground' : ''
            }`}
          >
            {item.title}
          </span>
          {item.description && (
            <p className='text-xs text-muted-foreground truncate mt-0.5'>
              {item.description}
            </p>
          )}
        </div>

        <div className='flex items-center gap-2 shrink-0' onPointerDown={(e) => e.stopPropagation()}>
          {price > 0 && (
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                item.is_completed
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
              }`}
            >
              {currency} {price.toLocaleString()}
            </span>
          )}

          {purchaseUrl && (
            <a
              href={purchaseUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-muted-foreground hover:text-primary transition-colors'
              aria-label={`Open purchase link for "${item.title}"`}
              onClick={(e) => e.stopPropagation()}
            >
              <LuExternalLink className='w-4 h-4' />
            </a>
          )}

          <Button
            variant='ghost'
            size='icon'
            className={`h-7 w-7 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ${isPending ? 'cursor-wait' : 'cursor-pointer'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            aria-label={`Delete "${item.title}"`}
          >
            <LuTrash2 className='w-3.5 h-3.5' />
          </Button>
        </div>
      </div>

      <EditWishlistItemModal
        item={item}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onItemUpdated={onUpdate}
      />
    </>
  );
}
