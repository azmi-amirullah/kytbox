import { describe, it, expect } from 'vitest';
import {
  cashflowEntrySchema,
  cashflowBudgetSchema,
  cashflowGoalSchema,
  generateRecurringSchema,
  getGoalEntryValidationError,
  shouldPreserveExistingGoalRelation,
} from '@/features/cashflow/schemas.server';
import { mapGoalToDTO, mapCashflowEntryToDTO, mapCashflowRecurringRuleToDTO } from '@/lib/mappers';

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

  describe('cashflowGoalSchema', () => {
    it('validates a savings goal and defaults type to savings', () => {
      const result = cashflowGoalSchema.safeParse({
        cashflowId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        title: 'Emergency Fund',
        targetAmount: 5000,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('savings');
        expect(result.data.targetAmount).toBe(5000);
      }
    });

    it('validates a debt paydown target with initialAmount', () => {
      const result = cashflowGoalSchema.safeParse({
        cashflowId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        title: 'Car Loan',
        targetAmount: 12000,
        initialAmount: 2000,
        type: 'debt',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('debt');
        expect(result.data.initialAmount).toBe(2000);
      }
    });

    it('rejects negative initialAmount', () => {
      const result = cashflowGoalSchema.safeParse({
        cashflowId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        title: 'Car Loan',
        targetAmount: 12000,
        initialAmount: -500,
        type: 'debt',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid target type', () => {
      const result = cashflowGoalSchema.safeParse({
        cashflowId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        title: 'Crypto Moon',
        targetAmount: 1000,
        type: 'investment',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('goal and debt entry categories', () => {
    it('accepts a named goal expense category', () => {
      expect(
        getGoalEntryValidationError('expense', 'Goal: Vacation'),
      ).toBeNull();
    });

    it('accepts a named debt expense category', () => {
      expect(
        getGoalEntryValidationError('expense', 'Debt: Car Loan'),
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

    it('rejects income and unnamed debt categories', () => {
      expect(
        getGoalEntryValidationError('income', 'Debt: Car Loan'),
      ).toBe('Debt payments must be expenses');
      expect(getGoalEntryValidationError('expense', 'Debt: ')).toBe(
        'A debt target must have a name',
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
          type: 'savings',
          initial_amount: 0,
        },
        'Personal Budget',
      );

      expect(goal.cashflow_title).toBe('Personal Budget');
      expect(goal.saved_amount).toBe(0);
      expect(goal.initial_amount).toBe(0);
      expect(goal.contribution_count).toBe(0);
      expect(goal.is_archived).toBe(false);
      expect(goal.type).toBe('savings');
    });

    it('maps type debt and initial_amount correctly in DTO', () => {
      const debtGoal = mapGoalToDTO(
        {
          id: 'goal-id-debt',
          cashflow_id: 'cashflow-id',
          title: 'Credit Card',
          target_amount: 3000,
          initial_amount: 500,
          deadline: null,
          is_deleted: false,
          created_at: '2026-09-01T00:00:00.000Z',
          type: 'debt',
        },
        'Personal Budget',
        1000,
        2,
      );

      expect(debtGoal.type).toBe('debt');
      expect(debtGoal.target_amount).toBe(3000);
      expect(debtGoal.initial_amount).toBe(500);
      expect(debtGoal.saved_amount).toBe(1000);
      expect(debtGoal.target_amount - debtGoal.saved_amount).toBe(2000);
    });

    it('defaults saved_amount to initial_amount when no savedAmount is passed', () => {
      const debtGoal = mapGoalToDTO({
        id: 'goal-id-debt-2',
        cashflow_id: 'cashflow-id',
        title: 'Mortgage',
        target_amount: 500000000,
        initial_amount: 250000000,
        deadline: null,
        is_deleted: false,
        created_at: '2026-09-01T00:00:00.000Z',
        type: 'debt',
      });

      expect(debtGoal.initial_amount).toBe(250000000);
      expect(debtGoal.saved_amount).toBe(250000000);
      expect(debtGoal.target_amount - debtGoal.saved_amount).toBe(250000000);
    });

    it('maps is_deleted to is_archived correctly', () => {
      const archivedGoal = mapGoalToDTO({
        id: 'goal-id-2',
        cashflow_id: 'cashflow-id',
        title: 'Old Vacation Goal',
        target_amount: 2000,
        deadline: null,
        is_deleted: true,
        created_at: '2026-01-01T00:00:00.000Z',
        type: 'savings',
        initial_amount: 0,
      });

      expect(archivedGoal.is_archived).toBe(true);
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

  describe('entry and recurring rule DTO category mapping', () => {
    it('maps debt entry category to Debt: {title}', () => {
      const entry = mapCashflowEntryToDTO(
        {
          id: 'entry-1',
          cashflow_id: 'cashflow-1',
          goal_id: 'debt-1',
          description: 'Payment for car',
          amount: 500,
          type: 'expense',
          date: '2026-09-13',
          created_at: '2026-09-13T08:00:00Z',
        },
        'Car Loan',
        'debt',
      );
      expect(entry.category).toBe('Debt: Car Loan');
    });

    it('maps savings goal entry category to Goal: {title}', () => {
      const entry = mapCashflowEntryToDTO(
        {
          id: 'entry-2',
          cashflow_id: 'cashflow-1',
          goal_id: 'goal-1',
          description: 'Holiday savings',
          amount: 200,
          type: 'expense',
          date: '2026-09-13',
          created_at: '2026-09-13T08:00:00Z',
        },
        'Vacation',
        'savings',
      );
      expect(entry.category).toBe('Goal: Vacation');
    });

    it('sanitizes unlinked entries with orphaned Goal: or Debt: categories', () => {
      const entryGoal = mapCashflowEntryToDTO({
        id: 'entry-3',
        cashflow_id: 'cashflow-1',
        description: 'Orphan goal',
        amount: 100,
        type: 'expense',
        category: 'Goal: Ghost',
        date: '2026-09-13',
        created_at: '2026-09-13T08:00:00Z',
      });
      expect(entryGoal.category).toBeNull();

      const entryDebt = mapCashflowEntryToDTO({
        id: 'entry-4',
        cashflow_id: 'cashflow-1',
        description: 'Orphan debt',
        amount: 100,
        type: 'expense',
        category: 'Debt: Ghost',
        date: '2026-09-13',
        created_at: '2026-09-13T08:00:00Z',
      });
      expect(entryDebt.category).toBeNull();
    });

    it('maps recurring rule with debt target to Debt: {title}', () => {
      const rule = mapCashflowRecurringRuleToDTO(
        {
          id: 'rule-1',
          cashflow_id: 'cashflow-1',
          goal_id: 'debt-1',
          description: 'Monthly car payment',
          amount: 450,
          type: 'expense',
          start_date: '2026-09-01',
          recurrence_interval: 'monthly',
        },
        'Car Loan',
        'debt',
      );
      expect(rule.category).toBe('Debt: Car Loan');
    });
  });

  describe('import entries category sanitization logic', () => {
    it('sanitizes unlinked Goal: or Debt: category to plain title to prevent database trigger violation', () => {
      const activeGoals = new Map<string, { id: string; type: 'savings' | 'debt'; title: string }>([
        ['emergency fund', { id: 'goal-1', type: 'savings', title: 'Emergency Fund' }],
      ]);

      const sanitize = (rawCat: string, type: 'income' | 'expense') => {
        let goalId: string | null = null;
        let finalCategory: string | null = rawCat;

        const isGoal = rawCat.startsWith('Goal:');
        const isDebt = rawCat.startsWith('Debt:');
        if (isGoal || isDebt) {
          const prefix = isGoal ? 'Goal:' : 'Debt:';
          const targetTitle = rawCat.slice(prefix.length).trim();
          const matched = activeGoals.get(targetTitle.toLowerCase());
          if (matched && type === 'expense') {
            goalId = matched.id;
            finalCategory = `${matched.type === 'debt' ? 'Debt:' : 'Goal:'} ${matched.title}`;
          } else {
            finalCategory = targetTitle || null;
          }
        }
        return { goalId, finalCategory };
      };

      // Matched expense links to goal
      expect(sanitize('Goal: Emergency Fund', 'expense')).toEqual({
        goalId: 'goal-1',
        finalCategory: 'Goal: Emergency Fund',
      });

      // Unmatched debt target strips prefix to plain title so trigger does not abort
      expect(sanitize('Debt: Credit Card', 'expense')).toEqual({
        goalId: null,
        finalCategory: 'Credit Card',
      });

      // Income cannot contribute to goal: strips prefix
      expect(sanitize('Goal: Emergency Fund', 'income')).toEqual({
        goalId: null,
        finalCategory: 'Emergency Fund',
      });

      // Empty target title becomes null
      expect(sanitize('Debt: ', 'expense')).toEqual({
        goalId: null,
        finalCategory: null,
      });
    });
  });
});

