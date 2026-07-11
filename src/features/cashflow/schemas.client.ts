import * as z from 'zod/mini';

export const entryTypeSchema = z.catch(
  z.enum(['income', 'expense']),
  'expense',
);

export const entryCategorySchema = z.catch(
  z.union([z.string(), z.null()]),
  null,
);

export const recurrenceIntervalSchema = z.catch(
  z.enum(['monthly', 'yearly']),
  'monthly',
);

export const yearlyCalculationSchema = z.catch(
  z.enum(['prorated', 'exact']),
  'prorated',
);

export const shareRoleSchema = z.catch(
  z.enum(['owner', 'edit', 'read', 'public']),
  'read',
);

export const budgetExpenseCategorySchema = z.catch(
  z.enum([
    'food',
    'transport',
    'utilities',
    'entertainment',
    'shopping',
    'health',
    'other',
  ]),
  'other',
);

export const dateFilterPresetSchema = z.catch(
  z.enum(['all-time', 'this-month', 'last-month', 'last-3-months', 'custom']),
  'all-time',
);

export const shareSchema = z.catch(
  z.array(
    z.object({
      id: z.string(),
      cashflow_id: z.string(),
      email: z.string(),
      role: z.string(),
      created_at: z.string(),
      created_via_public_access: z.union([z.boolean(), z.null()]),
      is_included_in_totals: z.union([z.boolean(), z.null()]),
      is_pinned: z.union([z.boolean(), z.null()]),
    }),
  ),
  [],
);

export const budgetDtoSchema = z.object({
  id: z.string(),
  cashflow_id: z.string(),
  category: z.catch(z.string(), ''),
  amount: z.catch(z.number(), 0),
  period: z.catch(z.enum(['monthly']), 'monthly'),
});

export const budgetDtoListSchema = z.catch(z.array(budgetDtoSchema), []);
