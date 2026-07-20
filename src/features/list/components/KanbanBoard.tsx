'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  LuPlus,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import type { ListDTO, ListColumnDTO, ListItemDTO } from '@/types/dto';
import { moveItem, addItem, reorderColumns } from '../actions';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import AddColumnModal from './AddColumnModal';
import { toast } from 'react-toastify';
import type { DropAnimation } from '@dnd-kit/core';

const DROP_ANIMATION: DropAnimation = {
  duration: 150,
  easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
};

interface KanbanBoardProps {
  list: ListDTO;
  initialColumns: ListColumnDTO[];
  initialItems: ListItemDTO[];
}

export default function KanbanBoard({
  list,
  initialColumns,
  initialItems,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  // Group items by column
  const itemsByColumn = useCallback(() => {
    const grouped: Record<string, ListItemDTO[]> = {};
    for (const col of columns) {
      grouped[col.id] = items
        .filter((item) => item.column_id === col.id)
        .sort((a, b) => a.sort_order - b.sort_order);
    }
    return grouped;
  }, [columns, items]);

  const findColumnOfItem = (itemId: string): string | null => {
    const item = items.find((i) => i.id === itemId);
    return item?.column_id || null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeItemId = String(active.id);
    const overId = String(over.id);

    // Handle column sorting dynamically
    const isActiveColumn = columns.some((c) => c.id === activeItemId);
    if (isActiveColumn) {
      const overColumn = columns.find((c) => c.id === overId);
      const overColumnId = overColumn ? overColumn.id : findColumnOfItem(overId);

      if (overColumnId && activeItemId !== overColumnId) {
        const oldIndex = columns.findIndex((c) => c.id === activeItemId);
        const newIndex = columns.findIndex((c) => c.id === overColumnId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          setColumns((prev) => arrayMove(prev, oldIndex, newIndex));
        }
      }
      return;
    }

    const activeColumnId = findColumnOfItem(activeItemId);
    // Check if over a column directly or an item in a column
    const overColumn = columns.find((c) => c.id === overId);
    const overColumnId = overColumn
      ? overColumn.id
      : findColumnOfItem(overId);

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) {
      return;
    }

    // Move item to the new column (optimistic)
    setItems((prev) =>
      prev.map((item) =>
        item.id === activeItemId
          ? { ...item, column_id: overColumnId }
          : item,
      ),
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeItemId = String(active.id);
    const overId = String(over.id);

    // Case 1: Column dragging
    const isColumnDrag = columns.some((c) => c.id === activeItemId);
    if (isColumnDrag) {
      if (activeItemId !== overId) {
        const oldIndex = columns.findIndex((c) => c.id === activeItemId);
        let newIndex = columns.findIndex((c) => c.id === overId);
        
        if (newIndex === -1) {
          const overItem = items.find((i) => i.id === overId);
          if (overItem) {
            newIndex = columns.findIndex((c) => c.id === overItem.column_id);
          }
        }

        if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
          const reordered = arrayMove(columns, oldIndex, newIndex);
          setColumns(reordered);
          await reorderColumns(list.id, reordered.map((c) => c.id));
        }
      }
      return;
    }

    const activeItem = items.find((i) => i.id === activeItemId);
    if (!activeItem) return;

    const columnId = activeItem.column_id;
    if (!columnId) return;

    // Reorder within column
    const columnItems = items
      .filter((i) => i.column_id === columnId)
      .sort((a, b) => a.sort_order - b.sort_order);
    const oldIndex = columnItems.findIndex((i) => i.id === activeItemId);
    const overItemInColumn = columnItems.findIndex((i) => i.id === overId);
    const newIndex = overItemInColumn >= 0 ? overItemInColumn : columnItems.length - 1;

    // Persist: check if target column is a done column
    const targetColumn = columns.find((c) => c.id === columnId);
    const isDone = targetColumn?.is_done_column || false;

    if (oldIndex !== newIndex) {
      const reordered = arrayMove(columnItems, oldIndex, newIndex);
      setItems((prev) => {
        const otherItems = prev.filter((i) => i.column_id !== columnId);
        return [
          ...otherItems,
          ...reordered.map((item, idx) => ({ 
            ...item, 
            sort_order: idx,
            is_completed: item.id === activeItemId 
              ? (isDone ? true : item.is_completed) 
              : item.is_completed
          })),
        ];
      });
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.id === activeItemId
            ? { ...item, is_completed: isDone ? true : item.is_completed }
            : item,
        ),
      );
    }

    const result = await moveItem(
      activeItemId,
      columnId,
      newIndex >= 0 ? newIndex : 0,
      isDone,
    );
    if (result.error) {
      toast.error(result.error);
    }
  };

  const handleAddCard = async (columnId: string, title: string) => {
    const formData = new FormData();
    formData.set('listId', list.id);
    formData.set('title', title);
    formData.set('columnId', columnId);

    const result = await addItem(formData);
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setItems((prev) => [...prev, result.data!]);
    }
  };

  const handleColumnAdded = (newColumn: ListColumnDTO) => {
    setColumns((prev) => [...prev, newColumn]);
  };

  const handleColumnDeleted = (columnId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
    // Cascade-delete items in that column (matches DB behavior)
    setItems((prev) => prev.filter((i) => i.column_id !== columnId));
  };

  const handleColumnUpdated = (updatedColumn: ListColumnDTO) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === updatedColumn.id ? updatedColumn : c)),
    );
  };

  const handleItemUpdated = (updatedItem: ListItemDTO) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
  };

  const handleItemDeleted = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const activeItem = activeId
    ? items.find((i) => i.id === activeId)
    : null;

  const activeColumn = activeId
    ? columns.find((c) => c.id === activeId)
    : null;

  const grouped = itemsByColumn();

  return (
    <div className='space-y-6'>
      {/* Breadcrumbs */}
      <nav aria-label='breadcrumb' className='flex items-center gap-1 text-sm text-muted-foreground'>
        <Link href='/app' className='hover:text-foreground transition-colors'>
          Kytbox
        </Link>
        <span className='text-muted-foreground'>/</span>
        <Link href='/list' className='hover:text-foreground transition-colors'>
          List
        </Link>
        <span className='text-muted-foreground'>/</span>
        <Link href='/list/todo' className='hover:text-foreground transition-colors'>
          Todo
        </Link>
        <span className='text-muted-foreground'>/</span>
        <span aria-current='page' className='text-foreground font-medium truncate max-w-[200px]'>
          {list.title}
        </span>
      </nav>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight'>{list.title}</h1>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className='flex items-start gap-4 overflow-x-auto pb-4 -mx-4 px-4'>
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                items={grouped[column.id] || []}
                onAddCard={handleAddCard}
                onColumnDeleted={handleColumnDeleted}
                onColumnUpdated={handleColumnUpdated}
                onItemUpdated={handleItemUpdated}
                onItemDeleted={handleItemDeleted}
              />
            ))}
          </SortableContext>

          {/* Add column button */}
          <div className='min-w-[280px] shrink-0'>
            <Button
              variant='outline'
              className='w-full h-12 border-dashed gap-2'
              onClick={() => setIsAddColumnOpen(true)}
            >
              <LuPlus className='w-4 h-4' />
              Add Column
            </Button>
          </div>
        </div>

        <DragOverlay dropAnimation={DROP_ANIMATION}>
          {activeItem ? (
            <KanbanCard item={activeItem} isDragging onDelete={() => {}} />
          ) : activeColumn ? (
            <div className='opacity-80 rotate-1 scale-105 shadow-2xl'>
              <KanbanColumn
                column={activeColumn}
                items={grouped[activeColumn.id] || []}
                onAddCard={() => {}}
                onColumnDeleted={() => {}}
                onColumnUpdated={() => {}}
                onItemUpdated={() => {}}
                onItemDeleted={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddColumnModal
        listId={list.id}
        open={isAddColumnOpen}
        onOpenChange={setIsAddColumnOpen}
        onColumnAdded={handleColumnAdded}
      />
    </div>
  );
}
