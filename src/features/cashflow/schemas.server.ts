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

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, 'Invalid calendar date');

export const cashflowSplitItemSchema = z.object({
  itemName: z.string().trim().min(1, 'Item name is required'),
  category: z.string().trim().nullable().optional(),
  amount: z.coerce.number().positive('Item amount must be positive'),
});

export const cashflowEntrySchema = z.object({
  goalId: z.uuid({ message: 'Invalid goal ID' }).optional(),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category: z.string().nullable().optional(),
  date: dateOnlySchema,
  is_recurring: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
  recurrence_interval: recurrenceIntervalSchema.optional(),
  yearly_calculation: yearlyCalculationSchema.optional(),
  itemsJson: z.string().optional().nullable(),
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

export const cashflowGoalSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title too long'),
  targetAmount: z.coerce.number().positive('Target amount must be positive'),
  deadline: dateOnlySchema
    .nullable()
    .optional(),
});

export const updateCashflowGoalSchema = cashflowGoalSchema.extend({
  goalId: z.uuid({ message: 'Invalid goal ID' }),
});

export const deleteCashflowGoalSchema = z.object({
  goalId: z.uuid({ message: 'Invalid goal ID' }),
});

export function getGoalEntryValidationError(
  type: 'income' | 'expense',
  category: string | null | undefined,
): string | null {
  if (!category?.startsWith('Goal:')) return null;
  if (category.slice('Goal:'.length).trim().length === 0) {
    return 'A savings goal must have a name';
  }
  if (type !== 'expense') {
    return 'Savings goal entries must be expenses';
  }
  return null;
}

export function shouldPreserveExistingGoalRelation(input: {
  existingGoalId: string | null | undefined;
  requestedGoalId: string | undefined;
  category: string | null | undefined;
  type: 'income' | 'expense';
}): boolean {
  return (
    input.type === 'expense' &&
    input.category == null &&
    input.existingGoalId != null &&
    input.requestedGoalId === input.existingGoalId
  );
}
