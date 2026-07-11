'use client';

import { useState, useTransition } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LuTrash2 } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import type { ListItemDTO } from '@/types/dto';
import { deleteItem, toggleItem } from '../actions';
import { toast } from 'react-toastify';
import EditTodoModal from './EditTodoModal';
import { Checkbox } from '@/components/ui/checkbox';


interface KanbanCardProps {
  item: ListItemDTO;
  isDragging?: boolean;
  onUpdate?: (item: ListItemDTO) => void;
  onDelete: (itemId: string) => void;
}

export default function KanbanCard({
  item,
  isDragging,
  onUpdate,
  onDelete,
}: KanbanCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: item.id,
    disabled: isPending,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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

  const handleToggle = () => {
    if (isPending) return;
    startTransition(async () => {
      const result = await toggleItem(item.id, !item.is_completed);
      if (result.error) {
        toast.error(result.error);
      } else {
        onUpdate?.({ ...item, is_completed: !item.is_completed });
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
        className={`group bg-card border rounded-lg p-3 cursor-pointer transition-all ${
          isDragging
            ? 'shadow-xl opacity-90 rotate-2 scale-105 z-50'
            : isSortableDragging
              ? 'opacity-40 border-dashed'
              : 'hover:shadow-sm hover:border-primary/50'
        } ${item.is_completed ? 'opacity-60' : ''}`}
      >
        <div className='flex items-start gap-2.5'>
          <Checkbox
            checked={item.is_completed}
            onCheckedChange={handleToggle}
            onPointerDown={(e) => e.stopPropagation()}
            className={`mt-1 shrink-0 ${isPending ? 'cursor-wait' : 'cursor-pointer'} border-muted-foreground/60 dark:border-muted-foreground/40 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:border-emerald-500`}
            aria-label={`Mark "${item.title}" as ${item.is_completed ? 'incomplete' : 'complete'}`}
          />
          <div
            role='button'
            tabIndex={0}
            onClick={() => setIsEditOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsEditOpen(true);
              }
            }}
            className='flex-1 text-left min-w-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 rounded p-0.5 cursor-pointer'
            aria-label={`Edit task "${item.title}"`}
          >
            <p
              className={`text-sm font-medium ${
                item.is_completed
                  ? 'line-through text-muted-foreground'
                  : ''
              }`}
            >
              {item.title}
            </p>
            {item.description && (
              <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>
                {item.description}
              </p>
            )}
          </div>
          <Button
            variant='ghost'
            size='icon'
            className={`h-6 w-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 ${isPending ? 'cursor-wait' : 'cursor-pointer'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={`Delete "${item.title}"`}
          >
            <LuTrash2 className='w-3 h-3' />
          </Button>
        </div>
      </div>

      <EditTodoModal
        item={item}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onUpdated={(updatedItem) => onUpdate?.(updatedItem)}
      />
    </>
  );
}
