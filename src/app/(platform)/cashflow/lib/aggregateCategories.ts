import type { CashflowEntryDTO } from '@/types/dto';

const CATEGORY_COLORS: Record<string, string> = {
  // Income
  Salary: 'oklch(0.65 0.2 145)', // Green
  Freelance: 'var(--chart-1)', // Orange/Rust
  Investment: 'var(--chart-2)', // Blue/Indigo

  // Expense
  'Food & Dining': 'oklch(0.65 0.25 15)', // Coral Red
  Transportation: 'oklch(0.75 0.2 80)', // Yellow/Amber
  'Utilities & Bills': 'oklch(0.65 0.15 210)', // Cyan/Teal
  Entertainment: 'oklch(0.6 0.15 300)', // Purple
  Shopping: 'oklch(0.7 0.15 40)', // Orange
  'Health & Fitness': 'oklch(0.6 0.15 250)', // Light Blue

  // Defaults
  Other: 'oklch(0.65 0.2 330)', // Pink
  Uncategorized: 'var(--muted-foreground)', // Dark Gray
};

export function aggregateEntriesByCategory(
  entries: CashflowEntryDTO[],
  filterType: 'income' | 'expense' = 'expense',
) {
  const categoryTotals: Record<string, number> = {};

  entries.forEach((entry) => {
    if (entry.type !== filterType) return;

    // Treat null or empty string as 'Uncategorized' for display
    let category = entry.category || 'Uncategorized';
    // Format label logic (could be done in UI, but easier here)
    if (category === 'other') category = 'Other';
    else if (category === 'uncategorized') category = 'Uncategorized';
    else {
      // Capitalize first letter
      category = category.charAt(0).toUpperCase() + category.slice(1);
      // Replace some special keys for better UI
      if (category.toLowerCase() === 'food') category = 'Food & Dining';
      if (category.toLowerCase() === 'transport') category = 'Transportation';
      if (category.toLowerCase() === 'utilities')
        category = 'Utilities & Bills';
      if (category.toLowerCase() === 'health') category = 'Health & Fitness';
    }

    categoryTotals[category] = (categoryTotals[category] || 0) + entry.amount;
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
