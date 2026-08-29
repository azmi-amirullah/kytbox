import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  format,
  startOfDay,
} from 'date-fns';
import { parseDateOnly } from '@/lib/date-only';
import type { ListItemDTO } from '@/types/dto';
import { filterAndSortItems, type PriorityFilterOption } from './priority';

export type CalendarViewMode = 'month' | 'week';

export interface CalendarDay {
  date: Date;
  dateKey: string; // 'yyyy-MM-dd'
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
}

export interface GroupedCalendarItems {
  byDate: Record<string, ListItemDTO[]>;
  unscheduled: ListItemDTO[];
}

/**
 * Generates the array of calendar days for month or week view.
 * For month view: provides a standard 35 or 42 grid covering padding days from adjacent months.
 * For week view: provides exactly 7 days starting from Sunday (or configured start day).
 */
export function getCalendarGrid(
  currentDate: Date,
  viewMode: CalendarViewMode,
  weekStartsOn: 0 | 1 = 0, // 0 = Sunday, 1 = Monday
): CalendarDay[] {
  const base = startOfDay(currentDate);

  let start: Date;
  let end: Date;

  if (viewMode === 'month') {
    const monthStart = startOfMonth(base);
    const monthEnd = endOfMonth(base);
    start = startOfWeek(monthStart, { weekStartsOn });
    end = endOfWeek(monthEnd, { weekStartsOn });
  } else {
    start = startOfWeek(base, { weekStartsOn });
    end = endOfWeek(base, { weekStartsOn });
  }

  const days = eachDayOfInterval({ start, end });

  return days.map((date) => {
    const dayOfWeek = date.getDay();
    return {
      date,
      dateKey: format(date, 'yyyy-MM-dd'),
      dayNumber: date.getDate(),
      isToday: isToday(date),
      isCurrentMonth: viewMode === 'week' ? true : isSameMonth(date, base),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    };
  });
}

/**
 * Indexes list items by their yyyy-MM-dd due date key,
 * and collects all items without a due date into an unscheduled array.
 */
export function groupItemsByDate(items: ListItemDTO[]): GroupedCalendarItems {
  const byDate: Record<string, ListItemDTO[]> = {};
  const unscheduled: ListItemDTO[] = [];

  for (const item of items) {
    if (!item.due_date) {
      unscheduled.push(item);
      continue;
    }

    try {
      const parsed = parseDateOnly(item.due_date);
      const key = format(parsed, 'yyyy-MM-dd');
      if (!byDate[key]) {
        byDate[key] = [];
      }
      byDate[key].push(item);
    } catch {
      unscheduled.push(item);
    }
  }

  return { byDate, unscheduled };
}

/**
 * Filters items for the calendar view based on priority filter.
 */
export function filterCalendarItems(
  items: ListItemDTO[],
  filterPriority: PriorityFilterOption,
): ListItemDTO[] {
  return filterAndSortItems(items, filterPriority, 'manual');
}

/**
 * Formats a clean header string for the current calendar period.
 */
export function formatCalendarHeader(
  currentDate: Date,
  viewMode: CalendarViewMode,
  weekStartsOn: 0 | 1 = 0,
): string {
  if (viewMode === 'month') {
    return format(currentDate, 'MMMM yyyy');
  }

  const start = startOfWeek(currentDate, { weekStartsOn });
  const end = endOfWeek(currentDate, { weekStartsOn });

  const sameMonth = isSameMonth(start, end);
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${format(start, 'd')} – ${format(end, 'd MMMM yyyy')}`;
  }

  if (sameYear) {
    return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`;
  }

  return `${format(start, 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`;
}

/**
 * Navigates to next/previous period based on view mode.
 */
export function navigateCalendarDate(
  currentDate: Date,
  direction: 'prev' | 'next' | 'today',
  viewMode: CalendarViewMode,
): Date {
  if (direction === 'today') {
    return new Date();
  }

  if (viewMode === 'month') {
    return direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
  }

  return direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
}
