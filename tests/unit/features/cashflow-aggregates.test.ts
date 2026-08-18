import { describe, it, expect } from 'vitest';
import {
  getAvailableMonths,
  compareMonths,
} from '@/features/cashflow/math';
import { aggregateEntriesByMonth } from '@/features/cashflow/lib/aggregateEntries';
import { aggregateEntriesByCategory } from '@/features/cashflow/lib/aggregateCategories';
import type { CashflowChartAggregateDTO, CashflowEntryDTO } from '@/types/dto';

const sampleAggregates: CashflowChartAggregateDTO[] = [
  // 2026-07 (Income: 4000, Expense: 2500)
  { cashflow_id: 'cf-1', month: '2026-07', type: 'income', category: 'salary', total_amount: 4000 },
  { cashflow_id: 'cf-1', month: '2026-07', type: 'expense', category: 'rent', total_amount: 1200 },
  { cashflow_id: 'cf-1', month: '2026-07', type: 'expense', category: 'food', total_amount: 800 },
  { cashflow_id: 'cf-2', month: '2026-07', type: 'expense', category: 'travel', total_amount: 500 },

  // 2026-08 (Income: 4600, Expense: 2300)
  { cashflow_id: 'cf-1', month: '2026-08', type: 'income', category: 'salary', total_amount: 4000 },
  { cashflow_id: 'cf-1', month: '2026-08', type: 'income', category: 'freelance', total_amount: 600 },
  { cashflow_id: 'cf-1', month: '2026-08', type: 'expense', category: 'rent', total_amount: 1200 },
  { cashflow_id: 'cf-1', month: '2026-08', type: 'expense', category: 'food', total_amount: 900 },
  { cashflow_id: 'cf-2', month: '2026-08', type: 'expense', category: 'entertainment', total_amount: 200 },
];

const sampleRawEntries: CashflowEntryDTO[] = [
  // 2026-07
  { id: '1', cashflow_id: 'cf-1', goal_id: null, description: '', amount: 4000, type: 'income', category: 'salary', date: '2026-07-01', created_at: null, is_recurring: false, recurrence_interval: null, yearly_calculation: null, tags: [] },
  { id: '2', cashflow_id: 'cf-1', goal_id: null, description: '', amount: 1200, type: 'expense', category: 'rent', date: '2026-07-05', created_at: null, is_recurring: false, recurrence_interval: null, yearly_calculation: null, tags: [] },
  { id: '3', cashflow_id: 'cf-1', goal_id: null, description: '', amount: 800, type: 'expense', category: 'food', date: '2026-07-10', created_at: null, is_recurring: false, recurrence_interval: null, yearly_calculation: null, tags: [] },
  { id: '4', cashflow_id: 'cf-2', goal_id: null, description: '', amount: 500, type: 'expense', category: 'travel', date: '2026-07-20', created_at: null, is_recurring: false, recurrence_interval: null, yearly_calculation: null, tags: [] },

  // 2026-08
  { id: '5', cashflow_id: 'cf-1', goal_id: null, description: '', amount: 4000, type: 'income', category: 'salary', date: '2026-08-01', created_at: null, is_recurring: false, recurrence_interval: null, yearly_calculation: null, tags: [] },
  { id: '6', cashflow_id: 'cf-1', goal_id: null, description: '', amount: 600, type: 'income', category: 'freelance', date: '2026-08-03', created_at: null, is_recurring: false, recurrence_interval: null, yearly_calculation: null, tags: [] },
  { id: '7', cashflow_id: 'cf-1', goal_id: null, description: '', amount: 1200, type: 'expense', category: 'rent', date: '2026-08-05', created_at: null, is_recurring: false, recurrence_interval: null, yearly_calculation: null, tags: [] },
  { id: '8', cashflow_id: 'cf-1', goal_id: null, description: '', amount: 900, type: 'expense', category: 'food', date: '2026-08-12', created_at: null, is_recurring: false, recurrence_interval: null, yearly_calculation: null, tags: [] },
  { id: '9', cashflow_id: 'cf-2', goal_id: null, description: '', amount: 200, type: 'expense', category: 'entertainment', date: '2026-08-25', created_at: null, is_recurring: false, recurrence_interval: null, yearly_calculation: null, tags: [] },
];

describe('Cashflow Aggregate Processing', () => {
  describe('aggregateEntriesByMonth with aggregates', () => {
    it('calculates monthly income, expense, and cumulative balance accurately', () => {
      const result = aggregateEntriesByMonth(sampleAggregates);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        month: 'Jul',
        monthKey: '2026-07',
        income: 4000,
        expense: 2500,
        balance: 1500, // 4000 - 2500
      });
      expect(result[1]).toEqual({
        month: 'Aug',
        monthKey: '2026-08',
        income: 4600,
        expense: 2300,
        balance: 3800, // 1500 + (4600 - 2300)
      });
    });

    it('produces identical monthly results between raw entries and aggregates', () => {
      const fromAggregates = aggregateEntriesByMonth(sampleAggregates);
      const fromRaw = aggregateEntriesByMonth(sampleRawEntries);

      expect(fromAggregates).toEqual(fromRaw);
    });

    it('returns empty array on empty input', () => {
      expect(aggregateEntriesByMonth([])).toEqual([]);
    });
  });

  describe('aggregateEntriesByCategory with aggregates', () => {
    it('aggregates expenses by category and sorts descending', () => {
      const result = aggregateEntriesByCategory(sampleAggregates, 'expense');

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Rent', value: 2400 }), // 1200 + 1200
          expect.objectContaining({ name: 'Food', value: 1700 }), // 800 + 900
          expect.objectContaining({ name: 'Travel', value: 500 }),
          expect.objectContaining({ name: 'Entertainment', value: 200 }),
        ])
      );
      expect(result[0].name).toBe('Rent');
      expect(result[1].name).toBe('Food');
    });

    it('aggregates income by category and sorts descending', () => {
      const result = aggregateEntriesByCategory(sampleAggregates, 'income');

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Salary', value: 8000 }),
          expect.objectContaining({ name: 'Freelance', value: 600 }),
        ])
      );
      expect(result[0].name).toBe('Salary');
    });

    it('produces identical category results between raw entries and aggregates', () => {
      const expenseAggs = aggregateEntriesByCategory(sampleAggregates, 'expense');
      const expenseRaw = aggregateEntriesByCategory(sampleRawEntries, 'expense');
      expect(expenseAggs).toEqual(expenseRaw);

      const incomeAggs = aggregateEntriesByCategory(sampleAggregates, 'income');
      const incomeRaw = aggregateEntriesByCategory(sampleRawEntries, 'income');
      expect(incomeAggs).toEqual(incomeRaw);
    });
  });

  describe('getAvailableMonths with aggregates', () => {
    it('extracts unique available months sorted descending', () => {
      const available = getAvailableMonths(sampleAggregates);
      expect(available).toHaveLength(2);
      expect(available[0].key).toBe('2026-08');
      expect(available[1].key).toBe('2026-07');
    });
  });

  describe('compareMonths with aggregates', () => {
    it('produces identical comparison results between raw entries and aggregates', () => {
      const fromAggregates = compareMonths(sampleAggregates, '2026-07', '2026-08');
      const fromRaw = compareMonths(sampleRawEntries, '2026-07', '2026-08');

      expect(fromAggregates.summary).toEqual(fromRaw.summary);
      expect(fromAggregates.chartData).toEqual(fromRaw.chartData);
      expect(fromAggregates.categories).toEqual(fromRaw.categories);
    });
  });
});
