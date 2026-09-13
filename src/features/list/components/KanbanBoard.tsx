'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  LuColumns2,
  LuCalendar,
  LuSearch,
  LuDownload,
  LuUpload,
  LuTag,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ListDTO, ListColumnDTO, ListItemDTO, ListLabelDTO } from '@/types/dto';
import { moveItem, addItem, reorderColumns, createListLabel, deleteListLabel } from '../actions';
import {
  PRIORITY_CONFIG,
  type PriorityFilterOption,
  type PrioritySortOption,
} from '../lib/priority';
import {
  filterAndSortCards,
  matchesDueFilter,
  type DueDateFilterOption,
} from '../lib/filter-cards';
import { calculateFractionalSortOrder } from '../lib/fractional-indexing';
import { resolveLabelColor } from '../lib/label-colors';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import AddColumnModal from './AddColumnModal';
import CalendarView from './CalendarView';
import BoardImportModal from './BoardImportModal';
import BoardExportModal from './BoardExportModal';
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
  initialLabels?: ListLabelDTO[];
}

export default function KanbanBoard({
  list,
  initialColumns,
  initialItems,
  initialLabels = [],
}: KanbanBoardProps) {
  const router = useRouter();
  const [columns, setColumns] = useState(initialColumns);
  const [items, setItems] = useState(initialItems);
  const [labels, setLabels] = useState<ListLabelDTO[]>(initialLabels);
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [dueFilter, setDueFilter] = useState<DueDateFilterOption>('all');
  const [filterPriority, setFilterPriority] = useState<PriorityFilterOption>('all');
  const [selectedLabel, setSelectedLabel] = useState<string | 'all'>('all');
  const [sortOption, setSortOption] = useState<PrioritySortOption>('manual');

  const [dragOriginColumnId, setDragOriginColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  // Label management
  const handleCreateLabel = useCallback(
    async (name: string, colorIndex?: number) => {
      const res = await createListLabel(list.id, name, colorIndex);
      if (res.error) {
        toast.error(res.error);
      } else if (res.data) {
        setLabels((prev) => [...prev, res.data!]);
        toast.success(`Label "${name}" created`);
      }
    },
    [list.id],
  );

  const handleDeleteLabel = useCallback(
    async (labelId: string) => {
      const target = labels.find((l) => l.id === labelId);
      const res = await deleteListLabel(list.id, labelId);
      if (res.error) {
        toast.error(res.error);
      } else {
        setLabels((prev) => prev.filter((l) => l.id !== labelId));
        if (target) {
          setItems((prev) =>
            prev.map((item) =>
              item.labels?.includes(target.name)
                ? { ...item, labels: item.labels.filter((name) => name !== target.name) }
                : item,
            ),
          );
        }
        if (selectedLabel === target?.name) {
          setSelectedLabel('all');
        }
        toast.success('Label deleted');
      }
    },
    [labels, selectedLabel, list.id],
  );

  // Live counts across all items
  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length, urgent: 0, high: 0, medium: 0, low: 0 };
    for (const item of items) {
      if (item.priority && counts[item.priority] !== undefined) {
        counts[item.priority]++;
      }
    }
    return counts;
  }, [items]);

  const dueCounts = useMemo(() => {
    return {
      today: items.filter((i) => matchesDueFilter(i.due_date, 'today')).length,
      week: items.filter((i) => matchesDueFilter(i.due_date, 'week')).length,
      overdue: items.filter((i) => matchesDueFilter(i.due_date, 'overdue')).length,
    };
  }, [items]);

  // Group, filter, and sort items by column
  const itemsByColumn = useCallback(() => {
    const grouped: Record<string, ListItemDTO[]> = {};
    for (const col of columns) {
      const colItems = items.filter((item) => item.column_id === col.id);
      grouped[col.id] = filterAndSortCards(colItems, {
        search: searchQuery,
        dueDate: dueFilter,
        priority: filterPriority,
        label: selectedLabel,
        sort: sortOption,
      });
    }
    return grouped;
  }, [columns, items, searchQuery, dueFilter, filterPriority, selectedLabel, sortOption]);

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
    const overColumn = columns.find((c) => c.id === overId);
    const overColumnId = overColumn ? overColumn.id : findColumnOfItem(overId);

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

    const targetColumn = columns.find((c) => c.id === columnId);
    const isDone = targetColumn?.is_done_column || false;
    const isChangingColumn = originColumnId !== null && originColumnId !== columnId;
    const isEnteringDoneColumn = isChangingColumn && isDone;
    const isRecurring = Boolean(activeItem.recurrence_rule);

    // High visibility warning if target column WIP limit exceeded
    if (isChangingColumn && targetColumn?.wip_limit && targetColumn.wip_limit > 0) {
      const currentCardsInTarget = items.filter((i) => i.column_id === columnId).length;
      if (currentCardsInTarget > targetColumn.wip_limit) {
        toast.warning(
          `WIP limit exceeded for "${targetColumn.title}" (${currentCardsInTarget}/${targetColumn.wip_limit})`,
        );
      }
    }

    // Reorder within target column using fractional indexing
    const columnItems = items
      .filter((i) => i.column_id === columnId)
      .sort((a, b) => a.sort_order - b.sort_order);
    const oldIndex = columnItems.findIndex((i) => i.id === activeItemId);
    const overItemInColumn = columnItems.findIndex((i) => i.id === overId);
    const newIndex = overItemInColumn >= 0 ? overItemInColumn : columnItems.length - 1;

    // If item was dropped in place without changing position or column, no-op
    if (!isChangingColumn && oldIndex === newIndex) {
      return;
    }

    // Fractional indexing calculation (strictly 1 single database update)
    const reordered = arrayMove(
      columnItems,
      oldIndex >= 0 ? oldIndex : columnItems.length - 1,
      newIndex >= 0 ? newIndex : 0,
    );
    const finalIndex = reordered.findIndex((i) => i.id === activeItemId);
    const prevItem = finalIndex > 0 ? reordered[finalIndex - 1] : undefined;
    const nextItem = finalIndex < reordered.length - 1 ? reordered[finalIndex + 1] : undefined;
    const newSortOrder = calculateFractionalSortOrder(prevItem?.sort_order, nextItem?.sort_order);

    setItems((prev) =>
      prev.map((item) =>
        item.id === activeItemId
          ? {
              ...item,
              column_id: columnId,
              sort_order: newSortOrder,
              is_completed: isEnteringDoneColumn ? (isRecurring ? false : true) : item.is_completed,
            }
          : item,
      ),
    );

    const result = await moveItem(
      activeItemId,
      columnId,
      newSortOrder,
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

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    dueFilter !== 'all' ||
    filterPriority !== 'all' ||
    selectedLabel !== 'all' ||
    sortOption !== 'manual';

  const handleResetFilters = () => {
    setSearchQuery('');
    setDueFilter('all');
    setFilterPriority('all');
    setSelectedLabel('all');
    setSortOption('manual');
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

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h1 className='text-3xl font-bold tracking-tight'>{list.title}</h1>

          {/* Action Bar: Import/Export & View Switcher */}
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-8 px-2.5 text-xs font-medium gap-1.5'
              onClick={() => setIsImportOpen(true)}
              title='Import cards from Trello JSON or Notion/CSV'
            >
              <LuUpload className='w-3.5 h-3.5' />
              <span>Import</span>
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-8 px-2.5 text-xs font-medium gap-1.5'
              onClick={() => setIsExportOpen(true)}
              title='Export board to Markdown or CSV'
            >
              <LuDownload className='w-3.5 h-3.5' />
              <span>Export</span>
            </Button>

            {/* View Mode Switcher: Kanban vs Calendar */}
            <div className='flex items-center rounded-lg border border-border/80 p-0.5 bg-muted/40 shadow-2xs'>
              <Button
                type='button'
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size='sm'
                className={`h-7 px-3 text-xs font-medium rounded-md gap-1.5 transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setViewMode('kanban')}
              >
                <LuColumns2 className='w-3.5 h-3.5' />
                <span>Kanban</span>
              </Button>
              <Button
                type='button'
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                size='sm'
                className={`h-7 px-3 text-xs font-medium rounded-md gap-1.5 transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setViewMode('calendar')}
              >
                <LuCalendar className='w-3.5 h-3.5' />
                <span>Calendar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <CalendarView
          list={list}
          columns={columns}
          items={items}
          onItemUpdated={handleItemUpdated}
          onItemAdded={(newItem) => setItems((prev) => [...prev, newItem])}
        />
      ) : (
        <>
          {/* Quick Filter Pills & Search Bar */}
          <div className='space-y-2.5 pb-2 border-b border-border/50'>
            {/* Top row: Search input + Due Date Pills + Reset */}
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex flex-wrap items-center gap-2 flex-1 min-w-70'>
                {/* Search Bar */}
                <div className='relative w-full sm:w-64'>
                  <LuSearch className='absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none' />
                  <Input
                    placeholder='Filter cards...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='h-7.5 pl-8 pr-7 text-xs rounded-full bg-muted/30 focus:bg-background'
                    aria-label='Filter cards by title or description'
                  />
                  {searchQuery && (
                    <button
                      type='button'
                      onClick={() => setSearchQuery('')}
                      className='absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5'
                      aria-label='Clear search'
                    >
                      <LuX className='w-3 h-3' />
                    </button>
                  )}
                </div>

                {/* Due Date Pills */}
                <div className='flex items-center gap-1.5 flex-wrap'>
                  <span className='text-[11px] font-semibold text-muted-foreground flex items-center gap-1'>
                    <LuCalendar className='w-3 h-3' />
                    Due:
                  </span>
                  <Button
                    type='button'
                    variant={dueFilter === 'all' ? 'secondary' : 'ghost'}
                    size='sm'
                    className={`h-6.5 text-[11px] px-2 rounded-full ${
                      dueFilter === 'all'
                        ? 'bg-secondary font-semibold text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setDueFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    type='button'
                    variant={dueFilter === 'today' ? 'secondary' : 'ghost'}
                    size='sm'
                    className={`h-6.5 text-[11px] px-2 rounded-full ${
                      dueFilter === 'today'
                        ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setDueFilter(dueFilter === 'today' ? 'all' : 'today')}
                  >
                    Today
                    {dueCounts.today > 0 && (
                      <span className='ml-1 text-[10px] opacity-80'>({dueCounts.today})</span>
                    )}
                  </Button>
                  <Button
                    type='button'
                    variant={dueFilter === 'week' ? 'secondary' : 'ghost'}
                    size='sm'
                    className={`h-6.5 text-[11px] px-2 rounded-full ${
                      dueFilter === 'week'
                        ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setDueFilter(dueFilter === 'week' ? 'all' : 'week')}
                  >
                    This Week
                    {dueCounts.week > 0 && (
                      <span className='ml-1 text-[10px] opacity-80'>({dueCounts.week})</span>
                    )}
                  </Button>
                  <Button
                    type='button'
                    variant={dueFilter === 'overdue' ? 'secondary' : 'ghost'}
                    size='sm'
                    className={`h-6.5 text-[11px] px-2 rounded-full ${
                      dueFilter === 'overdue'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setDueFilter(dueFilter === 'overdue' ? 'all' : 'overdue')}
                  >
                    Overdue
                    {dueCounts.overdue > 0 && (
                      <span className='ml-1 text-[10px] font-bold text-rose-500'>
                        ({dueCounts.overdue})
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Sort Menu */}
              <div className='flex items-center gap-2'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={sortOption !== 'manual' ? 'secondary' : 'outline'}
                      size='sm'
                      className={`h-7 text-xs px-2.5 gap-1.5 ${
                        sortOption !== 'manual' ? 'border-primary/30 font-medium' : ''
                      }`}
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
                        {sortOption === opt.value && (
                          <LuCheck className='w-3.5 h-3.5 text-primary' />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {hasActiveFilters && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='h-7 text-xs px-2 text-muted-foreground hover:text-destructive gap-1'
                    onClick={handleResetFilters}
                  >
                    <LuX className='w-3 h-3' />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom row: Priority & Label Pills */}
            <div className='flex flex-wrap items-center justify-between gap-3'>
              {/* Priority Filters */}
              <div className='flex flex-wrap items-center gap-1.5'>
                <span className='text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1'>
                  <LuFilter className='w-3 h-3' />
                  Priority:
                </span>
                <Button
                  type='button'
                  variant={filterPriority === 'all' ? 'secondary' : 'ghost'}
                  size='sm'
                  className={`h-6.5 text-[11px] px-2 rounded-full ${
                    filterPriority === 'all'
                      ? 'bg-secondary font-semibold text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setFilterPriority('all')}
                >
                  All
                  <span className='ml-1 text-[10px] opacity-75'>({priorityCounts.all})</span>
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
                      className={`h-6.5 text-[11px] px-2 rounded-full border transition-all ${
                        isSelected
                          ? `${cfg.activeClassName} font-semibold shadow-xs`
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                      onClick={() => setFilterPriority(isSelected ? 'all' : p)}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClassName}`} />
                      {cfg.label}
                      <span className='text-[10px] opacity-75'>({count})</span>
                    </Button>
                  );
                })}
              </div>

              {/* Label Pills (if board has custom labels) */}
              {labels.length > 0 && (
                <div className='flex flex-wrap items-center gap-1.5'>
                  <span className='text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1'>
                    <LuTag className='w-3 h-3' />
                    Label:
                  </span>
                  <Button
                    type='button'
                    variant={selectedLabel === 'all' ? 'secondary' : 'ghost'}
                    size='sm'
                    className={`h-6.5 text-[11px] px-2 rounded-full ${
                      selectedLabel === 'all'
                        ? 'bg-secondary font-semibold text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setSelectedLabel('all')}
                  >
                    All
                  </Button>
                  {labels.map((lbl) => {
                    const isSelected = selectedLabel === lbl.name;
                    const token = resolveLabelColor(lbl.color_index);
                    return (
                      <button
                        key={lbl.id}
                        type='button'
                        onClick={() => setSelectedLabel(isSelected ? 'all' : lbl.name)}
                        className={`h-6.5 text-[11px] px-2 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? `${token.bg} ${token.text} ${token.border} font-semibold ring-2 ring-primary/30`
                            : 'bg-muted/30 text-muted-foreground border-border/60 hover:text-foreground'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${token.dot}`} />
                        <span>{lbl.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Board DndContext */}
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
                    boardLabels={labels}
                    onCreateLabel={handleCreateLabel}
                    onDeleteLabel={handleDeleteLabel}
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
                <KanbanCard
                  item={activeItem}
                  isDragging
                  onDelete={() => {}}
                  boardLabels={labels}
                />
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
                    boardLabels={labels}
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

          <BoardImportModal
            listId={list.id}
            open={isImportOpen}
            onOpenChange={setIsImportOpen}
            onImportComplete={() => {
              router.refresh();
            }}
          />

          <BoardExportModal
            list={list}
            columns={columns}
            items={items}
            open={isExportOpen}
            onOpenChange={setIsExportOpen}
          />
        </>
      )}
    </div>
  );
}
