import { describe, it, expect } from 'vitest';
import {
  cashflowEntrySchema,
  cashflowBudgetSchema,
  generateRecurringSchema,
  getGoalEntryValidationError,
  shouldPreserveExistingGoalRelation,
} from '@/features/cashflow/schemas.server';
import { mapGoalToDTO } from '@/lib/mappers';

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

    it('accepts an internal goal relation without exposing it as a category', () => {
      const result = cashflowEntrySchema.safeParse({
        goalId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        description: 'Vacation deposit',
        amount: '250',
        type: 'expense',
        category: 'Goal: Vacation',
        date: '2026-07-22',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.goalId).toBe(
          'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        );
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

    it('rejects impossible calendar dates', () => {
      const result = cashflowEntrySchema.safeParse({
        description: 'Dinner',
        amount: 45,
        type: 'expense',
        date: '2026-02-30',
      });

      expect(result.success).toBe(false);
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

  describe('goal entry categories', () => {
    it('accepts a named goal expense category', () => {
      expect(
        getGoalEntryValidationError('expense', 'Goal: Vacation'),
      ).toBeNull();
    });

    it('rejects income and unnamed goal categories', () => {
      expect(
        getGoalEntryValidationError('income', 'Goal: Vacation'),
      ).toBe('Savings goal entries must be expenses');
      expect(getGoalEntryValidationError('expense', 'Goal: ')).toBe(
        'A savings goal must have a name',
      );
    });
  });

  describe('archived goal edits', () => {
    it('preserves an existing goal relation when saving entry details unchanged', () => {
      expect(
        shouldPreserveExistingGoalRelation({
          existingGoalId: 'goal-id',
          requestedGoalId: 'goal-id',
          category: null,
          type: 'expense',
        }),
      ).toBe(true);
    });

    it('requires an explicit category change to detach a goal relation', () => {
      expect(
        shouldPreserveExistingGoalRelation({
          existingGoalId: 'goal-id',
          requestedGoalId: 'goal-id',
          category: 'other',
          type: 'expense',
        }),
      ).toBe(false);
      expect(
        shouldPreserveExistingGoalRelation({
          existingGoalId: 'goal-id',
          requestedGoalId: 'goal-id',
          category: null,
          type: 'income',
        }),
      ).toBe(false);
    });
  });

  describe('goal DTOs', () => {
    it('includes the source cashflow name for UI disambiguation', () => {
      const goal = mapGoalToDTO(
        {
          id: 'goal-id',
          cashflow_id: 'cashflow-id',
          title: 'Emergency Fund',
          target_amount: 5000,
          deadline: null,
          is_deleted: false,
          created_at: '2026-07-27T00:00:00.000Z',
        },
        'Personal Budget',
      );

      expect(goal.cashflow_title).toBe('Personal Budget');
      expect(goal.saved_amount).toBe(0);
      expect(goal.contribution_count).toBe(0);
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
