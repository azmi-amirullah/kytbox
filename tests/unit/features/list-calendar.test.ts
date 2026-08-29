import { describe, it, expect } from 'vitest';
import {
  getCalendarGrid,
  groupItemsByDate,
  filterCalendarItems,
  formatCalendarHeader,
  navigateCalendarDate,
} from '@/features/list/lib/calendar';
import type { ListItemDTO } from '@/types/dto';

describe('List Calendar Engine', () => {
  const baseDate = new Date(2026, 7, 15); // Aug 15, 2026

  describe('getCalendarGrid', () => {
    it('generates a full month grid with leading/trailing days (35 or 42 days)', () => {
      const grid = getCalendarGrid(baseDate, 'month', 0);
      expect([35, 42]).toContain(grid.length);

      // August 1, 2026 is a Saturday, so Sunday July 26 is the first day of grid
      expect(grid[0].dateKey).toBe('2026-07-26');
      expect(grid[0].isCurrentMonth).toBe(false);

      // Find Aug 15
      const aug15 = grid.find((d) => d.dateKey === '2026-08-15');
      expect(aug15).toBeDefined();
      expect(aug15?.isCurrentMonth).toBe(true);
      expect(aug15?.dayNumber).toBe(15);
    });

    it('generates exactly 7 days for week view', () => {
      const weekGrid = getCalendarGrid(baseDate, 'week', 0);
      expect(weekGrid).toHaveLength(7);
      expect(weekGrid[0].dateKey).toBe('2026-08-09'); // Sunday of that week
      expect(weekGrid[6].dateKey).toBe('2026-08-15'); // Saturday
    });

    it('correctly tags weekend days', () => {
      const grid = getCalendarGrid(baseDate, 'week', 0);
      expect(grid[0].isWeekend).toBe(true); // Sunday
      expect(grid[1].isWeekend).toBe(false); // Monday
      expect(grid[5].isWeekend).toBe(false); // Friday
      expect(grid[6].isWeekend).toBe(true); // Saturday
    });

    it('handles February leap year vs non-leap year correctly', () => {
      // 2028 is a leap year (Feb 29 days)
      const leapFeb = new Date(2028, 1, 15);
      const leapGrid = getCalendarGrid(leapFeb, 'month', 0);
      const feb29 = leapGrid.find((d) => d.dateKey === '2028-02-29');
      expect(feb29).toBeDefined();
      expect(feb29?.isCurrentMonth).toBe(true);
    });
  });

  describe('groupItemsByDate', () => {
    const mockItems: ListItemDTO[] = [
      {
        id: '1',
        list_id: 'list-1',
        column_id: 'col-1',
        title: 'Task A',
        description: null,
        is_completed: false,
        due_date: '2026-08-15',
        priority: 'urgent',
        recurrence_rule: null,
        sort_order: 0,
        metadata: {},
        created_at: '',
      },
      {
        id: '2',
        list_id: 'list-1',
        column_id: 'col-1',
        title: 'Task B',
        description: null,
        is_completed: true,
        due_date: '2026-08-15',
        priority: 'high',
        recurrence_rule: null,
        sort_order: 1,
        metadata: {},
        created_at: '',
      },
      {
        id: '3',
        list_id: 'list-1',
        column_id: 'col-1',
        title: 'Task C',
        description: null,
        is_completed: false,
        due_date: '2026-08-20',
        priority: 'medium',
        recurrence_rule: null,
        sort_order: 2,
        metadata: {},
        created_at: '',
      },
      {
        id: '4',
        list_id: 'list-1',
        column_id: 'col-1',
        title: 'Task Unscheduled',
        description: null,
        is_completed: false,
        due_date: null,
        priority: 'low',
        recurrence_rule: null,
        sort_order: 3,
        metadata: {},
        created_at: '',
      },
    ];

    it('groups scheduled items by yyyy-MM-dd date key', () => {
      const grouped = groupItemsByDate(mockItems);
      expect(grouped.byDate['2026-08-15']).toHaveLength(2);
      expect(grouped.byDate['2026-08-20']).toHaveLength(1);
      expect(grouped.byDate['2026-08-01']).toBeUndefined();
    });

    it('isolates items without due dates in unscheduled bucket', () => {
      const grouped = groupItemsByDate(mockItems);
      expect(grouped.unscheduled).toHaveLength(1);
      expect(grouped.unscheduled[0].title).toBe('Task Unscheduled');
    });
  });

  describe('filterCalendarItems', () => {
    const items: ListItemDTO[] = [
      { id: '1', list_id: 'l', column_id: 'c', title: '1', description: null, is_completed: false, due_date: '2026-08-15', priority: 'urgent', recurrence_rule: null, sort_order: 0, metadata: {}, created_at: '' },
      { id: '2', list_id: 'l', column_id: 'c', title: '2', description: null, is_completed: false, due_date: '2026-08-15', priority: 'low', recurrence_rule: null, sort_order: 1, metadata: {}, created_at: '' },
    ];

    it('returns all items when filter is "all"', () => {
      expect(filterCalendarItems(items, 'all')).toHaveLength(2);
    });

    it('filters items by urgent priority', () => {
      const filtered = filterCalendarItems(items, 'urgent');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  describe('formatCalendarHeader', () => {
    it('formats month view header as "MMMM yyyy"', () => {
      expect(formatCalendarHeader(baseDate, 'month')).toBe('August 2026');
    });

    it('formats week view header with date span', () => {
      const header = formatCalendarHeader(baseDate, 'week', 0);
      expect(header).toContain('2026');
      expect(header).toContain('Aug');
    });

    it('formats week spanning months correctly', () => {
      const transitionDate = new Date(2026, 7, 31); // Aug 31, 2026
      const header = formatCalendarHeader(transitionDate, 'week', 0);
      expect(header).toContain('Aug');
      expect(header).toContain('Sep');
    });
  });

  describe('navigateCalendarDate', () => {
    it('navigates next and previous month', () => {
      const nextMonth = navigateCalendarDate(baseDate, 'next', 'month');
      expect(nextMonth.getMonth()).toBe(8); // September (0-indexed 8)

      const prevMonth = navigateCalendarDate(baseDate, 'prev', 'month');
      expect(prevMonth.getMonth()).toBe(6); // July (0-indexed 6)
    });

    it('navigates next and previous week', () => {
      const nextWeek = navigateCalendarDate(baseDate, 'next', 'week');
      expect(nextWeek.getDate()).toBe(22); // Aug 15 + 7 = 22

      const prevWeek = navigateCalendarDate(baseDate, 'prev', 'week');
      expect(prevWeek.getDate()).toBe(8); // Aug 15 - 7 = 8
    });

    it('navigates to today', () => {
      const today = navigateCalendarDate(baseDate, 'today', 'month');
      const now = new Date();
      expect(today.toDateString()).toBe(now.toDateString());
    });
  });
});
