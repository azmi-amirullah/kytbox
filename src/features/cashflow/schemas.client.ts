import * as z from 'zod/mini';

export {
  entryTypeSchema,
  entryCategorySchema,
  recurrenceIntervalSchema,
  yearlyCalculationSchema,
  shareRoleSchema,
  budgetExpenseCategorySchema,
  dateFilterPresetSchema,
  shareSchema,
} from '@/lib/validation.schemas.client';

export const budgetDtoSchema = z.object({
  id: z.string(),
  cashflow_id: z.string(),
  category: z.catch(z.string(), ''),
  amount: z.catch(z.number(), 0),
  period: z.catch(z.enum(['monthly']), 'monthly'),
});

export const budgetDtoListSchema = z.catch(z.array(budgetDtoSchema), []);
