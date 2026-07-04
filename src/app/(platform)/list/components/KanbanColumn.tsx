'use client';

import { useState, useTransition } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  LuPlus,
  LuEllipsisVertical,
  LuPencil,
  LuTrash2,
  LuCircleCheck,
  LuCircle,
} from 'react-icons/lu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ListColumnDTO, ListItemDTO } from '@/types/dto';
import { updateColumn, toggleDoneColumn } from '../column-actions';
import KanbanCard from './KanbanCard';
import DeleteColumnDialog from './DeleteColumnDialog';
import { toast } from 'react-toastify';

interface KanbanColumnProps {
  column: ListColumnDTO;
  items: ListItemDTO[];
  onAddCard: (columnId: string, title: string) => void;
  onColumnDeleted: (columnId: string) => void;
  onColumnUpdated: (column: ListColumnDTO) => void;
  onItemUpdated: (item: ListItemDTO) => void;
  onItemDeleted: (itemId: string) => void;
}

export default function KanbanColumn({
  column,
  items,
  onAddCard,
  onColumnDeleted,
  onColumnUpdated,
  onItemUpdated,
  onItemDeleted,
}: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [, startTransition] = useTransition();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    onAddCard(column.id, newCardTitle.trim());
    setNewCardTitle('');
    setIsAdding(false);
  };

  const handleSaveTitle = () => {
    if (!editTitle.trim()) return;

    startTransition(async () => {
      const result = await updateColumn(column.id, editTitle.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        onColumnUpdated({ ...column, title: editTitle.trim() });
        setIsEditingTitle(false);
      }
    });
  };

  const handleToggleDone = () => {
    startTransition(async () => {
      const result = await toggleDoneColumn(column.id, !column.is_done_column);
      if (result.error) {
        toast.error(result.error);
      } else {
        onColumnUpdated({
          ...column,
          is_done_column: !column.is_done_column,
        });
      }
    });
  };

  // Green accent for done columns
  const columnBorderClass = column.is_done_column
    ? 'border-emerald-500/30 bg-emerald-500/5'
    : 'border-border bg-muted/30';

  const headerClass = column.is_done_column
    ? 'text-emerald-600 dark:text-emerald-400'
    : '';

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`min-w-[280px] w-[280px] shrink-0 rounded-xl border p-3 flex flex-col max-h-[calc(100vh-200px)] ${columnBorderClass} ${
          isDragging ? 'opacity-40 border-dashed' : ''
        }`}
      >
        {/* Column header (acts as drag handle) */}
        <div
          {...attributes}
          {...listeners}
          className='flex items-center justify-between mb-3 cursor-pointer select-none'
        >
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            {column.is_done_column && (
              <LuCircleCheck className='w-4 h-4 text-emerald-500 shrink-0' />
            )}
            {isEditingTitle ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setEditTitle(column.title);
                    setIsEditingTitle(false);
                  }
                }}
                className='h-7 text-sm font-semibold'
                maxLength={50}
              />
            ) : (
              <button
                type='button'
                className={`text-sm font-semibold truncate cursor-pointer hover:opacity-80 transition-opacity text-left outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm ${headerClass}`}
                onClick={() => setIsEditingTitle(true)}
                aria-label={`Edit column ${column.title}`}
              >
                {column.title}
              </button>
            )}
            <span className='text-xs text-muted-foreground shrink-0'>
              {items.length}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-7 w-7 shrink-0'
                aria-label='Column actions'
              >
                <LuEllipsisVertical className='w-3.5 h-3.5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                <LuPencil className='w-4 h-4 mr-2' />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleDone}>
                {column.is_done_column ? (
                  <>
                    <LuCircle className='w-4 h-4 mr-2' />
                    Unmark as Done
                  </>
                ) : (
                  <>
                    <LuCircleCheck className='w-4 h-4 mr-2' />
                    Mark as Done
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeleteOpen(true)}
                className='text-destructive focus:text-destructive'
              >
                <LuTrash2 className='w-4 h-4 mr-2' />
                Delete Column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Cards */}
        <div className='flex-1 overflow-y-auto space-y-2 min-h-[40px]'>
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <KanbanCard key={item.id} item={item} onUpdate={onItemUpdated} onDelete={onItemDeleted} />
            ))}
          </SortableContext>
        </div>

        {/* Add card */}
        <div className='mt-2'>
          {isAdding ? (
            <form onSubmit={handleAddCard} className='space-y-2'>
              <Input
                placeholder='Card title...'
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                maxLength={300}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setNewCardTitle('');
                    setIsAdding(false);
                  }
                }}
              />
              <div className='flex gap-2'>
                <Button type='submit' size='sm' disabled={!newCardTitle.trim()}>
                  Add
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setNewCardTitle('');
                    setIsAdding(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant='ghost'
              className='w-full justify-start gap-2 text-muted-foreground h-8 text-xs'
              onClick={() => setIsAdding(true)}
            >
              <LuPlus className='w-3.5 h-3.5' />
              Add Card
            </Button>
          )}
        </div>
      </div>

      <DeleteColumnDialog
        column={column}
        itemCount={items.length}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onDeleted={onColumnDeleted}
      />
    </>
  );
}
