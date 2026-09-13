import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import {
  calculateFractionalSortOrder,
  DEFAULT_SORT_GAP,
} from '@/features/list/lib/fractional-indexing';
import { setColumnWipLimitSchema } from '@/features/list/schemas.server';
import { filterAndSortCards } from '@/features/list/lib/filter-cards';
import type { ListItemDTO } from '@/types/dto';

describe('Fractional Indexing, WIP Limits & Filter Pills (Day 17)', () => {
  describe('Fractional Indexing (calculateFractionalSortOrder)', () => {
    it('returns DEFAULT_SORT_GAP for empty column or only item', () => {
      expect(calculateFractionalSortOrder(null, null)).toBe(DEFAULT_SORT_GAP);
      expect(calculateFractionalSortOrder(undefined, undefined)).toBe(DEFAULT_SORT_GAP);
    });

    it('inserts at top before first item', () => {
      // next = 1000 -> 500
      expect(calculateFractionalSortOrder(null, 1000)).toBe(500);
      // next = 100 -> 50
      expect(calculateFractionalSortOrder(undefined, 100)).toBe(50);
      // next = 0 -> -1000
      expect(calculateFractionalSortOrder(null, 0)).toBe(-1000);
    });

    it('inserts at bottom after last item', () => {
      expect(calculateFractionalSortOrder(1000, null)).toBe(2000);
      expect(calculateFractionalSortOrder(2500, undefined)).toBe(3500);
    });

    it('inserts between two existing items via midpoint', () => {
      expect(calculateFractionalSortOrder(1000, 2000)).toBe(1500);
      expect(calculateFractionalSortOrder(1000, 1500)).toBe(1250);
      expect(calculateFractionalSortOrder(1000, 1001)).toBe(1000.5);
    });

    it('handles inverted or equal orders defensively by offsetting', () => {
      expect(calculateFractionalSortOrder(2000, 2000)).toBe(2000.5);
      expect(calculateFractionalSortOrder(3000, 2000)).toBe(3000.5);
    });
  });

  describe('WIP Limits Schema Validation', () => {
    it('accepts valid positive integer WIP limits', () => {
      const valid = setColumnWipLimitSchema.safeParse({
        columnId: '123e4567-e89b-12d3-a456-426614174000',
        wipLimit: 5,
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.wipLimit).toBe(5);
      }
    });

    it('allows clearing WIP limit by passing null or 0', () => {
      const nullCase = setColumnWipLimitSchema.safeParse({
        columnId: '123e4567-e89b-12d3-a456-426614174000',
        wipLimit: null,
      });
      expect(nullCase.success).toBe(true);
      if (nullCase.success) {
        expect(nullCase.data.wipLimit).toBeNull();
      }

      const zeroCase = setColumnWipLimitSchema.safeParse({
        columnId: '123e4567-e89b-12d3-a456-426614174000',
        wipLimit: 0,
      });
      expect(zeroCase.success).toBe(true);
      if (zeroCase.success) {
        expect(zeroCase.data.wipLimit).toBeNull();
      }
    });

    it('rejects negative numbers or numbers exceeding 500', () => {
      const negative = setColumnWipLimitSchema.safeParse({
        columnId: '123e4567-e89b-12d3-a456-426614174000',
        wipLimit: -1,
      });
      expect(negative.success).toBe(false);

      const tooLarge = setColumnWipLimitSchema.safeParse({
        columnId: '123e4567-e89b-12d3-a456-426614174000',
        wipLimit: 501,
      });
      expect(tooLarge.success).toBe(false);
    });
  });

  describe('Card Filtering Logic (filter-cards)', () => {
    const sampleItems: ListItemDTO[] = [
      {
        id: '1',
        list_id: 'list-1',
        title: 'Urgent client deployment',
        description: 'Deploy hotfix to production server',
        is_completed: false,
        column_id: 'col-1',
        priority: 'urgent',
        sort_order: 100,
        due_date: format(new Date(), 'yyyy-MM-dd'), // Today
        labels: ['Work', 'Production'],
        metadata: {},
        created_at: '2026-09-01T00:00:00Z',
      },
      {
        id: '2',
        list_id: 'list-1',
        title: 'Gym workout plan',
        description: null,
        is_completed: false,
        column_id: 'col-1',
        priority: 'low',
        sort_order: 200,
        due_date: '2020-01-01', // Overdue
        labels: ['Personal'],
        metadata: {},
        created_at: '2026-09-01T00:00:00Z',
      },
      {
        id: '3',
        list_id: 'list-1',
        title: 'Review PR #42',
        description: 'Check security headers and fractional indexing',
        is_completed: false,
        column_id: 'col-1',
        priority: 'high',
        sort_order: 300,
        due_date: null,
        labels: ['Work'],
        metadata: {},
        created_at: '2026-09-01T00:00:00Z',
      },
    ];

    it('filters cards by search query across title and description', () => {
      const results = filterAndSortCards(sampleItems, { search: 'hotfix' });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');

      const caseInsensitive = filterAndSortCards(sampleItems, { search: 'GYM' });
      expect(caseInsensitive).toHaveLength(1);
      expect(caseInsensitive[0].id).toBe('2');
    });

    it('filters cards by due date (today, overdue)', () => {
      const todayCards = filterAndSortCards(sampleItems, { dueDate: 'today' });
      expect(todayCards).toHaveLength(1);
      expect(todayCards[0].id).toBe('1');

      const overdueCards = filterAndSortCards(sampleItems, { dueDate: 'overdue' });
      expect(overdueCards).toHaveLength(1);
      expect(overdueCards[0].id).toBe('2');
    });

    it('filters cards by label match', () => {
      const workCards = filterAndSortCards(sampleItems, { label: 'Work' });
      expect(workCards).toHaveLength(2);
      expect(workCards.map((c) => c.id)).toEqual(['1', '3']);

      const personalCards = filterAndSortCards(sampleItems, { label: 'Personal' });
      expect(personalCards).toHaveLength(1);
      expect(personalCards[0].id).toBe('2');
    });

    it('combines multiple filters simultaneously', () => {
      const combined = filterAndSortCards(sampleItems, {
        priority: 'urgent',
        dueDate: 'today',
        label: 'Work',
      });
      expect(combined).toHaveLength(1);
      expect(combined[0].id).toBe('1');

      const noMatch = filterAndSortCards(sampleItems, {
        priority: 'low',
        dueDate: 'today',
      });
      expect(noMatch).toHaveLength(0);
    });
  });
});
