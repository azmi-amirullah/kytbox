import type { CashflowEntryDTO, CashflowChartAggregateDTO } from '@/types/dto';
import { formatCategoryName } from '../math';

export const CATEGORY_COLORS: Record<string, string> = {
  // Income
  Salary: 'oklch(0.65 0.2 145)', // Green
  Freelance: 'var(--chart-1)', // Orange/Rust
  Investment: 'var(--chart-2)', // Blue/Indigo

  // Expense
  Food: 'oklch(0.65 0.25 15)', // Coral Red
  Transport: 'oklch(0.75 0.2 80)', // Yellow/Amber
  'Utilities & Bills': 'oklch(0.65 0.15 210)', // Cyan/Teal
  Entertainment: 'oklch(0.6 0.15 300)', // Purple
  Shopping: 'oklch(0.7 0.15 40)', // Orange
  Health: 'oklch(0.6 0.15 250)', // Light Blue

  // Defaults
  Other: 'oklch(0.65 0.2 330)', // Pink
  Uncategorized: 'var(--muted-foreground)', // Dark Gray
};

export function aggregateEntriesByCategory(
  entries: Array<CashflowEntryDTO | CashflowChartAggregateDTO>,
  filterType: 'income' | 'expense' = 'expense',
) {
  const categoryTotals: Record<string, number> = {};

  entries.forEach((entry) => {
    if (entry.type !== filterType) return;

    const category = formatCategoryName(entry.category);
    const amount =
      'total_amount' in entry ? Number(entry.total_amount) : Number(entry.amount);
    categoryTotals[category] = (categoryTotals[category] || 0) + (amount || 0);
  });

  // Convert to array of objects for Recharts
  const data = Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value,
      fill:
        CATEGORY_COLORS[name] ||
        `var(--chart-${(Object.keys(categoryTotals).indexOf(name) % 5) + 1})`,
    }))
    .sort((a, b) => b.value - a.value); // Sort largest to smallest

  return data;
}
