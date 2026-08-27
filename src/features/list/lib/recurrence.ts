import {
  addDays,
  addMonths,
  format,
  isSaturday,
  isSunday,
  startOfDay,
} from 'date-fns';
import { parseDateOnly } from '@/lib/date-only';
import type { ListItemRecurrenceRule } from '@/types/dto';

export interface RecurrenceMeta {
  value: ListItemRecurrenceRule;
  label: string;
  shortLabel: string;
  description: string;
  badgeClassName: string;
}

export const RECURRENCE_CONFIG: Record<ListItemRecurrenceRule, RecurrenceMeta> = {
  daily: {
    value: 'daily',
    label: 'Daily',
    shortLabel: 'Daily',
    description: 'Repeats every day',
    badgeClassName:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
  },
  weekdays: {
    value: 'weekdays',
    label: 'Weekdays (Mon–Fri)',
    shortLabel: 'Weekdays',
    description: 'Repeats Monday through Friday',
    badgeClassName:
      'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60',
  },
  weekly: {
    value: 'weekly',
    label: 'Weekly',
    shortLabel: 'Weekly',
    description: 'Repeats once a week on the same day',
    badgeClassName:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
  },
  monthly: {
    value: 'monthly',
    label: 'Monthly',
    shortLabel: 'Monthly',
    description: 'Repeats once a month on the same date',
    badgeClassName:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  },
};

export const RECURRENCE_OPTIONS: RecurrenceMeta[] = [
  RECURRENCE_CONFIG.daily,
  RECURRENCE_CONFIG.weekdays,
  RECURRENCE_CONFIG.weekly,
  RECURRENCE_CONFIG.monthly,
];

export function isListItemRecurrenceRule(
  rule: unknown,
): rule is ListItemRecurrenceRule {
  return (
    rule === 'daily' ||
    rule === 'weekdays' ||
    rule === 'weekly' ||
    rule === 'monthly'
  );
}

export function getRecurrenceInfo(
  rule: string | null | undefined,
): RecurrenceMeta | null {
  if (!isListItemRecurrenceRule(rule)) return null;
  return RECURRENCE_CONFIG[rule];
}

/**
 * Calculates the next due date based on recurrence rule.
 * If the current due date is in the past (overdue), calculation anchors to `baseDate` (today)
 * so the next occurrence is not instantly created in the past.
 */
export function calculateNextRecurrenceDate(
  currentDueDate: string | null | undefined,
  rule: ListItemRecurrenceRule,
  baseDate: Date = new Date(),
): string {
  const today = startOfDay(baseDate);
  let refDate = today;

  if (currentDueDate) {
    const parsedTarget = startOfDay(parseDateOnly(currentDueDate));
    // If the due date is today or in the future, advance from that due date.
    // If it's in the past (overdue), advance from today instead.
    if (parsedTarget >= today) {
      refDate = parsedTarget;
    }
  }

  let nextDate: Date;

  switch (rule) {
    case 'daily':
      nextDate = addDays(refDate, 1);
      break;

    case 'weekdays': {
      let candidate = addDays(refDate, 1);
      while (isSaturday(candidate) || isSunday(candidate)) {
        candidate = addDays(candidate, 1);
      }
      nextDate = candidate;
      break;
    }

    case 'weekly':
      nextDate = addDays(refDate, 7);
      break;

    case 'monthly':
      nextDate = addMonths(refDate, 1);
      break;
  }

  return format(nextDate, 'yyyy-MM-dd');
}
