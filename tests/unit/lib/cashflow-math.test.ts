import { 
  calculateProjections, 
  calculateBudgetStatus,
  resolveFilterRange,
  filterEntriesByDate
} from '@/lib/cashflow-math';
import type { CashflowEntryDTO, CashflowBudgetDTO } from '@/types/dto';

// Fix "Today" to March 15, 2026 for all tests to ensure deterministic results
const TODAY = new Date('2026-03-15T12:00:00Z');

const createEntry = (overrides: Partial<CashflowEntryDTO>): CashflowEntryDTO => ({
  id: 'test-id',
  cashflow_id: 'cf-1',
  description: 'Test Entry',
  amount: 100,
  type: 'expense',
  category: 'other',
  date: '2026-03-01',
  created_at: '2026-03-01T00:00:00Z',
  is_recurring: false,
  recurrence_interval: null,
  yearly_calculation: null,
  ...overrides,
});

describe('calculateProjections', () => {
  it('calculates settled cash from past and today transactions', () => {
    const entries = [
      createEntry({ amount: 1000, type: 'income', date: '2026-03-01' }), // Past
      createEntry({ amount: 200, type: 'expense', date: '2026-03-10' }),  // Past
      createEntry({ amount: 50, type: 'expense', date: '2026-03-15' }),   // Today
      createEntry({ amount: 500, type: 'income', date: '2026-04-01' }),  // Future (not settled)
    ];

    const result = calculateProjections(entries, TODAY);
    expect(result.settledCash).toBe(1000 - 200 - 50); // 750
  });

  it('projects monthly recurring expenses that have not occurred yet this month', () => {
    const entries = [
      createEntry({ 
        amount: 50, 
        type: 'expense', 
        date: '2026-01-20', // Due on 20th of every month
        is_recurring: true, 
        recurrence_interval: 'monthly' 
      }),
    ];

    const result = calculateProjections(entries, TODAY);
    // Not yet paid in March (today is 15th, due 20th)
    // Plus due in April (window ends April 30th)
    // Total multiplier = 2
    expect(result.upcomingMonthlyExpenses).toBe(100);
    expect(result.recurringItems[0].multiplierUnits).toBe(2);
  });

  it('projects monthly recurring expenses that HAVE occurred already this month', () => {
    const entries = [
      createEntry({ 
        amount: 50, 
        type: 'expense', 
        date: '2026-01-10', // Due on 10th
        is_recurring: true, 
        recurrence_interval: 'monthly' 
      }),
    ];

    const result = calculateProjections(entries, TODAY);
    // Already paid in March (today is 15th, due 10th)
    // Only due in April remains
    // Total multiplier = 1
    expect(result.upcomingMonthlyExpenses).toBe(50);
    expect(result.recurringItems[0].multiplierUnits).toBe(1);
  });

  it('projects yearly prorated items (Accrual Logic)', () => {
    const entries = [
      createEntry({ 
        amount: 1200, // $100/mo
        type: 'expense', 
        date: '2026-01-01', 
        is_recurring: true, 
        recurrence_interval: 'yearly',
        yearly_calculation: 'prorated'
      }),
    ];

    const result = calculateProjections(entries, TODAY);
    
    // Cycle starts Jan 1, 2026.
    // End of projection window: April 30, 2026.
    // Months: Jan, Feb, March, April = 4 months.
    // Multiplier = 4/12 = 0.333...
    // Expected projection = 1200 * (4/12) = 400
    expect(result.upcomingMonthlyExpenses).toBe(400);
    expect(result.recurringItems[0].monthlyEquivalent).toBe(100);
  });

  it('projects yearly EXACT items only if they fall in the window', () => {
    const entries = [
      createEntry({ 
        description: 'Due in April',
        amount: 1000, 
        type: 'expense', 
        date: '2025-04-15', // Anniversary April 15
        is_recurring: true, 
        recurrence_interval: 'yearly',
        yearly_calculation: 'exact'
      }),
      createEntry({ 
        description: 'Due in June',
        amount: 500, 
        type: 'expense', 
        date: '2025-06-01', // Anniversary June 1
        is_recurring: true, 
        recurrence_interval: 'yearly',
        yearly_calculation: 'exact'
      }),
    ];

    const result = calculateProjections(entries, TODAY);
    
    // April 15 is in window (ends April 30).
    // June 1 is NOT in window.
    expect(result.upcomingMonthlyExpenses).toBe(1000);
    expect(result.recurringItems).toHaveLength(2);
    expect(result.recurringItems.find(i => i.description === 'Due in April')?.projectedAmount).toBe(1000);
    expect(result.recurringItems.find(i => i.description === 'Due in June')?.projectedAmount).toBe(0);
  });

  it('includes one-time future items within the window', () => {
    const entries = [
      createEntry({ amount: 100, type: 'expense', date: '2026-03-20' }), // Future in window
      createEntry({ amount: 200, type: 'expense', date: '2026-05-01' }), // Future out of window
    ];

    const result = calculateProjections(entries, TODAY);
    expect(result.upcomingMonthlyExpenses).toBe(100);
  });

  it('calculates the final projected result correctly', () => {
    const entries = [
      createEntry({ amount: 2000, type: 'income', date: '2026-03-01' }), // Settled
      createEntry({ amount: 100, type: 'expense', date: '2026-03-20', is_recurring: true, recurrence_interval: 'monthly' }), // Projected (x2 = 200)
    ];

    const result = calculateProjections(entries, TODAY);
    // Settled: 2000
    // Upcoming: -200
    // Result: 1800
    expect(result.projectedResult).toBe(1800);
  });
});

describe('calculateBudgetStatus', () => {
  const budget: CashflowBudgetDTO = {
    id: 'b-1',
    cashflow_id: 'cf-1',
    category: 'food',
    amount: 500,
    period: 'monthly'
  };

  it('calculates correct spent amount for the current month', () => {
    const entries = [
      createEntry({ amount: 100, category: 'food', date: '2026-03-05', type: 'expense' }),
      createEntry({ amount: 50, category: 'food', date: '2026-03-10', type: 'expense' }),
      createEntry({ amount: 500, category: 'rent', date: '2026-03-05', type: 'expense' }), // Wrong category
      createEntry({ amount: 100, category: 'food', date: '2026-02-28', type: 'expense' }), // Wrong month
    ];

    const status = calculateBudgetStatus(budget, entries, TODAY);
    expect(status.spent).toBe(150);
    expect(status.pct).toBe(30);
  });

  it('correctly identifies budget states', () => {
    // Under budget
    const s1 = calculateBudgetStatus(budget, [createEntry({ amount: 100, category: 'food', date: '2026-03-01' })], TODAY);
    expect(s1.isOverBudget).toBe(false);
    expect(s1.isWarning).toBe(false);

    // Warning (>= 80%)
    const s2 = calculateBudgetStatus(budget, [createEntry({ amount: 400, category: 'food', date: '2026-03-01' })], TODAY);
    expect(s2.isWarning).toBe(true);
    expect(s2.isAtLimit).toBe(false);

    // At Limit (100%)
    const s3 = calculateBudgetStatus(budget, [createEntry({ amount: 500, category: 'food', date: '2026-03-01' })], TODAY);
    expect(s3.isAtLimit).toBe(true);
    expect(s3.isOverBudget).toBe(false);

    // Over Budget (> 100%)
    const s4 = calculateBudgetStatus(budget, [createEntry({ amount: 501, category: 'food', date: '2026-03-01' })], TODAY);
    expect(s4.isOverBudget).toBe(true);
  });
});

describe('resolveFilterRange', () => {
  it('resolves "this-month" correctly', () => {
    const range = resolveFilterRange({ preset: 'this-month', custom: { from: null, to: null } }, TODAY);
    expect(range.from).toBe('2026-03-01');
    expect(range.to).toBe('2026-03-31');
  });

  it('resolves "last-month" correctly across year boundary', () => {
    const JAN_2026 = new Date('2026-01-10T12:00:00Z');
    const range = resolveFilterRange({ preset: 'last-month', custom: { from: null, to: null } }, JAN_2026);
    expect(range.from).toBe('2025-12-01');
    expect(range.to).toBe('2025-12-31');
  });

  it('resolves "last-month" correctly for leap years (Feb 29)', () => {
    const MARCH_2024 = new Date('2024-03-15T12:00:00Z'); // 2024 is leap year
    const range = resolveFilterRange({ preset: 'last-month', custom: { from: null, to: null } }, MARCH_2024);
    expect(range.from).toBe('2024-02-01');
    expect(range.to).toBe('2024-02-29');
  });

  it('resolves "last-3-months" correctly', () => {
    const range = resolveFilterRange({ preset: 'last-3-months', custom: { from: null, to: null } }, TODAY);
    // March, Feb, Jan
    expect(range.from).toBe('2026-01-01');
    expect(range.to).toBe('2026-03-31');
  });

  it('returns custom range when preset is "custom"', () => {
    const custom = { from: '2026-06-01', to: '2026-06-30' };
    const range = resolveFilterRange({ preset: 'custom', custom }, TODAY);
    expect(range).toEqual(custom);
  });

  it('returns nulls for "all-time"', () => {
    const range = resolveFilterRange({ preset: 'all-time', custom: { from: 'bad', to: 'data' } }, TODAY);
    expect(range.from).toBeNull();
    expect(range.to).toBeNull();
  });
});

describe('filterEntriesByDate', () => {
  const entries = [
    createEntry({ id: '1', date: '2026-01-01' }),
    createEntry({ id: '2', date: '2026-02-15' }),
    createEntry({ id: '3', date: '2026-03-31' }),
  ];

  it('returns all entries if range has no boundaries', () => {
    expect(filterEntriesByDate(entries, { from: null, to: null })).toHaveLength(3);
  });

  it('filters by "from" date (inclusive)', () => {
    const filtered = filterEntriesByDate(entries, { from: '2026-02-15', to: null });
    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('2');
    expect(filtered[1].id).toBe('3');
  });

  it('filters by "to" date (inclusive)', () => {
    const filtered = filterEntriesByDate(entries, { from: null, to: '2026-02-15' });
    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('1');
    expect(filtered[1].id).toBe('2');
  });

  it('filters by both boundaries', () => {
    const filtered = filterEntriesByDate(entries, { from: '2026-02-01', to: '2026-03-01' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('2');
  });
});
