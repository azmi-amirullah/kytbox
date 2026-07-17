import { z } from 'zod';
import {
  shareRoleSchema,
  recurrenceIntervalSchema,
  yearlyCalculationSchema,
  dtoShareRoleSchema,
} from '@/lib/validation.schemas';

export {
  shareRoleSchema,
  recurrenceIntervalSchema,
  yearlyCalculationSchema,
  dtoShareRoleSchema,
};

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
  recurrence_interval: recurrenceIntervalSchema.optional(),
  yearly_calculation: yearlyCalculationSchema.optional(),
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

