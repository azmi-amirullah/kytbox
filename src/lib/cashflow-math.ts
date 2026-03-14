import type { CashflowEntryDTO, CashflowBudgetDTO } from '@/types/dto';

/**
 * Enriched recurring item with calculated projection metadata.
 */
export interface RecurringItemEnriched extends CashflowEntryDTO {
  monthlyEquivalent: number;
  projectedAmount: number;
  multiplierUnits: number;
}

/**
 * Result of the projection calculation.
 */
export interface ProjectionResult {
  settledCash: number;
  upcomingMonthlyExpenses: number;
  upcomingMonthlyIncome: number;
  projectedResult: number;
  recurringItems: RecurringItemEnriched[];
  nextMonthName: string;
}

/**
 * Result of the budget status calculation.
 */
export interface BudgetStatus {
  spent: number;
  pct: number;
  isOverBudget: boolean;
  isAtLimit: boolean;
  isWarning: boolean;
}

/**
 * Calculates a "Smart Projection" of cashflow through the end of the next month.
 * Factors in settled transactions and projects future recurring and one-time items.
 * 
 * @param entries - List of cashflow entries
 * @param today - Reference date (defaults to current system time)
 */
export function calculateProjections(
  entries: CashflowEntryDTO[],
  today: Date = new Date()
): ProjectionResult {
  let realizedIncome = 0;
  let realizedExpense = 0;
  let upcomingMonthlyExpenses = 0;
  let upcomingMonthlyIncome = 0;

  const todayDateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const nextMonthName = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1
  ).toLocaleDateString('en-US', { month: 'short' });

  const endOfThisMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  );

  const endOfNextMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 2,
    0
  );

  const recurringList: RecurringItemEnriched[] = [];

  for (const entry of entries) {
    const amount = Number(entry.amount);
    const [entryYear, entryMonth, entryDay] = entry.date
      .split('-')
      .map(Number);
    const entryDate = new Date(entryYear, entryMonth - 1, entryDay);
    
    // Future/Target items in our window
    const isProjectable = entryDate > todayDateOnly && entryDate <= endOfNextMonth;
    // Current/Past items
    const isSettled = entryDate <= todayDateOnly;

    if (isSettled) {
      if (entry.type === 'income') realizedIncome += amount;
      if (entry.type === 'expense') realizedExpense += amount;
    }

    if (entry.is_recurring) {
      let multiplier = 0;
      let monthlyEquivalent = 0;

      const isProrated =
        entry.recurrence_interval === 'yearly' &&
        (entry.yearly_calculation === 'prorated' || !entry.yearly_calculation);

      if (isProrated) {
        // --- ACCRUAL LOGIC (Preparation Model) ---
        // Calculate how many months have passed since the last anniversary up to end of next month
        const cycleStart = new Date(today.getFullYear(), entryMonth - 1, entryDay);
        if (cycleStart > today) {
          cycleStart.setFullYear(cycleStart.getFullYear() - 1);
        }

        const startYear = cycleStart.getFullYear();
        const startMonth = cycleStart.getMonth();
        const endYear = endOfNextMonth.getFullYear();
        const endMonth = endOfNextMonth.getMonth();

        const monthsCount = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
        multiplier = Math.max(0, monthsCount / 12);
        monthlyEquivalent = amount / 12;
      } else if (entry.recurrence_interval === 'monthly') {
        // --- CASHFLOW LOGIC ---
        const hasPassedThisMonth = today.getDate() >= entryDay;
        if (entryDate <= endOfThisMonth && !hasPassedThisMonth) multiplier += 1;
        if (entryDate <= endOfNextMonth) multiplier += 1;
        monthlyEquivalent = amount;
      } else {
        // --- EXACT YEARLY ---
        const nextAnniversary = new Date(
          today.getFullYear(),
          entryMonth - 1,
          entryDay
        );
        if (nextAnniversary < todayDateOnly) {
          nextAnniversary.setFullYear(today.getFullYear() + 1);
        }

        const nextMonthStart = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          1
        );

        if (nextAnniversary >= todayDateOnly && nextAnniversary <= endOfThisMonth) {
          multiplier += 1;
        } else if (nextAnniversary >= nextMonthStart && nextAnniversary <= endOfNextMonth) {
          multiplier += 1;
        }
        monthlyEquivalent = amount / 12;
      }

      const projectedAmount = amount * multiplier;
      if (entry.type === 'expense') {
        upcomingMonthlyExpenses += projectedAmount;
      } else {
        upcomingMonthlyIncome += projectedAmount;
      }

      recurringList.push({
        ...entry,
        monthlyEquivalent,
        projectedAmount,
        multiplierUnits: multiplier * (entry.recurrence_interval === 'yearly' ? 12 : 1),
      });
    } else if (isProjectable) {
      // One-time future transactions within our projection window
      if (entry.type === 'expense') {
        upcomingMonthlyExpenses += amount;
      } else {
        upcomingMonthlyIncome += amount;
      }
    }
  }

  const currentBalance = realizedIncome - realizedExpense;
  const realAvailableBalance = currentBalance - upcomingMonthlyExpenses + upcomingMonthlyIncome;

  return {
    settledCash: currentBalance,
    upcomingMonthlyExpenses,
    upcomingMonthlyIncome,
    projectedResult: realAvailableBalance,
    recurringItems: recurringList.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent),
    nextMonthName,
  };
}

/**
 * Calculates current month's budget status for a given category.
 * 
 * @param budget - The budget definition
 * @param entries - List of cashflow entries
 * @param now - Reference date (defaults to current system time)
 */
export function calculateBudgetStatus(
  budget: CashflowBudgetDTO,
  entries: CashflowEntryDTO[],
  now: Date = new Date()
): BudgetStatus {
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const spent = entries
    .filter((e) => {
      if (e.type !== 'expense') return false;
      if (e.category !== budget.category) return false;
      const [year, month] = e.date.split('-').map(Number);
      return year === currentYear && month - 1 === currentMonth;
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  
  // Compare raw amounts to avoid floating-point imprecision from percentage math.
  const isOverBudget = spent > budget.amount;
  const isAtLimit = !isOverBudget && pct >= 100;
  const isWarning = pct >= 80 && pct < 100;

  return {
    spent,
    pct,
    isOverBudget,
    isAtLimit,
    isWarning
  };
}
