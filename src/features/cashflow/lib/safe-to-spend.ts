import type { CashflowRecurringRuleDTO } from '@/types/dto';

export interface UpcomingBill {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  dueDate: string; // YYYY-MM-DD
  dayOfMonth: number;
  daysUntilDue: number;
  isDueIn7Days: boolean;
  isDueIn30Days: boolean;
  isDueThisMonth: boolean;
}

export interface SinkingFundItem {
  id: string;
  description: string;
  annualAmount: number;
  monthlyReserve: number;
  category: string | null;
  anniversaryDate: string; // YYYY-MM-DD
  monthsUntilDue: number;
  daysUntilDue: number;
}

export interface SafeToSpendOptions {
  balance: number;
  recurringRules: CashflowRecurringRuleDTO[];
  savingsGoal?: number;
  referenceDate?: Date;
  paydayDate?: Date | null; // Optional: custom payday instead of month end
}

export interface SafeToSpendResult {
  currentBalance: number;
  totalUpcomingBillsThisMonth: number;
  totalUpcomingBills7Days: number;
  totalUpcomingBills30Days: number;
  totalSinkingFundsMonthly: number;
  savingsGoal: number;
  safeToSpendTotal: number;
  safeToSpendDaily: number;
  daysRemaining: number;
  targetEndDate: string; // YYYY-MM-DD
  isDeficit: boolean;
  deficitAmount: number;
  upcomingBills: UpcomingBill[];
  upcomingBills7Days: UpcomingBill[];
  upcomingBills30Days: UpcomingBill[];
  sinkingFunds: SinkingFundItem[];
}

/**
 * Helper to format date into YYYY-MM-DD
 */
function toDateString(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Calculates upcoming bill occurrences, sinking funds, and dynamic safe-to-spend projection.
 */
export function calculateSafeToSpend({
  balance,
  recurringRules,
  savingsGoal = 0,
  referenceDate = new Date(),
  paydayDate = null,
}: SafeToSpendOptions): SafeToSpendResult {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1; // 1-indexed
  const currentDay = referenceDate.getDate();

  // Determine target end boundary (default: end of current calendar month)
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  const currentMonthEndDate = new Date(currentYear, currentMonth - 1, lastDayOfMonth, 23, 59, 59);

  let targetDate = currentMonthEndDate;
  if (paydayDate && paydayDate.getTime() > referenceDate.getTime()) {
    targetDate = paydayDate;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.max(
    1,
    Math.ceil((targetDate.getTime() - referenceDate.getTime()) / msPerDay)
  );

  const upcomingBills: UpcomingBill[] = [];
  const sinkingFunds: SinkingFundItem[] = [];

  // Filter active recurring expenses
  const activeExpenseRules = recurringRules.filter(
    (r) => r.type === 'expense' && r.is_active !== false
  );

  for (const rule of activeExpenseRules) {
    const isYearly = rule.recurrence_interval === 'yearly';
    const isProratedYearly = isYearly && (rule.yearly_calculation === 'prorated' || !rule.yearly_calculation);
    const ruleAmount = Number(rule.amount) || 0;

    if (isYearly) {
      // Parse start_date for anniversary month and day
      let startMonth = currentMonth;
      let startDay = rule.day_of_month || 1;

      if (rule.start_date) {
        const parts = rule.start_date.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          startMonth = parts[1];
          startDay = rule.day_of_month || parts[2] || 1;
        }
      }

      // Calculate next anniversary date
      let anniversaryYear = currentYear;
      const maxDaysInAnniversaryMonthThisYear = new Date(anniversaryYear, startMonth, 0).getDate();
      const clampedAnniversaryDayThisYear = Math.min(startDay, maxDaysInAnniversaryMonthThisYear);
      let anniversaryDateObj = new Date(anniversaryYear, startMonth - 1, clampedAnniversaryDayThisYear);

      // If anniversary this year has already passed (before today's calendar date)
      if (
        anniversaryDateObj.getFullYear() === currentYear &&
        (anniversaryDateObj.getMonth() + 1 < currentMonth ||
          (anniversaryDateObj.getMonth() + 1 === currentMonth && clampedAnniversaryDayThisYear < currentDay))
      ) {
        anniversaryYear += 1;
        const maxDaysNextYear = new Date(anniversaryYear, startMonth, 0).getDate();
        const clampedDayNextYear = Math.min(startDay, maxDaysNextYear);
        anniversaryDateObj = new Date(anniversaryYear, startMonth - 1, clampedDayNextYear);
      }

      const diffTime = anniversaryDateObj.getTime() - referenceDate.getTime();
      const daysUntilDue = Math.max(0, Math.ceil(diffTime / msPerDay));
      const monthsUntilDue = Math.max(
        0,
        (anniversaryDateObj.getFullYear() - currentYear) * 12 + (anniversaryDateObj.getMonth() + 1 - currentMonth)
      );

      const isDueThisMonth =
        anniversaryDateObj.getFullYear() === currentYear &&
        anniversaryDateObj.getMonth() + 1 === currentMonth;
      const isDueIn7Days = daysUntilDue >= 0 && daysUntilDue <= 7;
      const isDueIn30Days = daysUntilDue >= 0 && daysUntilDue <= 30;

      if (isDueThisMonth) {
        // In the anniversary month, the full annual bill becomes due
        upcomingBills.push({
          id: rule.id,
          description: rule.description,
          amount: ruleAmount,
          category: rule.category || null,
          dueDate: toDateString(
            anniversaryDateObj.getFullYear(),
            anniversaryDateObj.getMonth() + 1,
            anniversaryDateObj.getDate()
          ),
          dayOfMonth: anniversaryDateObj.getDate(),
          daysUntilDue,
          isDueIn7Days,
          isDueIn30Days,
          isDueThisMonth: true,
        });
      } else if (isProratedYearly) {
        // In non-anniversary months, prorate as a monthly sinking fund reserve
        const monthlyReserve = Math.round((ruleAmount / 12) * 100) / 100;
        sinkingFunds.push({
          id: rule.id,
          description: rule.description,
          annualAmount: ruleAmount,
          monthlyReserve,
          category: rule.category || null,
          anniversaryDate: toDateString(
            anniversaryDateObj.getFullYear(),
            anniversaryDateObj.getMonth() + 1,
            anniversaryDateObj.getDate()
          ),
          monthsUntilDue,
          daysUntilDue,
        });
      }
      // If yearly_calculation === 'exact' and !isDueThisMonth, $0 is reserved in this month
      continue;
    }

    // Monthly recurrence processing
    const desiredDay = rule.day_of_month || 1;

    let dueYear = currentYear;
    let dueMonth = currentMonth;

    const maxDaysThisMonth = new Date(dueYear, dueMonth, 0).getDate();
    const clampedDayThisMonth = Math.min(desiredDay, maxDaysThisMonth);
    let dueDay = clampedDayThisMonth;

    // If already passed in current month, next occurrence is next month
    if (clampedDayThisMonth < currentDay) {
      if (dueMonth === 12) {
        dueYear += 1;
        dueMonth = 1;
      } else {
        dueMonth += 1;
      }
      const maxDaysNextMonth = new Date(dueYear, dueMonth, 0).getDate();
      dueDay = Math.min(desiredDay, maxDaysNextMonth);
    }

    const dueDateObj = new Date(dueYear, dueMonth - 1, dueDay);
    const diffTime = dueDateObj.getTime() - referenceDate.getTime();
    const daysUntilDue = Math.ceil(diffTime / msPerDay);

    const isDueThisMonth = dueYear === currentYear && dueMonth === currentMonth;
    const isDueIn7Days = daysUntilDue >= 0 && daysUntilDue <= 7;
    const isDueIn30Days = daysUntilDue >= 0 && daysUntilDue <= 30;

    upcomingBills.push({
      id: rule.id,
      description: rule.description,
      amount: ruleAmount,
      category: rule.category || null,
      dueDate: toDateString(dueYear, dueMonth, dueDay),
      dayOfMonth: rule.day_of_month,
      daysUntilDue,
      isDueIn7Days,
      isDueIn30Days,
      isDueThisMonth,
    });
  }

  // Sort upcoming bills by dueDate ascending
  upcomingBills.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Sort sinking funds by anniversaryDate ascending
  sinkingFunds.sort((a, b) => a.anniversaryDate.localeCompare(b.anniversaryDate));

  const upcomingBills7Days = upcomingBills.filter((b) => b.isDueIn7Days);
  const upcomingBills30Days = upcomingBills.filter((b) => b.isDueIn30Days);
  const billsDueThisMonth = upcomingBills.filter((b) => b.isDueThisMonth);

  const totalUpcomingBillsThisMonth = billsDueThisMonth.reduce((sum, b) => sum + b.amount, 0);
  const totalUpcomingBills7Days = upcomingBills7Days.reduce((sum, b) => sum + b.amount, 0);
  const totalUpcomingBills30Days = upcomingBills30Days.reduce((sum, b) => sum + b.amount, 0);
  const totalSinkingFundsMonthly = sinkingFunds.reduce((sum, s) => sum + s.monthlyReserve, 0);

  const reservedCommitments = totalUpcomingBillsThisMonth + totalSinkingFundsMonthly + savingsGoal;
  const isDeficit = balance < reservedCommitments;
  const deficitAmount = isDeficit ? reservedCommitments - balance : 0;

  const safeToSpendTotal = Math.max(0, balance - reservedCommitments);
  const safeToSpendDaily = daysRemaining > 0 ? safeToSpendTotal / daysRemaining : 0;

  return {
    currentBalance: balance,
    totalUpcomingBillsThisMonth,
    totalUpcomingBills7Days,
    totalUpcomingBills30Days,
    totalSinkingFundsMonthly,
    savingsGoal,
    safeToSpendTotal,
    safeToSpendDaily,
    daysRemaining,
    targetEndDate: toDateString(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      targetDate.getDate()
    ),
    isDeficit,
    deficitAmount,
    upcomingBills,
    upcomingBills7Days,
    upcomingBills30Days,
    sinkingFunds,
  };
}
