import type { CashflowEntryDTO } from '@/types/dto';

export interface MonthlyData {
  month: string;
  monthKey: string;
  income: number;
  expense: number;
  balance: number;
}

/**
 * Aggregates cashflow entries by month for chart visualization.
 * Returns chronologically sorted monthly data with running cumulative balance.
 */
export function aggregateEntriesByMonth(
  entries: CashflowEntryDTO[],
): MonthlyData[] {
  if (entries.length === 0) return [];

  const monthMap = new Map<string, { income: number; expense: number }>();

  for (const entry of entries) {
    const [year, month] = entry.date.split('-');
    const key = `${year}-${month}`;

    const existing = monthMap.get(key) ?? { income: 0, expense: 0 };

    if (entry.type === 'income') {
      existing.income += Number(entry.amount);
    } else {
      existing.expense += Number(entry.amount);
    }

    monthMap.set(key, existing);
  }

  const sortedKeys = [...monthMap.keys()].sort();

  let runningBalance = 0;

  return sortedKeys.map((key) => {
    const data = monthMap.get(key)!;
    runningBalance += data.income - data.expense;

    const [year, month] = key.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    const label = date.toLocaleDateString('en-US', {
      month: 'short',
      year: sortedKeys.length > 12 ? '2-digit' : undefined,
    });

    return {
      month: label,
      monthKey: key,
      income: data.income,
      expense: data.expense,
      balance: runningBalance,
    };
  });
}
