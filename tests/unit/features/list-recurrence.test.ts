import { describe, it, expect } from 'vitest';
import {
  isListItemRecurrenceRule,
  getRecurrenceInfo,
  calculateNextRecurrenceDate,
  RECURRENCE_CONFIG,
} from '@/features/list/lib/recurrence';
import {
  listItemRecurrenceSchema,
  setRecurrenceSchema,
} from '@/features/list/schemas.server';
import { listItemRecurrenceClientSchema } from '@/features/list/schemas.client';
import { mapListItemToDTO } from '@/lib/mappers';
import type { ListItem } from '@/types/database';

describe('List Recurrence Engine', () => {
  describe('isListItemRecurrenceRule', () => {
    it('returns true for valid recurrence rules', () => {
      expect(isListItemRecurrenceRule('daily')).toBe(true);
      expect(isListItemRecurrenceRule('weekdays')).toBe(true);
      expect(isListItemRecurrenceRule('weekly')).toBe(true);
      expect(isListItemRecurrenceRule('monthly')).toBe(true);
    });

    it('returns false for invalid values', () => {
      expect(isListItemRecurrenceRule(null)).toBe(false);
      expect(isListItemRecurrenceRule(undefined)).toBe(false);
      expect(isListItemRecurrenceRule('')).toBe(false);
      expect(isListItemRecurrenceRule('yearly')).toBe(false);
      expect(isListItemRecurrenceRule(123)).toBe(false);
    });
  });

  describe('getRecurrenceInfo', () => {
    it('returns correct metadata for valid rules', () => {
      expect(getRecurrenceInfo('daily')?.label).toBe('Daily');
      expect(getRecurrenceInfo('weekdays')?.shortLabel).toBe('Weekdays');
      expect(getRecurrenceInfo('weekly')?.label).toBe('Weekly');
      expect(getRecurrenceInfo('monthly')?.label).toBe('Monthly');
    });

    it('returns null for null, undefined, or invalid rules', () => {
      expect(getRecurrenceInfo(null)).toBeNull();
      expect(getRecurrenceInfo(undefined)).toBeNull();
      expect(getRecurrenceInfo('random')).toBeNull();
    });
  });

  describe('calculateNextRecurrenceDate', () => {
    const fixedToday = new Date('2026-08-27T10:00:00Z'); // Thursday

    it('advances daily tasks by 1 day', () => {
      const next = calculateNextRecurrenceDate('2026-08-27', 'daily', fixedToday);
      expect(next).toBe('2026-08-28');
    });

    it('advances daily tasks from future due date', () => {
      const next = calculateNextRecurrenceDate('2026-08-30', 'daily', fixedToday);
      expect(next).toBe('2026-08-31');
    });

    it('advances daily tasks from today if current due date is overdue in the past', () => {
      const next = calculateNextRecurrenceDate('2026-08-01', 'daily', fixedToday);
      expect(next).toBe('2026-08-28');
    });

    it('advances weekdays tasks: Mon-Thu moves to next day', () => {
      // 2026-08-27 is Thursday -> Friday
      const nextThu = calculateNextRecurrenceDate('2026-08-27', 'weekdays', fixedToday);
      expect(nextThu).toBe('2026-08-28');
    });

    it('advances weekdays tasks: Friday moves to Monday (skips weekend)', () => {
      const friBase = new Date('2026-08-28T10:00:00Z'); // Friday
      const nextFri = calculateNextRecurrenceDate('2026-08-28', 'weekdays', friBase);
      expect(nextFri).toBe('2026-08-31'); // Monday
    });

    it('advances weekdays tasks: Saturday moves to Monday', () => {
      const satBase = new Date('2026-08-29T10:00:00Z'); // Saturday
      const nextSat = calculateNextRecurrenceDate('2026-08-29', 'weekdays', satBase);
      expect(nextSat).toBe('2026-08-31'); // Monday
    });

    it('advances weekly tasks by 7 days', () => {
      const next = calculateNextRecurrenceDate('2026-08-27', 'weekly', fixedToday);
      expect(next).toBe('2026-09-03');
    });

    it('advances weekly tasks from today if overdue', () => {
      const next = calculateNextRecurrenceDate('2026-07-15', 'weekly', fixedToday);
      expect(next).toBe('2026-09-03');
    });

    it('advances monthly tasks by 1 month', () => {
      const next = calculateNextRecurrenceDate('2026-08-27', 'monthly', fixedToday);
      expect(next).toBe('2026-09-27');
    });

    it('handles month-end date capping cleanly', () => {
      const jan31 = new Date('2026-01-31T10:00:00Z');
      const next = calculateNextRecurrenceDate('2026-01-31', 'monthly', jan31);
      expect(next).toBe('2026-02-28');
    });

    it('handles null due date by advancing from today', () => {
      const nextDaily = calculateNextRecurrenceDate(null, 'daily', fixedToday);
      expect(nextDaily).toBe('2026-08-28');

      const nextWeekly = calculateNextRecurrenceDate(null, 'weekly', fixedToday);
      expect(nextWeekly).toBe('2026-09-03');
    });
  });

  describe('Server Zod Schemas', () => {
    it('validates correct recurrence rules', () => {
      expect(listItemRecurrenceSchema.safeParse('daily').success).toBe(true);
      expect(listItemRecurrenceSchema.safeParse('weekdays').success).toBe(true);
      expect(listItemRecurrenceSchema.safeParse('weekly').success).toBe(true);
      expect(listItemRecurrenceSchema.safeParse('monthly').success).toBe(true);
      expect(listItemRecurrenceSchema.safeParse(null).success).toBe(true);
      expect(listItemRecurrenceSchema.safeParse('').success).toBe(true);
      expect(listItemRecurrenceSchema.safeParse(undefined).success).toBe(true);
    });

    it('rejects invalid recurrence rules', () => {
      expect(listItemRecurrenceSchema.safeParse('yearly').success).toBe(false);
      expect(listItemRecurrenceSchema.safeParse('custom').success).toBe(false);
    });

    it('validates setRecurrenceSchema', () => {
      const valid = setRecurrenceSchema.safeParse({
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        recurrenceRule: 'weekly',
      });
      expect(valid.success).toBe(true);

      const clearRecurrence = setRecurrenceSchema.safeParse({
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        recurrenceRule: null,
      });
      expect(clearRecurrence.success).toBe(true);
    });
  });

  describe('Client Zod Schemas', () => {
    it('parses valid rules and catches invalid to null', () => {
      expect(listItemRecurrenceClientSchema.parse('daily')).toBe('daily');
      expect(listItemRecurrenceClientSchema.parse('weekdays')).toBe('weekdays');
      expect(listItemRecurrenceClientSchema.parse('weekly')).toBe('weekly');
      expect(listItemRecurrenceClientSchema.parse('monthly')).toBe('monthly');
      expect(listItemRecurrenceClientSchema.parse(null)).toBeNull();
      expect(listItemRecurrenceClientSchema.parse('invalid_rule')).toBeNull();
      expect(listItemRecurrenceClientSchema.parse(1234)).toBeNull();
    });
  });

  describe('DTO Mapping', () => {
    it('maps recurrence_rule accurately from database row', () => {
      const mockRow: ListItem = {
        id: 'item-1',
        list_id: 'list-1',
        column_id: 'col-1',
        title: 'Weekly Standup',
        description: 'Sync team progress',
        is_completed: false,
        sort_order: 1024,
        metadata: {},
        created_at: '2026-08-27T00:00:00Z',
        due_date: '2026-08-27',
        priority: 'high',
        recurrence_rule: 'weekly',
        reminder_sent: false,
      };

      const dto = mapListItemToDTO(mockRow);
      expect(dto.recurrence_rule).toBe('weekly');
      expect(dto.title).toBe('Weekly Standup');
    });

    it('defaults invalid or null recurrence_rule to null', () => {
      const mockRow: ListItem = {
        id: 'item-2',
        list_id: 'list-1',
        column_id: 'col-1',
        title: 'One-off Task',
        description: null,
        is_completed: false,
        sort_order: 2048,
        metadata: {},
        created_at: '2026-08-27T00:00:00Z',
        due_date: null,
        priority: null,
        recurrence_rule: null,
        reminder_sent: false,
      };

      const dto = mapListItemToDTO(mockRow);
      expect(dto.recurrence_rule).toBeNull();
    });
  });
});
