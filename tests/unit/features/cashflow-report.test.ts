import { describe, it, expect } from 'vitest';
import {
  generateFinancialReportData,
} from '@/features/cashflow/math';
import type { CashflowEntryDTO } from '@/types/dto';

const createEntry = (overrides: Partial<CashflowEntryDTO>): CashflowEntryDTO => ({
  id: 'test-id',
  cashflow_id: 'cf-1',
  goal_id: null,
  description: 'Test Entry',
  amount: 100,
  type: 'expense',
  category: 'Food',
  date: '2026-08-15',
  created_at: '2026-08-15T00:00:00Z',
  is_recurring: false,
  recurrence_interval: null,
  yearly_calculation: null,
  tags: [],
  ...overrides,
});

describe('generateFinancialReportData', () => {
  const fixedNow = new Date('2026-08-23T12:00:00Z');

  it('handles empty entries gracefully', () => {
    const report = generateFinancialReportData('Personal Budget', [], {
      range: { from: null, to: null },
      currency: 'USD',
      now: fixedNow,
    });

    expect(report.title).toBe('Personal Budget');
    expect(report.periodLabel).toBe('All Time');
    expect(report.currency).toBe('USD');
    expect(report.kpi.totalIncome).toBe(0);
    expect(report.kpi.totalExpense).toBe(0);
    expect(report.kpi.netSavings).toBe(0);
    expect(report.kpi.savingsRate).toBe(0);
    expect(report.kpi.totalTransactions).toBe(0);
    expect(report.expenseCategories).toEqual([]);
    expect(report.incomeCategories).toEqual([]);
    expect(report.topExpenses).toEqual([]);
    expect(report.entries).toEqual([]);
  });

  it('calculates KPIs correctly for mixed income and expenses', () => {
    const entries: CashflowEntryDTO[] = [
      createEntry({ id: '1', type: 'income', amount: 5000, category: 'Salary', date: '2026-08-01' }),
      createEntry({ id: '2', type: 'income', amount: 1200, category: 'Freelance', date: '2026-08-05' }),
      createEntry({ id: '3', type: 'expense', amount: 1500, category: 'Housing', date: '2026-08-02' }),
      createEntry({ id: '4', type: 'expense', amount: 600, category: 'Food', date: '2026-08-10' }),
      createEntry({ id: '5', type: 'expense', amount: 300, category: 'Utilities', date: '2026-08-12' }),
    ];

    const report = generateFinancialReportData('Monthly Cashflow', entries, {
      range: { from: '2026-08-01', to: '2026-08-31' },
      currency: 'USD',
      now: fixedNow,
    });

    expect(report.kpi.totalIncome).toBe(6200);
    expect(report.kpi.totalExpense).toBe(2400);
    expect(report.kpi.netSavings).toBe(3800);
    // (3800 / 6200) * 100 = 61.29%
    expect(report.kpi.savingsRate).toBe(61.29);
    expect(report.kpi.totalTransactions).toBe(5);
    expect(report.kpi.incomeCount).toBe(2);
    expect(report.kpi.expenseCount).toBe(3);
  });

  it('handles negative cashflow (deficit) with zero savings rate', () => {
    const entries: CashflowEntryDTO[] = [
      createEntry({ id: '1', type: 'income', amount: 1000, date: '2026-08-01' }),
      createEntry({ id: '2', type: 'expense', amount: 2500, date: '2026-08-02' }),
    ];

    const report = generateFinancialReportData('Deficit Test', entries, {
      range: { from: null, to: null },
      currency: 'USD',
      now: fixedNow,
    });

    expect(report.kpi.totalIncome).toBe(1000);
    expect(report.kpi.totalExpense).toBe(2500);
    expect(report.kpi.netSavings).toBe(-1500);
    expect(report.kpi.savingsRate).toBe(0);
  });

  it('aggregates category distributions and calculates percentage shares', () => {
    const entries: CashflowEntryDTO[] = [
      createEntry({ id: '1', type: 'expense', amount: 800, category: 'Housing', date: '2026-08-01' }),
      createEntry({ id: '2', type: 'expense', amount: 200, category: 'Housing', date: '2026-08-02' }),
      createEntry({ id: '3', type: 'expense', amount: 500, category: 'Food', date: '2026-08-03' }),
      createEntry({ id: '4', type: 'expense', amount: 500, category: 'Food', date: '2026-08-04' }),
    ];

    const report = generateFinancialReportData('Categories Test', entries, {
      range: { from: null, to: null },
      currency: 'USD',
      now: fixedNow,
    });

    expect(report.expenseCategories).toHaveLength(2);
    // Housing: 1000 (50%), Food: 1000 (50%)
    expect(report.expenseCategories[0].total).toBe(1000);
    expect(report.expenseCategories[0].percentage).toBe(50);
    expect(report.expenseCategories[0].count).toBe(2);
  });

  it('extracts top 5 largest expenses spotlight sorted descending', () => {
    const entries: CashflowEntryDTO[] = [
      createEntry({ id: '1', type: 'expense', amount: 150, description: 'E1', date: '2026-08-01' }),
      createEntry({ id: '2', type: 'expense', amount: 1200, description: 'E2', date: '2026-08-02' }),
      createEntry({ id: '3', type: 'expense', amount: 450, description: 'E3', date: '2026-08-03' }),
      createEntry({ id: '4', type: 'expense', amount: 80, description: 'E4', date: '2026-08-04' }),
      createEntry({ id: '5', type: 'expense', amount: 3000, description: 'E5', date: '2026-08-05' }),
      createEntry({ id: '6', type: 'expense', amount: 900, description: 'E6', date: '2026-08-06' }),
      createEntry({ id: '7', type: 'expense', amount: 20, description: 'E7', date: '2026-08-07' }),
    ];

    const report = generateFinancialReportData('Top Expenses Test', entries, {
      range: { from: null, to: null },
      currency: 'USD',
      now: fixedNow,
    });

    expect(report.topExpenses).toHaveLength(5);
    expect(report.topExpenses[0].description).toBe('E5');
    expect(report.topExpenses[0].amount).toBe(3000);
    expect(report.topExpenses[1].description).toBe('E2');
    expect(report.topExpenses[1].amount).toBe(1200);
    expect(report.topExpenses[2].description).toBe('E6');
    expect(report.topExpenses[2].amount).toBe(900);
    expect(report.topExpenses[3].description).toBe('E3');
    expect(report.topExpenses[3].amount).toBe(450);
    expect(report.topExpenses[4].description).toBe('E1');
    expect(report.topExpenses[4].amount).toBe(150);
  });

  it('counts split items correctly', () => {
    const entries: CashflowEntryDTO[] = [
      createEntry({
        id: 'p1',
        type: 'expense',
        amount: 150,
        description: 'Supermarket Bill',
        items: [
          { id: 's1', parent_entry_id: 'p1', item_name: 'Groceries', category: 'Food', amount: 100 },
          { id: 's2', parent_entry_id: 'p1', item_name: 'Cleaning', category: 'Home', amount: 50 },
        ],
      }),
      createEntry({ id: 'p2', type: 'expense', amount: 50 }),
    ];

    const report = generateFinancialReportData('Split Test', entries, {
      range: { from: null, to: null },
      currency: 'USD',
      now: fixedNow,
    });

    expect(report.kpi.totalTransactions).toBe(2);
    expect(report.kpi.splitItemsCount).toBe(2);
  });

  it('filters entries by date and sorts them chronologically (date-asc)', () => {
    const entries: CashflowEntryDTO[] = [
      createEntry({ id: '1', date: '2026-08-20', description: 'Late Aug' }),
      createEntry({ id: '2', date: '2026-08-05', description: 'Early Aug' }),
      createEntry({ id: '3', date: '2026-07-25', description: 'July' }),
      createEntry({ id: '4', date: '2026-09-02', description: 'Sept' }),
    ];

    const report = generateFinancialReportData('Filter Test', entries, {
      range: { from: '2026-08-01', to: '2026-08-31' },
      currency: 'USD',
      now: fixedNow,
    });

    expect(report.entries).toHaveLength(2);
    expect(report.entries[0].description).toBe('Early Aug');
    expect(report.entries[1].description).toBe('Late Aug');
  });
});
