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
    expect(result.sinkingFunds).toHaveLength(0);
    expect(result.totalSinkingFundsMonthly).toBe(0);
  });

  describe('True Expenses Sinking Funds Amortizer', () => {
    const yearlyProratedRule: CashflowRecurringRuleDTO = {
      id: 'rule-car-insurance',
      cashflow_id: 'cf-1',
      description: 'Car Insurance (Annual)',
      amount: 1200,
      type: 'expense',
      category: 'Vehicle',
      goal_id: null,
      recurrence_interval: 'yearly',
      yearly_calculation: 'prorated',
      day_of_month: 15,
      is_active: true,
      start_date: '2025-11-15', // Due in November
    };

    const yearlyExactRule: CashflowRecurringRuleDTO = {
      id: 'rule-property-tax',
      cashflow_id: 'cf-1',
      description: 'Property Tax',
      amount: 2400,
      type: 'expense',
      category: 'Housing',
      goal_id: null,
      recurrence_interval: 'yearly',
      yearly_calculation: 'exact',
      day_of_month: 1,
      is_active: true,
      start_date: '2025-12-01', // Due in December
    };

    it('amortizes yearly prorated rule into monthly sinking fund reserve in non-anniversary month', () => {
      // Ref date: Sep 10, 2026. Car insurance is due in Nov (non-anniversary month).
      const refDate = new Date('2026-09-10T12:00:00Z');
      const balance = 2000;

      const result = calculateSafeToSpend({
        balance,
        recurringRules: [...mockRecurringRules, yearlyProratedRule],
        referenceDate: refDate,
      });

      // Monthly bills this month: Netflix (15) + Rent (800) = 815
      expect(result.totalUpcomingBillsThisMonth).toBe(815);

      // Sinking fund reserve: 1200 / 12 = 100/mo
      expect(result.totalSinkingFundsMonthly).toBe(100);
      expect(result.sinkingFunds).toHaveLength(1);
      expect(result.sinkingFunds[0].id).toBe('rule-car-insurance');
      expect(result.sinkingFunds[0].monthlyReserve).toBe(100);
      expect(result.sinkingFunds[0].annualAmount).toBe(1200);
      expect(result.sinkingFunds[0].monthsUntilDue).toBe(2); // Nov is 2 months from Sep

      // Total reserved = 815 + 100 = 915. Safe to spend = 2000 - 915 = 1085
      expect(result.safeToSpendTotal).toBe(1085);
      expect(result.isDeficit).toBe(false);
    });

    it('charges full yearly amount in anniversary month instead of sinking fund reserve', () => {
      // Ref date: Nov 10, 2026. Car insurance is due Nov 15 (anniversary month).
      const refDate = new Date('2026-11-10T12:00:00Z');
      const balance = 3000;

      const result = calculateSafeToSpend({
        balance,
        recurringRules: [yearlyProratedRule],
        referenceDate: refDate,
      });

      // In anniversary month, the full 1200 is due as an upcoming bill
      expect(result.totalUpcomingBillsThisMonth).toBe(1200);
      expect(result.upcomingBills.some((b) => b.id === 'rule-car-insurance')).toBe(true);

      // Sinking funds array should be empty because it is due this month
      expect(result.totalSinkingFundsMonthly).toBe(0);
      expect(result.sinkingFunds).toHaveLength(0);

      // Safe to spend = 3000 - 1200 = 1800
      expect(result.safeToSpendTotal).toBe(1800);
    });

    it('handles exact yearly rule: $0 reserved in non-anniversary month, full amount in anniversary month', () => {
      // Non-anniversary month (Sep 10):
      const refDateSep = new Date('2026-09-10T12:00:00Z');
      const resultSep = calculateSafeToSpend({
        balance: 5000,
        recurringRules: [yearlyExactRule],
        referenceDate: refDateSep,
      });

      expect(resultSep.totalUpcomingBillsThisMonth).toBe(0);
      expect(resultSep.totalSinkingFundsMonthly).toBe(0);
      expect(resultSep.sinkingFunds).toHaveLength(0);
      expect(resultSep.safeToSpendTotal).toBe(5000);

      // Anniversary month (Dec 1):
      const refDateDec = new Date('2026-12-01T08:00:00Z');
      const resultDec = calculateSafeToSpend({
        balance: 5000,
        recurringRules: [yearlyExactRule],
        referenceDate: refDateDec,
      });

      expect(resultDec.totalUpcomingBillsThisMonth).toBe(2400);
      expect(resultDec.safeToSpendTotal).toBe(2600); // 5000 - 2400
    });

    it('factors sinking fund reserve into deficit calculation', () => {
      const refDate = new Date('2026-09-10T12:00:00Z');
      // Balance is 850. Upcoming bills = 815, Sinking fund = 100. Total reserved = 915.
      const balance = 850;

      const result = calculateSafeToSpend({
        balance,
        recurringRules: [...mockRecurringRules, yearlyProratedRule],
        referenceDate: refDate,
      });

      expect(result.isDeficit).toBe(true);
      expect(result.safeToSpendTotal).toBe(0);
      expect(result.deficitAmount).toBe(65); // 915 - 850
    });
  });
});
