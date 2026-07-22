import { describe, it, expect } from 'vitest';
import {
  cashflowEntrySchema,
  cashflowBudgetSchema,
  generateRecurringSchema,
} from '@/features/cashflow/schemas.server';

describe('Cashflow Server Schemas', () => {
  describe('cashflowEntrySchema', () => {
    it('validates a correct income entry', () => {
      const result = cashflowEntrySchema.safeParse({
        description: 'Monthly Salary',
        amount: '3500.50',
        type: 'income',
        category: 'Salary',
        date: '2026-07-22',
        is_recurring: 'true',
        recurrence_interval: 'monthly',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(3500.5);
        expect(result.data.is_recurring).toBe(true);
        expect(result.data.type).toBe('income');
      }
    });

    it('rejects zero or negative amounts', () => {
      const zeroResult = cashflowEntrySchema.safeParse({
        description: 'Free Coffee',
        amount: 0,
        type: 'expense',
        date: '2026-07-22',
      });
      expect(zeroResult.success).toBe(false);

      const negResult = cashflowEntrySchema.safeParse({
        description: 'Negative Expense',
        amount: -50,
        type: 'expense',
        date: '2026-07-22',
      });
      expect(negResult.success).toBe(false);
    });

    it('rejects invalid date formats', () => {
      const result = cashflowEntrySchema.safeParse({
        description: 'Dinner',
        amount: 45,
        type: 'expense',
        date: '07-22-2026', // non YYYY-MM-DD
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid date format');
      }
    });
  });

  describe('cashflowBudgetSchema', () => {
    it('validates a valid budget payload', () => {
      const result = cashflowBudgetSchema.safeParse({
        cashflowId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        category: 'Groceries',
        amount: '500',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(500);
      }
    });

    it('rejects non-UUID cashflowId', () => {
      const result = cashflowBudgetSchema.safeParse({
        cashflowId: 'invalid-id',
        category: 'Groceries',
        amount: 500,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('generateRecurringSchema', () => {
    it('validates bounds for target year and month', () => {
      const valid = generateRecurringSchema.safeParse({
        cashflowId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        targetYear: 2026,
        targetMonth: 6, // July (0-indexed)
      });
      expect(valid.success).toBe(true);

      const invalidMonth = generateRecurringSchema.safeParse({
        cashflowId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        targetMonth: 12, // max is 11
      });
      expect(invalidMonth.success).toBe(false);
    });
  });
});
