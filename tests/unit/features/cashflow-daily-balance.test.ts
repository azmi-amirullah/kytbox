import {
  calculateDailyBalanceProjection,
  calculateProjections,
  type DailyBalancePoint,
  type DailyBalanceProjection,
} from '@/features/cashflow/math';
import { calculateSafeToSpend } from '@/features/cashflow/lib/safe-to-spend';
import type { CashflowEntryDTO, CashflowRecurringRuleDTO } from '@/types/dto';

// Fixed "today": September 16, 2026 (September has 30 days)
const TODAY = new Date('2026-09-16T12:00:00Z');

const createEntry = (overrides: Partial<CashflowEntryDTO>): CashflowEntryDTO => ({
  id: 'entry-1',
  cashflow_id: 'cf-1',
  goal_id: null,
  description: 'Test Entry',
  amount: 100,
  type: 'expense',
  category: 'other',
  date: '2026-09-01',
  created_at: '2026-09-01T00:00:00Z',
  is_recurring: false,
  recurrence_interval: null,
  yearly_calculation: null,
  tags: [],
  ...overrides,
});

const createRule = (overrides: Partial<CashflowRecurringRuleDTO>): CashflowRecurringRuleDTO => ({
  id: 'rule-1',
  cashflow_id: 'cf-1',
  description: 'Recurring Bill',
  amount: 100,
  type: 'expense',
  category: 'Other',
  goal_id: null,
  recurrence_interval: 'monthly',
  yearly_calculation: null,
  day_of_month: 1,
  is_active: true,
  start_date: '2026-01-01',
  ...overrides,
});

function dayAt(result: DailyBalanceProjection, date: string): DailyBalancePoint {
  const day = result.days.find((d) => d.date === date);
  if (!day) throw new Error(`No projection day for ${date}`);
  return day;
}

describe('calculateDailyBalanceProjection', () => {
  it('reconstructs past days backwards from the settled balance', () => {
    const entries = [
      createEntry({ id: 'e1', amount: 1000, type: 'income', date: '2026-09-01' }),
      createEntry({ id: 'e2', amount: 400, type: 'expense', date: '2026-09-10' }),
      createEntry({ id: 'e3', amount: 500, type: 'income', date: '2026-09-20' }),
    ];

    const result = calculateDailyBalanceProjection({
      entries,
      recurringRules: [],
      rangeStart: '2026-09-01',
      rangeEnd: '2026-09-30',
      referenceDate: TODAY,
    });

    expect(result.days).toHaveLength(30);
    expect(result.currentBalance).toBe(600);
    expect(result.currentBalance).toBe(calculateProjections(entries, TODAY).settledCash);

    expect(dayAt(result, '2026-09-01').balance).toBe(1000);
    expect(dayAt(result, '2026-09-10').balance).toBe(600);
    expect(dayAt(result, '2026-09-16').balance).toBe(600);
    expect(dayAt(result, '2026-09-16').isToday).toBe(true);
    expect(dayAt(result, '2026-09-15').isPast).toBe(true);
    expect(dayAt(result, '2026-09-20').balance).toBe(1100);

    expect(result.endingBalance).toBe(1100);
    expect(result.nextIncomeDate).toBe('2026-09-20');
    expect(result.atRiskDates).toHaveLength(0);
    expect(result.lowestBalance).toBe(600);
    expect(result.lowestDate).toBe('2026-09-10');
  });

  it('projects unpaid recurring rules after today and never double-counts posted ones', () => {
    const entries = [
      createEntry({ id: 'e-salary', amount: 2000, type: 'income', date: '2026-09-01' }),
      createEntry({
        id: 'e-netflix',
        amount: 15,
        type: 'expense',
        description: 'Netflix',
        date: '2026-09-15',
        is_recurring: true,
        recurring_rule_id: 'rule-netflix',
      }),
      createEntry({
        id: 'e-rent-posted',
        amount: 800,
        type: 'expense',
        description: 'Apartment Rent',
        date: '2026-09-25',
        is_recurring: true,
        recurring_rule_id: 'rule-rent',
      }),
    ];
    const recurringRules = [
      createRule({ id: 'rule-rent', description: 'Apartment Rent', amount: 800, day_of_month: 25 }),
      createRule({ id: 'rule-netflix', description: 'Netflix', amount: 15, day_of_month: 15 }),
      createRule({ id: 'rule-spotify', description: 'Spotify', amount: 10, day_of_month: 20 }),
      createRule({ id: 'rule-dead', description: 'Dead Bill', amount: 999, is_active: false }),
    ];

    const result = calculateDailyBalanceProjection({
      entries,
      recurringRules,
      rangeStart: '2026-09-01',
      rangeEnd: '2026-09-30',
      referenceDate: TODAY,
    });

    expect(result.currentBalance).toBe(1985);

    // Past days come from entries only: no projected bill may appear behind us.
    expect(dayAt(result, '2026-09-15').events).toHaveLength(1);
    expect(dayAt(result, '2026-09-15').events[0].source).toBe('entry');
    expect(dayAt(result, '2026-09-15').balance).toBe(1985);

    // Unposted rule is projected once.
    expect(dayAt(result, '2026-09-20').events).toHaveLength(1);
    expect(dayAt(result, '2026-09-20').events[0].source).toBe('recurring');
    expect(dayAt(result, '2026-09-20').balance).toBe(1975);

    // Posted rule is represented by its entry, not by a second projected chip.
    expect(dayAt(result, '2026-09-25').events).toHaveLength(1);
    expect(dayAt(result, '2026-09-25').events[0].source).toBe('entry');
    expect(dayAt(result, '2026-09-25').netDelta).toBe(-800);

    expect(result.endingBalance).toBe(1175);
  });

  it('skips a projected occurrence when an unlinked entry already covers that day', () => {
    const entries = [
      createEntry({ id: 'e-spotify', amount: 10, type: 'expense', description: 'Spotify', date: '2026-09-20' }),
    ];
    const recurringRules = [
      createRule({ id: 'rule-spotify', description: 'Spotify', amount: 10, day_of_month: 20 }),
    ];

    const result = calculateDailyBalanceProjection({
      entries,
      recurringRules,
      rangeStart: '2026-09-01',
      rangeEnd: '2026-09-30',
      referenceDate: TODAY,
    });

    expect(dayAt(result, '2026-09-20').events).toHaveLength(1);
    expect(dayAt(result, '2026-09-20').netDelta).toBe(-10);
    expect(dayAt(result, '2026-09-20').balance).toBe(-10);
  });

  it('clamps monthly due dates to short months and honours start_date', () => {
    const referenceDate = new Date('2026-12-15T12:00:00Z');
    const recurringRules = [
      createRule({ id: 'rule-31', description: 'Card Bill', amount: 300, day_of_month: 31 }),
      createRule({ id: 'rule-late', description: 'New Bill', amount: 50, day_of_month: 5, start_date: '2027-03-05' }),
    ];

    const result = calculateDailyBalanceProjection({
      entries: [],
      recurringRules,
      rangeStart: '2027-02-01',
      rangeEnd: '2027-02-28',
      referenceDate,
    });

    const daysWithEvents = result.days.filter((day) => day.events.length > 0);
    expect(daysWithEvents).toHaveLength(1);
    expect(dayAt(result, '2027-02-28').events[0].id).toBe('rule-31');
    expect(dayAt(result, '2027-02-28').balance).toBe(-300);
  });

  it('projects yearly rules on the anniversary month only, at full amount', () => {
    const recurringRules = [
      createRule({
        id: 'rule-yearly',
        description: 'Car Insurance',
        amount: 1200,
        recurrence_interval: 'yearly',
        day_of_month: 0,
        start_date: '2024-11-20',
      }),
    ];

    const result = calculateDailyBalanceProjection({
      entries: [],
      recurringRules,
      rangeStart: '2026-10-01',
      rangeEnd: '2026-11-30',
      referenceDate: TODAY,
    });

    const daysWithEvents = result.days.filter((day) => day.events.length > 0);
    expect(daysWithEvents).toHaveLength(1);
    expect(dayAt(result, '2026-11-20').events[0].amount).toBe(1200);
    expect(dayAt(result, '2026-11-30').balance).toBe(-1200);
  });

  it('flags liquidity cliffs and reports the next income day', () => {
    const entries = [
      createEntry({ id: 'e-open', amount: 200, type: 'income', date: '2026-09-01' }),
    ];
    const recurringRules = [
      createRule({ id: 'rule-rent', description: 'Rent', amount: 500, day_of_month: 25 }),
      createRule({ id: 'rule-salary', description: 'Salary', amount: 1000, type: 'income', day_of_month: 30 }),
    ];

    const result = calculateDailyBalanceProjection({
      entries,
      recurringRules,
      rangeStart: '2026-09-01',
      rangeEnd: '2026-09-30',
      referenceDate: TODAY,
    });

    expect(dayAt(result, '2026-09-24').isAtRisk).toBe(false);
    expect(dayAt(result, '2026-09-25').isAtRisk).toBe(true);
    expect(result.atRiskDates).toEqual([
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
      '2026-09-28',
      '2026-09-29',
    ]);
    expect(result.lowestBalance).toBe(-300);
    expect(result.lowestDate).toBe('2026-09-25');
    expect(result.nextIncomeDate).toBe('2026-09-30');
    expect(result.endingBalance).toBe(700);

    const widerThreshold = calculateDailyBalanceProjection({
      entries,
      recurringRules,
      rangeStart: '2026-09-01',
      rangeEnd: '2026-09-30',
      referenceDate: TODAY,
      atRiskThreshold: 250,
    });
    expect(widerThreshold.atRiskDates[0]).toBe('2026-09-01');
  });

  it('reconstructs a month entirely before the reference date', () => {
    const entries = [
      createEntry({ id: 'e-aug', amount: 100, type: 'expense', date: '2026-08-10' }),
      createEntry({ id: 'e-sep', amount: 1000, type: 'income', date: '2026-09-01' }),
    ];

    const result = calculateDailyBalanceProjection({
      entries,
      recurringRules: [],
      rangeStart: '2026-08-01',
      rangeEnd: '2026-08-31',
      referenceDate: TODAY,
    });

    expect(result.currentBalance).toBe(900);
    expect(dayAt(result, '2026-08-01').balance).toBe(0);
    expect(dayAt(result, '2026-08-10').balance).toBe(-100);
    expect(result.endingBalance).toBe(-100);
    expect(result.days.every((day) => day.isPast)).toBe(true);
    expect(result.nextIncomeDate).toBeNull();
  });

  it('returns no days for an invalid or inverted range but keeps the settled balance', () => {
    const entries = [createEntry({ id: 'e1', amount: 500, type: 'income', date: '2026-09-01' })];

    const malformed = calculateDailyBalanceProjection({
      entries,
      recurringRules: [],
      rangeStart: 'not-a-date',
      rangeEnd: '2026-09-30',
      referenceDate: TODAY,
    });
    const inverted = calculateDailyBalanceProjection({
      entries,
      recurringRules: [],
      rangeStart: '2026-09-30',
      rangeEnd: '2026-09-01',
      referenceDate: TODAY,
    });

    expect(malformed.days).toHaveLength(0);
    expect(inverted.days).toHaveLength(0);
    expect(malformed.currentBalance).toBe(500);
    expect(inverted.currentBalance).toBe(500);
  });

  it('agrees with Safe-to-Spend at month end once sinking funds and the savings goal are re-reserved', () => {
    const entries = [
      createEntry({ id: 'e-open', amount: 1500, type: 'income', date: '2026-09-01' }),
    ];
    const recurringRules = [
      createRule({ id: 'rule-netflix', description: 'Netflix', amount: 15, day_of_month: 15 }),
      createRule({ id: 'rule-rent', description: 'Rent', amount: 800, day_of_month: 25 }),
      createRule({ id: 'rule-gym', description: 'Gym', amount: 50, day_of_month: 5 }),
      createRule({
        id: 'rule-yearly',
        description: 'Car Insurance',
        amount: 1200,
        recurrence_interval: 'yearly',
        day_of_month: 0,
        start_date: '2024-06-20',
      }),
    ];
    const savingsGoal = 200;

    const safeToSpend = calculateSafeToSpend({
      balance: 1500,
      recurringRules,
      savingsGoal,
      referenceDate: TODAY,
    });
    const projection = calculateDailyBalanceProjection({
      entries,
      recurringRules,
      rangeStart: '2026-09-01',
      rangeEnd: '2026-09-30',
      referenceDate: TODAY,
    });

    // No future income and no future one-time rows: the two engines describe
    // the same month, one as a daily series, one as a reserved total.
    expect(safeToSpend.totalUpcomingBillsThisMonth).toBe(800);
    expect(safeToSpend.totalSinkingFundsMonthly).toBe(100);
    expect(safeToSpend.safeToSpendTotal).toBe(400);
    expect(projection.currentBalance).toBe(1500);
    expect(projection.endingBalance).toBe(700);
    expect(projection.endingBalance).toBe(
      safeToSpend.safeToSpendTotal +
        safeToSpend.totalSinkingFundsMonthly +
        safeToSpend.savingsGoal
    );
  });

  it('places projected bills on the due dates Safe-to-Spend reports', () => {
    const entries = [
      createEntry({ id: 'e-open', amount: 1500, type: 'income', date: '2026-09-01' }),
    ];
    const recurringRules = [
      createRule({ id: 'rule-netflix', description: 'Netflix', amount: 15, day_of_month: 15 }),
      createRule({ id: 'rule-rent', description: 'Rent', amount: 800, day_of_month: 25 }),
      createRule({ id: 'rule-gym', description: 'Gym', amount: 50, day_of_month: 5 }),
    ];

    const safeToSpend = calculateSafeToSpend({
      balance: 1500,
      recurringRules,
      referenceDate: TODAY,
    });
    const projection = calculateDailyBalanceProjection({
      entries,
      recurringRules,
      rangeStart: '2026-09-01',
      rangeEnd: '2026-10-31',
      referenceDate: TODAY,
    });

    const projectedDates = projection.days
      .filter((day) => day.events.some((event) => event.source === 'recurring'))
      .map((day) => day.date);

    // Safe-to-Spend reports one next occurrence per rule; each of them must land
    // on the day the calendar projects it. The calendar may project further
    // occurrences (next month's second bill) that the bill list does not carry.
    for (const bill of safeToSpend.upcomingBills) {
      expect(projectedDates).toContain(bill.dueDate);
    }
    expect(safeToSpend.upcomingBills).toHaveLength(3);
    expect(projectedDates).toHaveLength(4);
  });
});
