import type { ListItemDTO } from '@/types/dto';
import { isToday, isThisWeek, isBefore, parseISO, startOfDay } from 'date-fns';
import { type PriorityFilterOption, type PrioritySortOption, sortItemsByPriority } from './priority';

export type DueDateFilterOption = 'all' | 'today' | 'week' | 'this-week' | 'overdue' | 'no-due-date';
export type DueFilterOption = DueDateFilterOption;

export interface CardFilters {
  priority?: PriorityFilterOption;
  dueDate?: DueDateFilterOption;
  dueFilter?: DueDateFilterOption;
  label?: string | 'all';
  labels?: string[];
  search?: string;
  sort?: PrioritySortOption;
}

export function matchesDueFilter(
  dueDateStr: string | null | undefined,
  isCompletedOrFilter: boolean | DueDateFilterOption,
  filterOption?: DueDateFilterOption,
  referenceDate: Date = new Date(),
): boolean {
  let isCompleted = false;
  let filter: DueDateFilterOption = 'all';

  if (typeof isCompletedOrFilter === 'boolean') {
    isCompleted = isCompletedOrFilter;
    filter = filterOption || 'all';
  } else {
    filter = isCompletedOrFilter;
  }

  if (filter === 'all') return true;

  if (filter === 'no-due-date') {
    return !dueDateStr;
  }

  if (!dueDateStr) return false;

  const due = parseISO(dueDateStr);
  const todayStart = startOfDay(referenceDate);

  if (filter === 'overdue') {
    return !isCompleted && isBefore(due, todayStart);
  }

  if (filter === 'today') {
    return isToday(due);
  }

  if (filter === 'week' || filter === 'this-week') {
    return isThisWeek(due, { weekStartsOn: 1 });
  }

  return true;
}

export function matchesLabelFilter(
  cardLabels: string[] | undefined,
  activeLabels: string[] | undefined,
): boolean {
  if (!activeLabels || activeLabels.length === 0) return true;
  if (!cardLabels || cardLabels.length === 0) return false;

  const cardLabelLowerSet = new Set(cardLabels.map((l) => l.toLowerCase()));
  return activeLabels.some((active) => cardLabelLowerSet.has(active.toLowerCase()));
}

export function matchesSearchFilter(
  item: ListItemDTO,
  searchQuery?: string,
): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;
  const q = searchQuery.trim().toLowerCase();

  const titleMatch = item.title.toLowerCase().includes(q);
  if (titleMatch) return true;

  const descMatch = item.description?.toLowerCase().includes(q) ?? false;
  if (descMatch) return true;

  const labelMatch = item.labels?.some((l) => l.toLowerCase().includes(q)) ?? false;
  return labelMatch;
}

/**
 * Filters and sorts items in-memory with zero refetch latency.
 */
export function filterAndSortCards(
  cards: ListItemDTO[],
  filters: CardFilters = {},
  sortOption: PrioritySortOption = 'manual',
  referenceDate: Date = new Date(),
): ListItemDTO[] {
  const {
    priority = 'all',
    dueDate,
    dueFilter,
    label,
    labels = [],
    search = '',
    sort,
  } = filters;

  const effectiveDueFilter = dueDate || dueFilter || 'all';
  const effectiveLabels = labels.slice();
  if (label && label !== 'all' && !effectiveLabels.includes(label)) {
    effectiveLabels.push(label);
  }
  const effectiveSort = sort || sortOption;

  const filtered = cards.filter((item) => {
    // Priority filter
    if (priority !== 'all' && item.priority !== priority) {
      return false;
    }

    // Due date filter
    if (!matchesDueFilter(item.due_date, item.is_completed, effectiveDueFilter, referenceDate)) {
      return false;
    }

    // Label filter
    if (!matchesLabelFilter(item.labels, effectiveLabels)) {
      return false;
    }

    // Search query
    if (!matchesSearchFilter(item, search)) {
      return false;
    }

    return true;
  });

  return sortItemsByPriority(filtered, effectiveSort);
}

