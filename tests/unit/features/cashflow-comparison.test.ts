import {
  calculateDeltaPercentage,
  formatMonthLabel,
  getAvailableMonths,
  compareMonths,
} from '@/features/cashflow/math';
import type { CashflowEntryDTO } from '@/types/dto';

const createEntry = (overrides: Partial<CashflowEntryDTO>): CashflowEntryDTO => ({
  id: 'test-id',
  cashflow_id: 'cf-1',
  goal_id: null,
  description: 'Test Entry',
  amount: 100,
  type: 'expense',
  category: 'food',
  date: '2026-07-15',
  created_at: '2026-07-15T00:00:00Z',
  is_recurring: false,
  recurrence_interval: null,
  yearly_calculation: null,
  ...overrides,
});

describe('calculateDeltaPercentage', () => {
  it('calculates standard positive increase', () => {
    expect(calculateDeltaPercentage(100, 150)).toBe(50);
  });

  it('calculates standard decrease', () => {
    expect(calculateDeltaPercentage(200, 150)).toBe(-25);
  });

  it('handles zero base to positive value', () => {
    expect(calculateDeltaPercentage(0, 500)).toBe(100);
  });

  it('handles zero to zero', () => {
    expect(calculateDeltaPercentage(0, 0)).toBe(0);
  });

  it('handles positive base to zero value', () => {
    expect(calculateDeltaPercentage(500, 0)).toBe(-100);
  });

  it('handles zero base to negative value', () => {
    expect(calculateDeltaPercentage(0, -100)).toBe(-100);
  });

  it('rounds floating point percentage changes cleanly', () => {
    // 300 to 400: (100 / 300) * 100 = 33.333333333333336 -> 33.33
    expect(calculateDeltaPercentage(300, 400)).toBe(33.33);
  });
});

describe('formatMonthLabel', () => {
  it('formats valid YYYY-MM string to month and year', () => {
    expect(formatMonthLabel('2026-07')).toBe('Jul 2026');
    expect(formatMonthLabel('2025-12')).toBe('Dec 2025');
  });

  it('returns fallback for invalid string', () => {
    expect(formatMonthLabel('')).toBe('Unknown');
    expect(formatMonthLabel('invalid-date')).toBe('invalid-date');
  });
});

describe('getAvailableMonths', () => {
  it('extracts unique months sorted chronologically descending', () => {
    const entries = [
      createEntry({ date: '2026-05-10' }),
      createEntry({ date: '2026-08-01' }),
      createEntry({ date: '2026-08-15' }),
      createEntry({ date: '2026-07-20' }),
      createEntry({ date: 'not-a-valid-date' }),
    ];

    const months = getAvailableMonths(entries);
    expect(months).toHaveLength(3);
    expect(months[0]).toEqual({ key: '2026-08', label: 'Aug 2026', count: 2 });
    expect(months[1]).toEqual({ key: '2026-07', label: 'Jul 2026', count: 1 });
    expect(months[2]).toEqual({ key: '2026-05', label: 'May 2026', count: 1 });
  });

  it('returns empty array when entries list is empty', () => {
    expect(getAvailableMonths([])).toEqual([]);
  });
});

describe('compareMonths', () => {
  const sampleEntries: CashflowEntryDTO[] = [
    // Month A: July 2026 (Income: 4000, Expense: 2500)
    createEntry({ id: 'e1', amount: 4000, type: 'income', category: 'salary', date: '2026-07-01' }),
    createEntry({ id: 'e2', amount: 1200, type: 'expense', category: 'rent', date: '2026-07-05' }),
    createEntry({ id: 'e3', amount: 800, type: 'expense', category: 'food', date: '2026-07-12' }),
    createEntry({ id: 'e4', amount: 500, type: 'expense', category: 'travel', date: '2026-07-20' }),

    // Month B: August 2026 (Income: 4600, Expense: 2300)
    createEntry({ id: 'e5', amount: 4000, type: 'income', category: 'salary', date: '2026-08-01' }),
    createEntry({ id: 'e6', amount: 600, type: 'income', category: 'freelance', date: '2026-08-10' }),
    createEntry({ id: 'e7', amount: 1200, type: 'expense', category: 'rent', date: '2026-08-05' }),
    createEntry({ id: 'e8', amount: 900, type: 'expense', category: 'food', date: '2026-08-14' }),
    createEntry({ id: 'e9', amount: 200, type: 'expense', category: 'entertainment', date: '2026-08-22' }),
  ];

  it('calculates summary income, expense, and net deltas correctly', () => {
    const result = compareMonths(sampleEntries, '2026-07', '2026-08');

    // Month A
    expect(result.summary.monthA.income).toBe(4000);
    expect(result.summary.monthA.expense).toBe(2500);
    expect(result.summary.monthA.net).toBe(1500);
    expect(result.summary.monthA.savingsRate).toBe(37.5); // (1500 / 4000) * 100

    // Month B
    expect(result.summary.monthB.income).toBe(4600);
    expect(result.summary.monthB.expense).toBe(2300);
    expect(result.summary.monthB.net).toBe(2300);
    expect(result.summary.monthB.savingsRate).toBe(50); // (2300 / 4600) * 100

    // Deltas
    expect(result.summary.deltas.income).toBe(600); // 4600 - 4000
    expect(result.summary.deltas.incomePct).toBe(15); // +15%
    expect(result.summary.deltas.expense).toBe(-200); // 2300 - 2500
    expect(result.summary.deltas.expensePct).toBe(-8); // -8%
    expect(result.summary.deltas.net).toBe(800); // 2300 - 1500
    expect(result.summary.deltas.netPct).toBe(53.33); // (800 / 1500) * 100
    expect(result.summary.deltas.savingsRate).toBe(12.5); // 50 - 37.5
  });

  it('identifies category trends accurately (increased, decreased, new, removed, unchanged)', () => {
    const result = compareMonths(sampleEntries, '2026-07', '2026-08');

    const foodDiff = result.categories.find(c => c.category === 'food');
    expect(foodDiff).toBeDefined();
    expect(foodDiff?.amountA).toBe(800);
    expect(foodDiff?.amountB).toBe(900);
    expect(foodDiff?.diff).toBe(100);
    expect(foodDiff?.diffPct).toBe(12.5);
    expect(foodDiff?.trend).toBe('increased');

    const rentDiff = result.categories.find(c => c.category === 'rent');
    expect(rentDiff).toBeDefined();
    expect(rentDiff?.amountA).toBe(1200);
    expect(rentDiff?.amountB).toBe(1200);
    expect(rentDiff?.diff).toBe(0);
    expect(rentDiff?.trend).toBe('unchanged');

    const travelDiff = result.categories.find(c => c.category === 'travel');
    expect(travelDiff).toBeDefined();
    expect(travelDiff?.amountA).toBe(500);
    expect(travelDiff?.amountB).toBe(0);
    expect(travelDiff?.diff).toBe(-500);
    expect(travelDiff?.trend).toBe('removed');

    const entertainmentDiff = result.categories.find(c => c.category === 'entertainment');
    expect(entertainmentDiff).toBeDefined();
    expect(entertainmentDiff?.amountA).toBe(0);
    expect(entertainmentDiff?.amountB).toBe(200);
    expect(entertainmentDiff?.diff).toBe(200);
    expect(entertainmentDiff?.trend).toBe('new');

    const freelanceDiff = result.categories.find(c => c.category === 'freelance');
    expect(freelanceDiff).toBeDefined();
    expect(freelanceDiff?.type).toBe('income');
    expect(freelanceDiff?.amountA).toBe(0);
    expect(freelanceDiff?.amountB).toBe(600);
    expect(freelanceDiff?.trend).toBe('new');
  });

  it('formats chart data metrics correctly', () => {
    const result = compareMonths(sampleEntries, '2026-07', '2026-08');
    expect(result.chartData).toEqual([
      { metric: 'Income', monthAAmount: 4000, monthBAmount: 4600 },
      { metric: 'Expense', monthAAmount: 2500, monthBAmount: 2300 },
      { metric: 'Net Savings', monthAAmount: 1500, monthBAmount: 2300 },
    ]);
  });

  it('handles months with zero transactions gracefully', () => {
    const result = compareMonths([], '2026-01', '2026-02');
    expect(result.summary.monthA.income).toBe(0);
    expect(result.summary.monthA.expense).toBe(0);
    expect(result.summary.monthB.income).toBe(0);
    expect(result.summary.monthB.expense).toBe(0);
    expect(result.summary.deltas.income).toBe(0);
    expect(result.summary.deltas.incomePct).toBe(0);
    expect(result.categories).toHaveLength(0);
  });
});
