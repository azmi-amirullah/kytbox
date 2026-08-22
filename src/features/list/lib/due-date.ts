import { differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { parseDateOnly } from '@/lib/date-only';

export type DueDateStatus =
  | 'completed'
  | 'overdue'
  | 'due-today'
  | 'due-tomorrow'
  | 'upcoming'
  | 'none';

export interface DueDateInfo {
  status: DueDateStatus;
  label: string;
  badgeClassName: string;
  diffDays: number | null;
}

/**
 * Calculates due date status relative to a base date.
 */
export function getDueDateStatus(
  dueDate: string | null | undefined,
  isCompleted = false,
  baseDate: Date = new Date(),
): DueDateStatus {
  if (!dueDate) return 'none';
  if (isCompleted) return 'completed';

  const targetDate = startOfDay(parseDateOnly(dueDate));
  const today = startOfDay(baseDate);
  const diffDays = differenceInCalendarDays(targetDate, today);

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'due-today';
  if (diffDays === 1) return 'due-tomorrow';
  return 'upcoming';
}

/**
 * Formats a human-readable relative or calendar label for due dates.
 */
export function formatDueDateLabel(
  dueDate: string | null | undefined,
  isCompleted = false,
  baseDate: Date = new Date(),
): string {
  if (!dueDate) return '';

  const targetDate = startOfDay(parseDateOnly(dueDate));
  const today = startOfDay(baseDate);
  const diffDays = differenceInCalendarDays(targetDate, today);

  if (isCompleted) {
    return format(targetDate, targetDate.getFullYear() === today.getFullYear() ? 'MMM d' : 'MMM d, yyyy');
  }

  if (diffDays < -1) {
    return `Overdue (${Math.abs(diffDays)}d)`;
  }
  if (diffDays === -1) {
    return 'Overdue (1d)';
  }
  if (diffDays === 0) {
    return 'Due today';
  }
  if (diffDays === 1) {
    return 'Tomorrow';
  }

  const isSameYear = targetDate.getFullYear() === today.getFullYear();
  return format(targetDate, isSameYear ? 'MMM d' : 'MMM d, yyyy');
}

/**
 * Returns Tailwind class tokens matching Shadcn color semantics for due date chips.
 */
export function getDueDateBadgeStyles(status: DueDateStatus): string {
  switch (status) {
    case 'overdue':
      return 'text-rose-700 bg-rose-50 border-rose-200/80 dark:text-rose-300 dark:bg-rose-950/50 dark:border-rose-900/60 font-medium';
    case 'due-today':
      return 'text-amber-700 bg-amber-50 border-amber-200/80 dark:text-amber-300 dark:bg-amber-950/50 dark:border-amber-900/60 font-medium';
    case 'due-tomorrow':
      return 'text-sky-700 bg-sky-50 border-sky-200/80 dark:text-sky-300 dark:bg-sky-950/50 dark:border-sky-900/60 font-medium';
    case 'upcoming':
      return 'text-muted-foreground bg-muted/50 border-border/60 hover:border-border';
    case 'completed':
      return 'text-muted-foreground/60 bg-muted/20 border-transparent line-through';
    case 'none':
    default:
      return '';
  }
}

/**
 * Returns comprehensive due date view information in a single invocation.
 */
export function getDueDateInfo(
  dueDate: string | null | undefined,
  isCompleted = false,
  baseDate: Date = new Date(),
): DueDateInfo {
  if (!dueDate) {
    return {
      status: 'none',
      label: '',
      badgeClassName: '',
      diffDays: null,
    };
  }

  const targetDate = startOfDay(parseDateOnly(dueDate));
  const today = startOfDay(baseDate);
  const diffDays = differenceInCalendarDays(targetDate, today);
  const status = getDueDateStatus(dueDate, isCompleted, baseDate);
  const label = formatDueDateLabel(dueDate, isCompleted, baseDate);
  const badgeClassName = getDueDateBadgeStyles(status);

  return {
    status,
    label,
    badgeClassName,
    diffDays,
  };
}
