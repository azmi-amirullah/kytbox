import { describe, it, expect } from 'vitest';
import { calculateBudgetStatus } from '@/features/cashflow/math';
import type { CashflowBudgetDTO, CashflowEntryDTO } from '@/types/dto';

describe('Cashflow Budget Rollover Engine', () => {
  const baseBudget: CashflowBudgetDTO = {
    id: 'budget-groceries',
    cashflow_id: 'cf-1',
    category: 'Groceries',
    amount: 500,
    period: 'monthly',
    enable_rollover: true,
  };

  const now = new Date('2026-09-15T12:00:00Z'); // Current month = September 2026

  it('calculates surplus rollover and expands effective limit in current month', () => {
    // Previous month = August 2026. Spent 400 out of 500 -> Surplus = +100
    // Current month = September 2026. Spent 250 out of (500 + 100 = 600)
    const entries: CashflowEntryDTO[] = [
      {
        id: 'e-aug',
        cashflow_id: 'cf-1',
        goal_id: null,
        description: 'August Groceries',
        amount: 400,
        type: 'expense',
        category: 'Groceries',
        date: '2026-08-10',
        is_recurring: false,
        tags: [],
        created_at: null,
        recurrence_interval: null,
        yearly_calculation: null,
      },
      {
        id: 'e-sep',
        cashflow_id: 'cf-1',
        goal_id: null,
        description: 'September Groceries',
        amount: 250,
        type: 'expense',
        category: 'Groceries',
        date: '2026-09-05',
        is_recurring: false,
        tags: [],
        created_at: null,
        recurrence_interval: null,
        yearly_calculation: null,
      },
    ];

    const status = calculateBudgetStatus(baseBudget, entries, now);

    expect(status.hasRollover).toBe(true);
    expect(status.rolloverSurplus).toBe(100); // 500 - 400
    expect(status.effectiveLimit).toBe(600); // 500 + 100
    expect(status.spent).toBe(250);
    expect(status.availableSpend).toBe(350); // 600 - 250
    expect(status.pct).toBeCloseTo((250 / 600) * 100, 1);
    expect(status.isOverBudget).toBe(false);
  });

  it('calculates deficit rollover and tightens effective limit in current month', () => {
    // Previous month = August 2026. Spent 550 out of 500 -> Deficit = -50
    // Current month = September 2026. Effective limit = 500 - 50 = 450
    const entries: CashflowEntryDTO[] = [
      {
        id: 'e-aug',
        cashflow_id: 'cf-1',
        goal_id: null,
        description: 'August Groceries Overspent',
        amount: 550,
        type: 'expense',
        category: 'Groceries',
        date: '2026-08-10',
        is_recurring: false,
        tags: [],
        created_at: null,
        recurrence_interval: null,
        yearly_calculation: null,
      },
      {
        id: 'e-sep',
        cashflow_id: 'cf-1',
        goal_id: null,
        description: 'September Groceries',
        amount: 400,
        type: 'expense',
        category: 'Groceries',
        date: '2026-09-05',
        is_recurring: false,
        tags: [],
        created_at: null,
        recurrence_interval: null,
        yearly_calculation: null,
      },
    ];

    const status = calculateBudgetStatus(baseBudget, entries, now);

    expect(status.hasRollover).toBe(true);
    expect(status.rolloverSurplus).toBe(-50);
    expect(status.effectiveLimit).toBe(450); // 500 - 50
    expect(status.spent).toBe(400);
    expect(status.availableSpend).toBe(50); // 450 - 400
    expect(status.isOverBudget).toBe(false);
  });

  it('does not apply rollover when enable_rollover is false', () => {
    const nonRolloverBudget: CashflowBudgetDTO = {
      ...baseBudget,
      enable_rollover: false,
    };

    const entries: CashflowEntryDTO[] = [
      {
        id: 'e-aug',
        cashflow_id: 'cf-1',
        goal_id: null,
        description: 'August Groceries',
        amount: 400,
        type: 'expense',
        category: 'Groceries',
        date: '2026-08-10',
        is_recurring: false,
        tags: [],
        created_at: null,
        recurrence_interval: null,
        yearly_calculation: null,
      },
      {
        id: 'e-sep',
        cashflow_id: 'cf-1',
        goal_id: null,
        description: 'September Groceries',
        amount: 250,
        type: 'expense',
        category: 'Groceries',
        date: '2026-09-05',
        is_recurring: false,
        tags: [],
        created_at: null,
        recurrence_interval: null,
        yearly_calculation: null,
      },
    ];

    const status = calculateBudgetStatus(nonRolloverBudget, entries, now);

    expect(status.hasRollover).toBe(false);
    expect(status.rolloverSurplus).toBe(0);
    expect(status.effectiveLimit).toBe(500);
    expect(status.spent).toBe(250);
    expect(status.availableSpend).toBe(250);
    expect(status.pct).toBe(50);
  });

  it('avoids phantom rollover when user has zero history in previous month (cold-start guard)', () => {
    // Brand new user in September 2026: zero entries in August
    const entries: CashflowEntryDTO[] = [
      {
        id: 'e-sep',
        cashflow_id: 'cf-1',
        goal_id: null,
        description: 'September Groceries',
        amount: 200,
        type: 'expense',
        category: 'Groceries',
        date: '2026-09-05',
        is_recurring: false,
        tags: [],
        created_at: null,
        recurrence_interval: null,
        yearly_calculation: null,
      },
    ];

    const status = calculateBudgetStatus(baseBudget, entries, now);

    // Because August had no history, rolloverSurplus must be 0 (NOT phantom +$500)
    expect(status.hasRollover).toBe(true);
    expect(status.rolloverSurplus).toBe(0);
    expect(status.effectiveLimit).toBe(500);
    expect(status.spent).toBe(200);
    expect(status.availableSpend).toBe(300);
    expect(status.isOverBudget).toBe(false);
  });
});
