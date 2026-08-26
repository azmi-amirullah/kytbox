import { describe, it, expect } from 'vitest';
import {
  getPriorityBadgeInfo,
  getPriorityRank,
  compareByPriority,
  compareByDueDate,
  filterAndSortItems,
} from '@/features/list/lib/priority';
import type { ListItemDTO } from '@/types/dto';

function makeMockItem(overrides: Partial<ListItemDTO> = {}): ListItemDTO {
  return {
    id: 'item-1',
    list_id: 'list-1',
    column_id: 'col-1',
    title: 'Test Task',
    description: null,
    is_completed: false,
    sort_order: 1024,
    metadata: {},
    created_at: '2026-08-26T00:00:00Z',
    due_date: null,
    reminder_sent: false,
    priority: null,
    ...overrides,
  };
}

describe('List Priority Lib', () => {
  describe('getPriorityBadgeInfo', () => {
    it('returns correct meta for each valid priority', () => {
      expect(getPriorityBadgeInfo('urgent')?.label).toBe('Urgent');
      expect(getPriorityBadgeInfo('high')?.label).toBe('High');
      expect(getPriorityBadgeInfo('medium')?.label).toBe('Medium');
      expect(getPriorityBadgeInfo('low')?.label).toBe('Low');
    });

    it('returns null for null, undefined, or invalid priority', () => {
      expect(getPriorityBadgeInfo(null)).toBeNull();
      expect(getPriorityBadgeInfo(undefined)).toBeNull();
      expect(getPriorityBadgeInfo('invalid')).toBeNull();
    });
  });

  describe('getPriorityRank', () => {
    it('ranks priorities in correct order (urgent > high > medium > low > none)', () => {
      expect(getPriorityRank('urgent')).toBe(4);
      expect(getPriorityRank('high')).toBe(3);
      expect(getPriorityRank('medium')).toBe(2);
      expect(getPriorityRank('low')).toBe(1);
      expect(getPriorityRank(null)).toBe(0);
      expect(getPriorityRank(undefined)).toBe(0);
    });
  });

  describe('compareByPriority', () => {
    it('sorts descending by default (urgent first, none last)', () => {
      const urgent = makeMockItem({ id: '1', priority: 'urgent' });
      const high = makeMockItem({ id: '2', priority: 'high' });
      const medium = makeMockItem({ id: '3', priority: 'medium' });
      const low = makeMockItem({ id: '4', priority: 'low' });
      const none = makeMockItem({ id: '5', priority: null });

      const items = [low, none, urgent, medium, high];
      const sorted = [...items].sort((a, b) => compareByPriority(a, b, 'desc'));

      expect(sorted.map((i) => i.id)).toEqual(['1', '2', '3', '4', '5']);
    });

    it('sorts ascending when requested (none first, urgent last)', () => {
      const urgent = makeMockItem({ id: '1', priority: 'urgent' });
      const low = makeMockItem({ id: '2', priority: 'low' });
      const none = makeMockItem({ id: '3', priority: null });

      const items = [urgent, none, low];
      const sorted = [...items].sort((a, b) => compareByPriority(a, b, 'asc'));

      expect(sorted.map((i) => i.id)).toEqual(['3', '2', '1']);
    });

    it('falls back to sort_order if priorities are equal', () => {
      const itemA = makeMockItem({ id: '1', priority: 'high', sort_order: 100 });
      const itemB = makeMockItem({ id: '2', priority: 'high', sort_order: 200 });

      expect(compareByPriority(itemA, itemB, 'desc')).toBeLessThan(0);
      expect(compareByPriority(itemB, itemA, 'desc')).toBeGreaterThan(0);
    });
  });

  describe('compareByDueDate', () => {
    it('places items with due dates before items without due dates', () => {
      const withDate = makeMockItem({ id: '1', due_date: '2026-08-30' });
      const withoutDate = makeMockItem({ id: '2', due_date: null });

      expect(compareByDueDate(withDate, withoutDate)).toBeLessThan(0);
      expect(compareByDueDate(withoutDate, withDate)).toBeGreaterThan(0);
    });

    it('sorts earlier dates before later dates', () => {
      const earlier = makeMockItem({ id: '1', due_date: '2026-08-20' });
      const later = makeMockItem({ id: '2', due_date: '2026-08-25' });

      expect(compareByDueDate(earlier, later)).toBeLessThan(0);
      expect(compareByDueDate(later, earlier)).toBeGreaterThan(0);
    });
  });

  describe('filterAndSortItems', () => {
    const items: ListItemDTO[] = [
      makeMockItem({ id: '1', priority: 'low', sort_order: 10 }),
      makeMockItem({ id: '2', priority: 'urgent', sort_order: 20 }),
      makeMockItem({ id: '3', priority: 'high', sort_order: 30 }),
      makeMockItem({ id: '4', priority: null, sort_order: 40 }),
      makeMockItem({ id: '5', priority: 'urgent', sort_order: 50 }),
    ];

    it('filters by priority correctly', () => {
      const urgentOnly = filterAndSortItems(items, 'urgent', 'manual');
      expect(urgentOnly.map((i) => i.id)).toEqual(['2', '5']);

      const highOnly = filterAndSortItems(items, 'high', 'manual');
      expect(highOnly.map((i) => i.id)).toEqual(['3']);
    });

    it('returns all items when filter is "all"', () => {
      const all = filterAndSortItems(items, 'all', 'manual');
      expect(all.length).toBe(5);
      expect(all.map((i) => i.id)).toEqual(['1', '2', '3', '4', '5']);
    });

    it('sorts by priority descending', () => {
      const sorted = filterAndSortItems(items, 'all', 'priority-desc');
      expect(sorted.map((i) => i.id)).toEqual(['2', '5', '3', '1', '4']);
    });

    it('sorts by priority ascending', () => {
      const sorted = filterAndSortItems(items, 'all', 'priority-asc');
      expect(sorted.map((i) => i.id)).toEqual(['4', '1', '3', '2', '5']);
    });
  });
});
