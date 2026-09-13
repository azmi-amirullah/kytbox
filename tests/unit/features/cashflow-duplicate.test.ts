import { shiftToCurrentMonth } from '@/features/cashflow/math';

describe('shiftToCurrentMonth', () => {
  it('shifts year and month to target Date while keeping day of month', () => {
    const fixedDate = new Date(Date.UTC(2026, 7, 15)); // August 15, 2026
    expect(shiftToCurrentMonth('2025-01-10', fixedDate)).toBe('2026-08-10');
  });

  it('clamps day of month if target month has fewer days (e.g. Feb 30 -> Feb 28)', () => {
    const febDate = new Date(Date.UTC(2026, 1, 10)); // February 2026
    expect(shiftToCurrentMonth('2026-01-31', febDate)).toBe('2026-02-28');
  });

  it('handles leap year in February correctly', () => {
    const leapFeb = new Date(Date.UTC(2028, 1, 10)); // February 2028 (leap year)
    expect(shiftToCurrentMonth('2026-01-31', leapFeb)).toBe('2028-02-29');
  });

  it('returns current date string for invalid date formats', () => {
    const fixedDate = new Date(Date.UTC(2026, 7, 15));
    expect(shiftToCurrentMonth('invalid-date', fixedDate)).toBe('2026-08-15');
  });
});

describe('cashflow entry duplication mapping', () => {
  it('preserves target category when goalId is successfully mapped', () => {
    const goalIdMap = new Map([['old-debt-id', 'new-debt-id']]);
    const originalEntry = {
      goal_id: 'old-debt-id',
      category: 'Debt: Car Loan',
    };

    const targetGoalId = originalEntry.goal_id
      ? goalIdMap.get(originalEntry.goal_id) || null
      : null;
    const targetCategory =
      !targetGoalId &&
      (originalEntry.category?.startsWith('Goal:') ||
        originalEntry.category?.startsWith('Debt:'))
        ? null
        : originalEntry.category;

    expect(targetGoalId).toBe('new-debt-id');
    expect(targetCategory).toBe('Debt: Car Loan');
  });

  it('nullifies category when goal was archived or unmapped to avoid trigger exception', () => {
    const goalIdMap = new Map<string, string>(); // empty map (e.g. archived goal wasn't duplicated)
    const originalGoalEntry = {
      goal_id: 'archived-goal-id',
      category: 'Goal: Old Vacation',
    };
    const originalDebtEntry = {
      goal_id: 'archived-debt-id',
      category: 'Debt: Old Loan',
    };

    for (const entry of [originalGoalEntry, originalDebtEntry]) {
      const targetGoalId = entry.goal_id
        ? goalIdMap.get(entry.goal_id) || null
        : null;
      const targetCategory =
        !targetGoalId &&
        (entry.category?.startsWith('Goal:') ||
          entry.category?.startsWith('Debt:'))
          ? null
          : entry.category;

      expect(targetGoalId).toBeNull();
      expect(targetCategory).toBeNull();
    }
  });
});
