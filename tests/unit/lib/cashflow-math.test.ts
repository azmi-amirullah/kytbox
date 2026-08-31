import { 
  calculateProjections, 
  calculateBudgetStatus,
  resolveFilterRange,
  getDateFilterPresetMonthLabel,
  filterEntriesByDate,
  sortEntries,
  filterEntriesByTags,
  isCashflowSortOption,
} from '@/features/cashflow/math';
import type { CashflowEntryDTO, CashflowBudgetDTO } from '@/types/dto';

// Fix "Today" to March 15, 2026 for all tests to ensure deterministic results
const TODAY = new Date('2026-03-15T12:00:00Z');

const createEntry = (overrides: Partial<CashflowEntryDTO>): CashflowEntryDTO => ({
  id: 'test-id',
  cashflow_id: 'cf-1',
  goal_id: null,
  description: 'Test Entry',
  amount: 100,
  type: 'expense',
  category: 'other',
  date: '2026-03-01',
  created_at: '2026-03-01T00:00:00Z',
  is_recurring: false,
  recurrence_interval: null,
  yearly_calculation: null,
  tags: [],
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

  it('deduplicates recurring items of the same series to avoid double-counting in projections', () => {
    const entries = [
      createEntry({
        id: 'entry-1',
        description: 'Netflix Subscription',
        amount: 15,
        type: 'expense',
        date: '2026-01-15',
        is_recurring: true,
        recurrence_interval: 'monthly'
      }),
      createEntry({
        id: 'entry-2',
        description: 'Netflix Subscription',
        amount: 15,
        type: 'expense',
        date: '2026-02-15',
        is_recurring: true,
        recurrence_interval: 'monthly'
      }),
      createEntry({
        id: 'entry-3',
        description: 'Netflix Subscription',
        amount: 15,
        type: 'expense',
        date: '2026-03-15',
        is_recurring: true,
        recurrence_interval: 'monthly'
      }),
    ];

    const result = calculateProjections(entries, TODAY);
    
    // Settled: Netflix has occurred in Jan, Feb, March (today is 15th, so March 15 is settled)
    // Realized Expense: 15 + 15 + 15 = 45
    // Upcoming projection: Netflix should only project for April (1 occurrence).
    // If it was not deduplicated, it would project April for ALL 3 entries, multiplying upcoming expenses by 3.
    // With deduplication, upcomingMonthlyExpenses should be exactly 15 (1 * 15).
    expect(result.upcomingMonthlyExpenses).toBe(15);
    
    // Only 1 recurring item should have non-zero projected amount
    const recurringItemsWithProjections = result.recurringItems.filter(item => item.projectedAmount > 0);
    expect(recurringItemsWithProjections).toHaveLength(1);
    expect(recurringItemsWithProjections[0].id).toBe('entry-3');
  });

  it('does not project cancelled recurring items if the latest entry in the series is not recurring', () => {
    const entries = [
      createEntry({
        id: 'entry-1',
        description: 'Gym Membership',
        amount: 50,
        type: 'expense',
        date: '2026-01-10',
        is_recurring: true,
        recurrence_interval: 'monthly'
      }),
      createEntry({
        id: 'entry-2',
        description: 'Gym Membership',
        amount: 50,
        type: 'expense',
        date: '2026-02-10',
        is_recurring: true,
        recurrence_interval: 'monthly'
      }),
      createEntry({
        id: 'entry-3',
        description: 'Gym Membership',
        amount: 50,
        type: 'expense',
        date: '2026-03-10',
        is_recurring: false, // Cancelled this month
        recurrence_interval: null
      }),
    ];

    const result = calculateProjections(entries, TODAY);
    
    // Gym Membership is cancelled (latest is entry-3, which is_recurring = false)
    // So there should be no upcoming projections for it.
    expect(result.upcomingMonthlyExpenses).toBe(0);
    const recurringItemsWithProjections = result.recurringItems.filter(item => item.projectedAmount > 0);
    expect(recurringItemsWithProjections).toHaveLength(0);
  });

  it('projects only the latest price/interval when a recurring item changes price', () => {
    const entries = [
      createEntry({
        id: 'entry-1',
        description: 'Spotify Premium',
        amount: 10,
        type: 'expense',
        date: '2026-01-05',
        is_recurring: true,
        recurrence_interval: 'monthly'
      }),
      createEntry({
        id: 'entry-2',
        description: 'Spotify Premium',
        amount: 10,
        type: 'expense',
        date: '2026-02-05',
        is_recurring: true,
        recurrence_interval: 'monthly'
      }),
      createEntry({
        id: 'entry-3',
        description: 'Spotify Premium',
        amount: 12, // Price went up to 12
        type: 'expense',
        date: '2026-03-05',
        is_recurring: true,
        recurrence_interval: 'monthly'
      }),
    ];

    const result = calculateProjections(entries, TODAY);

    // Spotify Premium price was increased to 12. Only the latest ($12) should project.
    // Settled: Spotify has occurred in Jan, Feb, March (all before TODAY March 15)
    // Upcoming projection: Spotify should only project for April (1 occurrence).
    // Expected upcoming expense for Spotify is 12 (not 10, and not 10 + 12).
    expect(result.upcomingMonthlyExpenses).toBe(12);

    const recurringItemsWithProjections = result.recurringItems.filter(item => item.projectedAmount > 0);
    expect(recurringItemsWithProjections).toHaveLength(1);
    expect(recurringItemsWithProjections[0].id).toBe('entry-3');
    expect(recurringItemsWithProjections[0].amount).toBe(12);
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

describe('getDateFilterPresetMonthLabel', () => {
  it('formats month labels for "this-month", "last-month", and "last-3-months"', () => {
    // TODAY = 2026-03-15 (March 2026)
    expect(getDateFilterPresetMonthLabel({ preset: 'this-month', custom: { from: null, to: null } }, TODAY)).toBe('Mar 2026');
    expect(getDateFilterPresetMonthLabel({ preset: 'last-month', custom: { from: null, to: null } }, TODAY)).toBe('Feb 2026');
    expect(getDateFilterPresetMonthLabel({ preset: 'last-3-months', custom: { from: null, to: null } }, TODAY)).toBe('Jan – Mar 2026');
    expect(getDateFilterPresetMonthLabel({ preset: 'all-time', custom: { from: null, to: null } }, TODAY)).toBe('');
    expect(getDateFilterPresetMonthLabel({ preset: 'custom', custom: { from: '2026-03-01', to: '2026-03-15' } }, TODAY)).toBe('');
  });

  it('handles cross-year boundaries cleanly', () => {
    const JAN_2027 = new Date('2027-01-15T12:00:00Z');
    expect(getDateFilterPresetMonthLabel({ preset: 'this-month', custom: { from: null, to: null } }, JAN_2027)).toBe('Jan 2027');
    expect(getDateFilterPresetMonthLabel({ preset: 'last-month', custom: { from: null, to: null } }, JAN_2027)).toBe('Dec 2026');
    expect(getDateFilterPresetMonthLabel({ preset: 'last-3-months', custom: { from: null, to: null } }, JAN_2027)).toBe('Nov 2026 – Jan 2027');
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

describe('sortEntries', () => {
  const e1 = createEntry({
    id: '1',
    date: '2026-01-10',
    created_at: '2026-01-15T10:00:00Z',
    amount: 100,
  });
  const e2 = createEntry({
    id: '2',
    date: '2026-02-20',
    created_at: '2026-01-10T12:00:00Z',
    amount: 50,
  });
  const e3 = createEntry({
    id: '3',
    date: '2026-02-20',
    created_at: '2026-02-21T08:00:00Z',
    amount: 300,
  });

  const list = [e1, e2, e3];

  it('sorts by created-desc (newest created_at first)', () => {
    const sorted = sortEntries(list, 'created-desc');
    expect(sorted.map((e) => e.id)).toEqual(['3', '1', '2']);
  });

  it('sorts by created-asc (oldest created_at first)', () => {
    const sorted = sortEntries(list, 'created-asc');
    expect(sorted.map((e) => e.id)).toEqual(['2', '1', '3']);
  });

  it('sorts by date-desc (newest transaction date first with created_at tie-breaker)', () => {
    const sorted = sortEntries(list, 'date-desc');
    // e3 & e2 both 2026-02-20; e3 created_at is newer ('2026-02-21' > '2026-01-10')
    expect(sorted.map((e) => e.id)).toEqual(['3', '2', '1']);
  });

  it('sorts by date-asc (oldest transaction date first)', () => {
    const sorted = sortEntries(list, 'date-asc');
    expect(sorted.map((e) => e.id)).toEqual(['1', '2', '3']);
  });

  it('sorts by amount-desc (highest amount first)', () => {
    const sorted = sortEntries(list, 'amount-desc');
    expect(sorted.map((e) => e.id)).toEqual(['3', '1', '2']);
  });

  it('sorts by amount-asc (lowest amount first)', () => {
    const sorted = sortEntries(list, 'amount-asc');
    expect(sorted.map((e) => e.id)).toEqual(['2', '1', '3']);
  });

  it('handles null created_at without error', () => {
    const legacyEntry = createEntry({ id: 'legacy', created_at: null });
    const sorted = sortEntries([e1, legacyEntry], 'created-desc');
    expect(sorted).toHaveLength(2);
  });
});

describe('isCashflowSortOption', () => {
  it('returns true for valid sort options', () => {
    expect(isCashflowSortOption('date-desc')).toBe(true);
    expect(isCashflowSortOption('date-asc')).toBe(true);
    expect(isCashflowSortOption('created-desc')).toBe(true);
    expect(isCashflowSortOption('created-asc')).toBe(true);
    expect(isCashflowSortOption('amount-desc')).toBe(true);
    expect(isCashflowSortOption('amount-asc')).toBe(true);
  });

  it('returns false for invalid sort options', () => {
    expect(isCashflowSortOption('invalid')).toBe(false);
    expect(isCashflowSortOption('')).toBe(false);
    expect(isCashflowSortOption('created_at-desc')).toBe(false);
  });
});

describe('filterEntriesByTags', () => {
  const e1 = createEntry({ id: '1', tags: ['TaxDeductible', 'ClientA'] });
  const e2 = createEntry({ id: '2', tags: ['ClientA', 'Office'] });
  const e3 = createEntry({ id: '3', tags: ['Personal'] });
  const e4 = createEntry({ id: '4', tags: [] });

  const allEntries = [e1, e2, e3, e4];

  it('returns all entries when selectedTags is empty', () => {
    expect(filterEntriesByTags(allEntries, [])).toEqual(allEntries);
  });

  it('filters by single tag case-insensitively', () => {
    const result = filterEntriesByTags(allEntries, ['taxdeductible']);
    expect(result.map((e) => e.id)).toEqual(['1']);
  });

  it('matches multiple tags with AND logic', () => {
    const result = filterEntriesByTags(allEntries, ['ClientA', 'TaxDeductible']);
    expect(result.map((e) => e.id)).toEqual(['1']);
  });

  it('returns multiple matching entries for a shared tag', () => {
    const result = filterEntriesByTags(allEntries, ['ClientA']);
    expect(result.map((e) => e.id)).toEqual(['1', '2']);
  });

  it('returns empty array when no entries match all selected tags', () => {
    const result = filterEntriesByTags(allEntries, ['ClientA', 'Personal']);
    expect(result).toEqual([]);
  });
});


