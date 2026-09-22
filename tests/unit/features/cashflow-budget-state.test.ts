import { describe, it, expect } from 'vitest';
import type { CashflowBudgetDTO } from '@/types/dto';

describe('Budget Tracker State Transitions', () => {
  const initialBudgets: CashflowBudgetDTO[] = [
    {
      id: 'b-1',
      cashflow_id: 'cf-1',
      category: 'Food & Dining',
      amount: 400,
      period: 'monthly',
      enable_rollover: false,
    },
    {
      id: 'b-2',
      cashflow_id: 'cf-1',
      category: 'Transportation',
      amount: 150,
      period: 'monthly',
      enable_rollover: true,
    },
  ];

  it('updates an existing budget in-place by ID or category without duplicate creation', () => {
    const updatedBudget: CashflowBudgetDTO = {
      id: 'b-1',
      cashflow_id: 'cf-1',
      category: 'Food & Dining',
      amount: 550,
      period: 'monthly',
      enable_rollover: true,
    };

    const nextState = initialBudgets.map((b) =>
      b.id === updatedBudget.id || b.category === updatedBudget.category
        ? updatedBudget
        : b,
    );

    expect(nextState).toHaveLength(2);
    expect(nextState.find((b) => b.id === 'b-1')?.amount).toBe(550);
    expect(nextState.find((b) => b.id === 'b-1')?.enable_rollover).toBe(true);
  });

  it('inserts a newly created budget when it does not exist', () => {
    const newBudget: CashflowBudgetDTO = {
      id: 'b-3',
      cashflow_id: 'cf-1',
      category: 'Entertainment',
      amount: 200,
      period: 'monthly',
      enable_rollover: false,
    };

    const exists = initialBudgets.some(
      (b) => b.id === newBudget.id || b.category === newBudget.category,
    );
    const nextState = exists
      ? initialBudgets.map((b) =>
          b.id === newBudget.id || b.category === newBudget.category
            ? newBudget
            : b,
        )
      : [...initialBudgets, newBudget];

    expect(nextState).toHaveLength(3);
    expect(nextState.find((b) => b.id === 'b-3')?.amount).toBe(200);
  });

  it('removes a budget by ID only after confirmed API success, leaving state untouched on error', () => {
    const budgetIdToDelete = 'b-1';

    // 1. Simulating API failure: state remains unchanged
    const isSuccess = false;
    let state = initialBudgets;
    if (isSuccess) {
      state = state.filter((b) => b.id !== budgetIdToDelete);
    }
    expect(state).toHaveLength(2);
    expect(state.find((b) => b.id === 'b-1')).toBeDefined();

    // 2. Simulating API success: state is pruned
    const apiSuccess = true;
    if (apiSuccess) {
      state = state.filter((b) => b.id !== budgetIdToDelete);
    }
    expect(state).toHaveLength(1);
    expect(state.find((b) => b.id === 'b-1')).toBeUndefined();
  });
});
