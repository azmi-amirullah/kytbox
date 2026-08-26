import type { ListItemDTO, ListItemPriority } from '@/types/dto';

export type PriorityFilterOption = 'all' | ListItemPriority;
export type PrioritySortOption = 'manual' | 'priority-desc' | 'priority-asc' | 'due-date';

export interface PriorityMeta {
  value: ListItemPriority;
  label: string;
  rank: number;
  badgeClassName: string;
  dotClassName: string;
  activeClassName: string;
}

export const PRIORITY_CONFIG: Record<ListItemPriority, PriorityMeta> = {
  urgent: {
    value: 'urgent',
    label: 'Urgent',
    rank: 4,
    badgeClassName: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60',
    dotClassName: 'bg-red-500',
    activeClassName: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40',
  },
  high: {
    value: 'high',
    label: 'High',
    rank: 3,
    badgeClassName: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    dotClassName: 'bg-amber-500',
    activeClassName: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40',
  },
  medium: {
    value: 'medium',
    label: 'Medium',
    rank: 2,
    badgeClassName: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    dotClassName: 'bg-sky-500',
    activeClassName: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40',
  },
  low: {
    value: 'low',
    label: 'Low',
    rank: 1,
    badgeClassName: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60',
    dotClassName: 'bg-slate-400',
    activeClassName: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/40',
  },
};

export const PRIORITY_OPTIONS: PriorityMeta[] = [
  PRIORITY_CONFIG.urgent,
  PRIORITY_CONFIG.high,
  PRIORITY_CONFIG.medium,
  PRIORITY_CONFIG.low,
];

export function isListItemPriority(priority: unknown): priority is ListItemPriority {
  return priority === 'urgent' || priority === 'high' || priority === 'medium' || priority === 'low';
}

export function getPriorityBadgeInfo(priority: string | null | undefined): PriorityMeta | null {
  if (!isListItemPriority(priority)) return null;
  return PRIORITY_CONFIG[priority];
}

export function getPriorityRank(priority: string | null | undefined): number {
  if (!isListItemPriority(priority)) return 0;
  return PRIORITY_CONFIG[priority].rank;
}

export function compareByPriority(
  a: ListItemDTO,
  b: ListItemDTO,
  direction: 'desc' | 'asc' = 'desc',
): number {
  const rankA = getPriorityRank(a.priority);
  const rankB = getPriorityRank(b.priority);

  if (rankA !== rankB) {
    return direction === 'desc' ? rankB - rankA : rankA - rankB;
  }

  // Fallback to sort_order or creation date if priorities are equal
  return a.sort_order - b.sort_order || (a.created_at ?? '').localeCompare(b.created_at ?? '');
}

export function compareByDueDate(a: ListItemDTO, b: ListItemDTO): number {
  const dateA = a.due_date;
  const dateB = b.due_date;

  // Items with due dates come first
  if (dateA && !dateB) return -1;
  if (!dateA && dateB) return 1;
  if (dateA && dateB) {
    const diff = dateA.localeCompare(dateB);
    if (diff !== 0) return diff;
  }

  // Fallback to priority desc, then sort_order
  const rankDiff = getPriorityRank(b.priority) - getPriorityRank(a.priority);
  if (rankDiff !== 0) return rankDiff;

  return a.sort_order - b.sort_order;
}

export function filterAndSortItems(
  items: ListItemDTO[],
  filterPriority: PriorityFilterOption = 'all',
  sortOption: PrioritySortOption = 'manual',
): ListItemDTO[] {
  // 1. Filter
  let result = items;
  if (filterPriority !== 'all') {
    result = items.filter((item) => item.priority === filterPriority);
  }

  // 2. Sort
  if (sortOption === 'manual') {
    return [...result].sort((a, b) => a.sort_order - b.sort_order);
  }

  if (sortOption === 'priority-desc') {
    return [...result].sort((a, b) => compareByPriority(a, b, 'desc'));
  }

  if (sortOption === 'priority-asc') {
    return [...result].sort((a, b) => compareByPriority(a, b, 'asc'));
  }

  if (sortOption === 'due-date') {
    return [...result].sort(compareByDueDate);
  }

  return [...result].sort((a, b) => a.sort_order - b.sort_order);
}
