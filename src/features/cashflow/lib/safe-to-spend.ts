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
 * Calculates upcoming bill occurrences and dynamic safe-to-spend projection.
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

  // Filter active recurring expenses
  const activeExpenseRules = recurringRules.filter(
    (r) => r.type === 'expense' && r.is_active !== false
  );

  for (const rule of activeExpenseRules) {
    const desiredDay = rule.day_of_month || 1;

    // 1. Check current month occurrence
    let dueYear = currentYear;
    let dueMonth = currentMonth;

    // Days in current month for this rule
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
      amount: Number(rule.amount) || 0,
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

  const upcomingBills7Days = upcomingBills.filter((b) => b.isDueIn7Days);
  const upcomingBills30Days = upcomingBills.filter((b) => b.isDueIn30Days);
  const billsDueThisMonth = upcomingBills.filter((b) => b.isDueThisMonth);

  const totalUpcomingBillsThisMonth = billsDueThisMonth.reduce((sum, b) => sum + b.amount, 0);
  const totalUpcomingBills7Days = upcomingBills7Days.reduce((sum, b) => sum + b.amount, 0);
  const totalUpcomingBills30Days = upcomingBills30Days.reduce((sum, b) => sum + b.amount, 0);

  const reservedCommitments = totalUpcomingBillsThisMonth + savingsGoal;
  const isDeficit = balance < reservedCommitments;
  const deficitAmount = isDeficit ? reservedCommitments - balance : 0;

  const safeToSpendTotal = Math.max(0, balance - reservedCommitments);
  const safeToSpendDaily = daysRemaining > 0 ? safeToSpendTotal / daysRemaining : 0;

  return {
    currentBalance: balance,
    totalUpcomingBillsThisMonth,
    totalUpcomingBills7Days,
    totalUpcomingBills30Days,
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
  };
}
