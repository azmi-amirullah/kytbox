import { describe, it, expect } from 'vitest';
import { calculateSafeToSpend } from '@/features/cashflow/lib/safe-to-spend';
import type { CashflowRecurringRuleDTO } from '@/types/dto';

describe('Cashflow Safe-to-Spend Engine', () => {
  const mockRecurringRules: CashflowRecurringRuleDTO[] = [
    {
      id: 'rule-netflix',
      cashflow_id: 'cf-1',
      description: 'Netflix Subscription',
      amount: 15,
      type: 'expense',
      category: 'Entertainment',
      goal_id: null,
      recurrence_interval: 'monthly',
      yearly_calculation: null,
      day_of_month: 15,
      is_active: true,
      start_date: '2026-01-01',
    },
    {
      id: 'rule-rent',
      cashflow_id: 'cf-1',
      description: 'Apartment Rent',
      amount: 800,
      type: 'expense',
      category: 'Housing',
      goal_id: null,
      recurrence_interval: 'monthly',
      yearly_calculation: null,
      day_of_month: 25,
      is_active: true,
      start_date: '2026-01-01',
    },
    {
      id: 'rule-gym',
      cashflow_id: 'cf-1',
      description: 'Gym Membership',
      amount: 50,
      type: 'expense',
      category: 'Health',
      goal_id: null,
      recurrence_interval: 'monthly',
      yearly_calculation: null,
      day_of_month: 5, // Already passed if refDate is Sep 10
      is_active: true,
      start_date: '2026-01-01',
    },
    {
      id: 'rule-salary',
      cashflow_id: 'cf-1',
      description: 'Salary',
      amount: 3000,
      type: 'income', // Should be excluded from expense bills
      category: 'Income',
      goal_id: null,
      recurrence_interval: 'monthly',
      yearly_calculation: null,
      day_of_month: 28,
      is_active: true,
      start_date: '2026-01-01',
    },
    {
      id: 'rule-inactive',
      cashflow_id: 'cf-1',
      description: 'Old Subscription',
      amount: 20,
      type: 'expense',
      category: 'Other',
      goal_id: null,
      recurrence_interval: 'monthly',
      yearly_calculation: null,
      day_of_month: 18,
      is_active: false, // Inactive, should be ignored
      start_date: '2026-01-01',
    },
  ];

  it('calculates daily and total safe-to-spend with upcoming bills and positive balance', () => {
    // Reference date: Sep 10, 2026 (September has 30 days)
    // Days remaining = 30 - 10 + 1 = 21 days (or 20 full days to end of month)
    const refDate = new Date('2026-09-10T12:00:00Z');
    const balance = 1500;
    const savingsGoal = 200;

    // Upcoming bills this month: Netflix (15 on Sep 15), Rent (800 on Sep 25) = 815
    // Gym (day 5) has already passed this month, so not counted for this month
    const result = calculateSafeToSpend({
      balance,
      recurringRules: mockRecurringRules,
      savingsGoal,
      referenceDate: refDate,
    });

    expect(result.currentBalance).toBe(1500);
    expect(result.totalUpcomingBillsThisMonth).toBe(815);
    expect(result.savingsGoal).toBe(200);

    // Reserved commitments = 815 + 200 = 1015
    // Safe to spend total = 1500 - 1015 = 485
    expect(result.safeToSpendTotal).toBe(485);
    expect(result.isDeficit).toBe(false);
    expect(result.deficitAmount).toBe(0);
    expect(result.safeToSpendDaily).toBeCloseTo(485 / result.daysRemaining, 2);
  });

  it('correctly categorizes bills due in next 7 days vs 30 days', () => {
    const refDate = new Date('2026-09-10T12:00:00Z');
    const result = calculateSafeToSpend({
      balance: 1000,
      recurringRules: mockRecurringRules,
      referenceDate: refDate,
    });

    // Netflix is due on Sep 15 (5 days away -> <= 7 days)
    expect(result.upcomingBills7Days.some((b) => b.id === 'rule-netflix')).toBe(true);

    // Rent is due on Sep 25 (15 days away -> > 7 days, <= 30 days)
    expect(result.upcomingBills7Days.some((b) => b.id === 'rule-rent')).toBe(false);
    expect(result.upcomingBills30Days.some((b) => b.id === 'rule-rent')).toBe(true);

    // Gym (day 5) is due on Oct 5 (25 days away -> <= 30 days)
    expect(result.upcomingBills30Days.some((b) => b.id === 'rule-gym')).toBe(true);
  });

  it('handles deficit state gracefully without NaN or negative safeToSpendTotal', () => {
    const refDate = new Date('2026-09-10T12:00:00Z');
    const balance = 500; // Less than upcoming bills (815)
    const result = calculateSafeToSpend({
      balance,
      recurringRules: mockRecurringRules,
      referenceDate: refDate,
    });

    expect(result.isDeficit).toBe(true);
    expect(result.safeToSpendTotal).toBe(0);
    expect(result.safeToSpendDaily).toBe(0);
    expect(result.deficitAmount).toBe(315); // 815 - 500
  });

  it('handles zero recurring rules (cold-start) gracefully', () => {
    const refDate = new Date('2026-09-10T12:00:00Z');
    const result = calculateSafeToSpend({
      balance: 1000,
      recurringRules: [],
      referenceDate: refDate,
    });

    expect(result.totalUpcomingBillsThisMonth).toBe(0);
    expect(result.safeToSpendTotal).toBe(1000);
    expect(result.safeToSpendDaily).toBeGreaterThan(0);
    expect(result.isDeficit).toBe(false);
    expect(result.upcomingBills).toHaveLength(0);
  });
});
