import { z } from 'zod';

export const shareRoleSchema = z
  .enum(['owner', 'edit', 'read', 'public'])
  .catch('read');

export const recurrenceIntervalSchema = z.enum(['monthly', 'yearly']).nullable();

export const yearlyCalculationSchema = z.enum(['prorated', 'exact']).nullable();

export const dtoShareRoleSchema = z
  .string()
  .transform((v): 'editor' | 'viewer' => (v === 'edit' ? 'editor' : 'viewer'));

export const cashflowEntrySchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  is_recurring: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
  recurrence_interval: z.enum(['monthly', 'yearly']).nullable().optional(),
  yearly_calculation: z.enum(['prorated', 'exact']).nullable().optional(),
});

export const updateCashflowEntrySchema = cashflowEntrySchema.extend({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
});

export const cashflowBudgetSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
});

export const deleteCashflowBudgetSchema = z.object({
  budgetId: z.uuid({ message: 'Invalid budget ID' }),
});

export const generateRecurringSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  targetYear: z.number().int().min(2000).max(2100).optional(),
  targetMonth: z.number().int().min(0).max(11).optional(),
  generatePast: z.boolean().optional(),
});

