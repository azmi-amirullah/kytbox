'use client';

import { useState, useCallback, useMemo } from 'react';
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
  LuArrowUpDown,
  LuFilter,
  LuX,
  LuCheck,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ListDTO, ListColumnDTO, ListItemDTO } from '@/types/dto';
import { moveItem, addItem, reorderColumns } from '../actions';
import {
  filterAndSortItems,
  PRIORITY_CONFIG,
  type PriorityFilterOption,
  type PrioritySortOption,
} from '../lib/priority';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import AddColumnModal from './AddColumnModal';
import { toast } from 'react-toastify';
import type { DropAnimation } from '@dnd-kit/core';

const DROP_ANIMATION: DropAnimation = {
  duration: 150,
  easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
};

const SORT_OPTIONS: { value: PrioritySortOption; label: string }[] = [
  { value: 'manual', label: 'Manual (Default)' },
  { value: 'priority-desc', label: 'Priority: High → Low' },
  { value: 'priority-asc', label: 'Priority: Low → High' },
  { value: 'due-date', label: 'Due Date' },
];

const SORT_LABELS: Record<PrioritySortOption, string> = {
  manual: 'Manual (Default)',
  'priority-desc': 'Priority: High → Low',
  'priority-asc': 'Priority: Low → High',
  'due-date': 'Due Date',
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
  const [filterPriority, setFilterPriority] = useState<PriorityFilterOption>('all');
  const [sortOption, setSortOption] = useState<PrioritySortOption>('manual');

  const [dragOriginColumnId, setDragOriginColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  // Live priority counts across the board
  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length, urgent: 0, high: 0, medium: 0, low: 0 };
    for (const item of items) {
      if (item.priority && counts[item.priority] !== undefined) {
        counts[item.priority]++;
      }
    }
    return counts;
  }, [items]);

  // Group, filter, and sort items by column
  const itemsByColumn = useCallback(() => {
    const grouped: Record<string, ListItemDTO[]> = {};
    for (const col of columns) {
      const colItems = items.filter((item) => item.column_id === col.id);
      grouped[col.id] = filterAndSortItems(colItems, filterPriority, sortOption);
    }
    return grouped;
  }, [columns, items, filterPriority, sortOption]);

  const findColumnOfItem = (itemId: string): string | null => {
    const item = items.find((i) => i.id === itemId);
    return item?.column_id || null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeItemId = String(event.active.id);
    setActiveId(activeItemId);
    setDragOriginColumnId(findColumnOfItem(activeItemId));
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
    const originColumnId = dragOriginColumnId;
    setDragOriginColumnId(null);

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
    const isChangingColumn = originColumnId !== null && originColumnId !== columnId;
    const isEnteringDoneColumn = isChangingColumn && isDone;
    const isRecurring = Boolean(activeItem.recurrence_rule);

    // If item was dropped in place without changing position or column, no-op
    if (!isChangingColumn && oldIndex === newIndex) {
      return;
    }

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
              ? (isEnteringDoneColumn ? (isRecurring ? false : true) : item.is_completed) 
              : item.is_completed
          })),
        ];
      });
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.id === activeItemId
            ? { ...item, is_completed: isEnteringDoneColumn ? (isRecurring ? false : true) : item.is_completed }
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
    } else if (result.recurringAdvanced && result.nextDueDate) {
      const finalColumnId =
        result.targetColumnId ??
        columns.find((c) => !c.is_done_column)?.id ??
        columnId;

      toast.success(
        `🎉 Recurring task completed! Next cycle due on ${result.nextDueDate}`,
      );
      setItems((prev) =>
        prev.map((item) =>
          item.id === activeItemId
            ? {
                ...item,
                column_id: finalColumnId,
                is_completed: false,
                due_date: result.nextDueDate,
                subtasks: (item.subtasks ?? []).map((s) => ({
                  ...s,
                  is_completed: false,
                })),
              }
            : item,
        ),
      );
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
      {/* Header Section */}
      <div className='space-y-1.5 sm:space-y-2'>
        <BreadcrumbNav title={list.title} />

        {/* Header */}
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold tracking-tight'>{list.title}</h1>
        </div>
      </div>

      {/* Filter & Sort Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-border/50'>
        {/* Priority Filters */}
        <div className='flex flex-wrap items-center gap-1.5'>
          <span className='text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1'>
            <LuFilter className='w-3.5 h-3.5' />
            Filter:
          </span>
          <Button
            type='button'
            variant={filterPriority === 'all' ? 'secondary' : 'ghost'}
            size='sm'
            className={`h-7 text-xs px-2.5 rounded-full ${
              filterPriority === 'all'
                ? 'bg-secondary font-semibold text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setFilterPriority('all')}
          >
            All
            <span className='ml-1 text-xs opacity-75'>({priorityCounts.all})</span>
          </Button>
          {(['urgent', 'high', 'medium', 'low'] as const).map((p) => {
            const cfg = PRIORITY_CONFIG[p];
            const isSelected = filterPriority === p;
            const count = priorityCounts[p] || 0;
            return (
              <Button
                key={p}
                type='button'
                variant='ghost'
                size='sm'
                className={`h-7 text-xs px-2.5 rounded-full border transition-all ${
                  isSelected
                    ? `${cfg.activeClassName} font-semibold shadow-xs`
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                onClick={() => setFilterPriority(isSelected ? 'all' : p)}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.dotClassName}`} />
                {cfg.label}
                <span className='text-xs opacity-75'>({count})</span>
              </Button>
            );
          })}
          {filterPriority !== 'all' && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-7 text-xs px-2 text-muted-foreground hover:text-destructive gap-1'
              onClick={() => setFilterPriority('all')}
            >
              <LuX className='w-3 h-3' />
              Reset
            </Button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className='flex items-center gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={sortOption !== 'manual' ? 'secondary' : 'outline'}
                size='sm'
                className={`h-7 text-xs px-2.5 gap-1.5 ${sortOption !== 'manual' ? 'border-primary/30 font-medium' : ''}`}
              >
                <LuArrowUpDown className='w-3.5 h-3.5' />
                <span>Sort: {SORT_LABELS[sortOption]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  className='flex items-center justify-between text-xs cursor-pointer'
                  onClick={() => setSortOption(opt.value)}
                >
                  <span>{opt.label}</span>
                  {sortOption === opt.value && <LuCheck className='w-3.5 h-3.5 text-primary' />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Board */}
      <DndContext
        id={`kanban-board-${list.id}`}
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
          <div className='min-w-70 shrink-0'>
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
