/**
 * Canonical expense categories available in Cashflow.
 */
export const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food', color: 'oklch(0.65 0.25 15)' },
  { value: 'transport', label: 'Transport', color: 'oklch(0.75 0.2 80)' },
  { value: 'utilities', label: 'Utilities & Bills', color: 'oklch(0.65 0.15 210)' },
  { value: 'entertainment', label: 'Entertainment', color: 'oklch(0.6 0.15 300)' },
  { value: 'shopping', label: 'Shopping', color: 'oklch(0.7 0.15 40)' },
  { value: 'health', label: 'Health', color: 'oklch(0.6 0.15 250)' },
  { value: 'other', label: 'Other Expense', color: 'oklch(0.65 0.2 330)' },
] as const;

/**
 * Canonical income categories available in Cashflow.
 */
export const INCOME_CATEGORIES = [
  { value: 'salary', label: 'Salary', color: 'oklch(0.65 0.2 145)' },
  { value: 'freelance', label: 'Freelance', color: 'var(--chart-1)' },
  { value: 'investment', label: 'Investment', color: 'var(--chart-2)' },
  { value: 'other', label: 'Other Income', color: 'oklch(0.65 0.2 330)' },
] as const;

export type ExpenseCategoryValue = (typeof EXPENSE_CATEGORIES)[number]['value'];
export type IncomeCategoryValue = (typeof INCOME_CATEGORIES)[number]['value'];
export type CashflowCategoryValue = ExpenseCategoryValue | IncomeCategoryValue;

/**
 * Fast lookup map for category value -> display label.
 */
export const CATEGORY_LABEL_MAP: Record<string, string> = {
  ...Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.value, c.label])),
  ...Object.fromEntries(INCOME_CATEGORIES.map((c) => [c.value, c.label])),
  other: 'Other',
  uncategorized: 'Uncategorized',
};

/**
 * Fast lookup map for category label -> chart color.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  ...Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.label, c.color])),
  ...Object.fromEntries(INCOME_CATEGORIES.map((c) => [c.label, c.color])),
  Other: 'oklch(0.65 0.2 330)',
  Uncategorized: 'var(--muted-foreground)',
};

/**
 * Formats a category slug into its standardized display label.
 */
export function formatCategoryName(category: string | null | undefined): string {
  if (!category) return 'Uncategorized';
  const slug = category.trim().toLowerCase();
  if (slug === 'food') return 'Food';
  if (slug === 'transport') return 'Transport';
  if (slug === 'utilities') return 'Utilities & Bills';
  if (slug === 'health') return 'Health';
  if (slug === 'entertainment') return 'Entertainment';
  if (slug === 'shopping') return 'Shopping';
  if (slug === 'salary') return 'Salary';
  if (slug === 'freelance') return 'Freelance';
  if (slug === 'investment') return 'Investment';
  if (slug === 'other') return 'Other';
  if (slug === 'uncategorized') return 'Uncategorized';
  return CATEGORY_LABEL_MAP[slug] || (category.charAt(0).toUpperCase() + category.slice(1));
}

/**
 * Checks if a tag duplicates the category (exact match, singular/plural, or label words).
 * e.g., if category is "transport", tags like "Transport", "transports", "transport" return true.
 * e.g., if category is "utilities", tags like "Utilities", "Utility", "Bills", "Bill" return true.
 */
export function isTagDuplicateOfCategory(
  tag: string,
  category: string | null | undefined,
): boolean {
  if (!tag || !category) return false;
  const tagClean = tag.trim().replace(/^#/, '').toLowerCase();
  if (!tagClean) return false;

  const catSlug = category.trim().toLowerCase();
  if (!catSlug) return false;

  // Direct slug match (e.g. "transport" === "transport")
  if (tagClean === catSlug) return true;

  // Plural/singular checks (e.g. "transports" <-> "transport", "utilities" <-> "utility")
  if (
    tagClean === `${catSlug}s` ||
    `${tagClean}s` === catSlug ||
    (catSlug.endsWith('ies') && tagClean === catSlug.slice(0, -3) + 'y') ||
    (tagClean.endsWith('ies') && catSlug === tagClean.slice(0, -3) + 'y')
  ) {
    return true;
  }

  // Check against category display label words (e.g. "Utilities & Bills" -> "utilities", "bills", "bill")
  const label = formatCategoryName(category).toLowerCase();
  const labelWords = label
    .split(/[\s&,/]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3);

  for (const word of labelWords) {
    if (
      tagClean === word ||
      tagClean === `${word}s` ||
      `${tagClean}s` === word ||
      (word.endsWith('ies') && tagClean === word.slice(0, -3) + 'y') ||
      (tagClean.endsWith('ies') && word === tagClean.slice(0, -3) + 'y')
    ) {
      return true;
    }
  }

  return false;
}

