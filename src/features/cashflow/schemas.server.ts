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
  recurring_rule_id: z.uuid({ message: 'Invalid recurring rule ID' }).optional().nullable(),
  update_recurring_rule: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
  recurrence_interval: recurrenceIntervalSchema.optional(),
  yearly_calculation: yearlyCalculationSchema.optional(),
  itemsJson: z.string().optional().nullable(),
  receiptAction: z.enum(['keep', 'remove', 'upload']).optional().default('keep'),
  tagsJson: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return []
      try {
        const parsed = JSON.parse(val)
        if (!Array.isArray(parsed)) return []
        return parsed
          .map((t: unknown) => (typeof t === 'string' ? t.trim() : ''))
          .filter((t) => t.length > 0 && t.length <= 30)
          .slice(0, 10)
      } catch {
        return []
      }
    }),
  original_currency: z.string().trim().max(10).optional().nullable(),
  original_amount: z.coerce.number().positive('Original amount must be positive').optional().nullable(),
  exchange_rate: z.coerce.number().positive('Exchange rate must be positive').optional().default(1),
});

export const cashflowRecurringRuleSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  goalId: z.uuid({ message: 'Invalid goal ID' }).optional().nullable(),
  description: z.string().trim().min(1, 'Description is required').max(255, 'Description too long'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category: z.string().trim().max(100, 'Category too long').nullable().optional(),
  recurrence_interval: recurrenceIntervalSchema.optional().default('monthly'),
  yearly_calculation: yearlyCalculationSchema.optional().nullable(),
  day_of_month: z.coerce.number().int().min(1).max(31).optional().default(1),
  is_active: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional().default(true),
  start_date: dateOnlySchema.optional(),
});

export const updateCashflowRecurringRuleSchema = cashflowRecurringRuleSchema.extend({
  ruleId: z.uuid({ message: 'Invalid recurring rule ID' }),
});

export const toggleCashflowRecurringRuleSchema = z.object({
  ruleId: z.uuid({ message: 'Invalid recurring rule ID' }),
  is_active: z.boolean(),
});

export const deleteCashflowRecurringRuleSchema = z.object({
  ruleId: z.uuid({ message: 'Invalid recurring rule ID' }),
});

export const updateCashflowEntrySchema = cashflowEntrySchema.extend({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
});

export const getReceiptSignedUrlSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  entryId: z.uuid({ message: 'Invalid entry ID' }),
});

export const getGoalImageSignedUrlSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  goalId: z.uuid({ message: 'Invalid goal ID' }),
});

export const cashflowBudgetSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  enable_rollover: z
    .preprocess((val) => val === 'true' || val === true || val === '1', z.boolean())
    .optional()
    .default(false),
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
  initialAmount: z.coerce.number().min(0, 'Initial amount must be non-negative').optional().default(0),
  type: z.enum(['savings', 'debt', 'lent']).optional().default('savings'),
  deadline: dateOnlySchema
    .nullable()
    .optional(),
  imageAction: z.enum(['keep', 'remove', 'upload']).optional().default('keep'),
});

export const updateCashflowGoalSchema = cashflowGoalSchema.extend({
  goalId: z.uuid({ message: 'Invalid goal ID' }),
});

export const deleteCashflowGoalSchema = z.object({
  goalId: z.uuid({ message: 'Invalid goal ID' }),
});
export const archiveCashflowGoalSchema = deleteCashflowGoalSchema;
export const unarchiveCashflowGoalSchema = deleteCashflowGoalSchema;

export function getGoalEntryValidationError(
  type: 'income' | 'expense',
  category: string | null | undefined,
): string | null {
  if (!category) return null;
  const isGoal = category.startsWith('Goal:');
  const isDebt = category.startsWith('Debt:');
  const isLent = category.startsWith('Lent:');
  if (!isGoal && !isDebt && !isLent) return null;

  const prefix = isGoal ? 'Goal:' : isDebt ? 'Debt:' : 'Lent:';
  if (category.slice(prefix.length).trim().length === 0) {
    if (isLent) return 'A lent target must have a name';
    return isDebt ? 'A debt target must have a name' : 'A savings goal must have a name';
  }
  if (isLent) {
    if (type !== 'income') {
      return 'Lent repayments must be income entries';
    }
  } else if (type !== 'expense') {
    return isDebt ? 'Debt payments must be expenses' : 'Savings goal entries must be expenses';
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
    (input.type === 'expense' || input.type === 'income') &&
    input.category == null &&
    input.existingGoalId != null &&
    input.requestedGoalId === input.existingGoalId
  );
}

export const importCashflowEntryItemSchema = z.object({
  date: dateOnlySchema,
  description: z.string().trim().min(1, 'Description is required').max(255, 'Description too long'),
  amount: z.coerce.number().positive('Amount must be positive').max(1_000_000_000, 'Amount exceeds maximum limit'),
  type: z.enum(['income', 'expense']),
  category: z.string().trim().max(50, 'Category too long').nullable().optional(),
});

export const importCashflowEntriesSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  entries: z
    .array(importCashflowEntryItemSchema)
    .min(1, 'At least one transaction is required')
    .max(1000, 'Maximum 1,000 transactions per import batch'),
});

export type ImportCashflowEntryItem = z.infer<typeof importCashflowEntryItemSchema>;
export type ImportCashflowEntriesInput = z.infer<typeof importCashflowEntriesSchema>;

export const renameCashflowTagSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  oldTag: z.string().trim().min(1, 'Old tag is required').max(30, 'Tag too long'),
  newTag: z.string().trim().min(1, 'New tag is required').max(30, 'Tag too long'),
});

export const deleteCashflowTagSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  tag: z.string().trim().min(1, 'Tag is required').max(30, 'Tag too long'),
});

export type RenameCashflowTagInput = z.infer<typeof renameCashflowTagSchema>;
export type DeleteCashflowTagInput = z.infer<typeof deleteCashflowTagSchema>;

export const toggleCashflowPinSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  isPinned: z.boolean(),
});

export const archiveCashflowSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
});

export const restoreCashflowSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
});

export const bulkDeleteCashflowEntriesSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  entryIds: z
    .array(z.uuid({ message: 'Invalid entry ID' }))
    .min(1, 'At least one entry must be selected')
    .max(100, 'Maximum 100 entries per batch'),
});

export const bulkUpdateCashflowCategorySchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  entryIds: z
    .array(z.uuid({ message: 'Invalid entry ID' }))
    .min(1, 'At least one entry must be selected')
    .max(100, 'Maximum 100 entries per batch'),
  category: z
    .string()
    .trim()
    .max(50, 'Category too long')
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export const bulkAddCashflowTagsSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  entryIds: z
    .array(z.uuid({ message: 'Invalid entry ID' }))
    .min(1, 'At least one entry must be selected')
    .max(100, 'Maximum 100 entries per batch'),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Tag cannot be empty')
        .max(30, 'Tag too long')
        .transform((t) => t.replace(/^#/, '').trim()),
    )
    .min(1, 'At least one tag required')
    .max(10, 'Maximum 10 tags per batch'),
});

export type BulkDeleteCashflowEntriesInput = z.infer<typeof bulkDeleteCashflowEntriesSchema>;
export type BulkUpdateCashflowCategoryInput = z.infer<typeof bulkUpdateCashflowCategorySchema>;
export type BulkAddCashflowTagsInput = z.infer<typeof bulkAddCashflowTagsSchema>;

export const createSplitGroupSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title too long'),
  currency: z.string().trim().min(2).max(10).optional().default('USD'),
  pin: z.string().trim().min(4).max(20).optional().nullable(),
  honeypot: z.string().max(0, 'Bot detected').optional().default(''),
});

export const splitExpenseSchema = z.object({
  groupId: z.uuid({ message: 'Invalid group ID' }),
  deviceToken: z.string().trim().min(1, 'Device token is required'),
  description: z.string().trim().min(1, 'Description is required').max(200, 'Description too long'),
  amount: z.coerce.number().positive('Amount must be positive'),
  paid_by: z.string().trim().min(1, 'Payer is required').max(50, 'Payer name too long'),
  split_between: z.array(z.string().trim().min(1).max(50)).min(1, 'At least one participant required'),
  is_settlement: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
  honeypot: z.string().max(0, 'Bot detected').optional().default(''),
});

export type CreateSplitGroupInput = z.infer<typeof createSplitGroupSchema>;
export type SplitExpenseInput = z.infer<typeof splitExpenseSchema>;


