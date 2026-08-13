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

export const splitItemDtoSchema = z.object({
  id: z.string(),
  parent_entry_id: z.string(),
  item_name: z.catch(z.string(), ''),
  category: z.catch(z.union([z.string(), z.null()]), null),
  amount: z.catch(z.number(), 0),
});

export const splitItemDtoListSchema = z.catch(z.array(splitItemDtoSchema), []);
