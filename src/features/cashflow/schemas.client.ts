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

export interface ParsedCsvRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'unselected';
  category: string | null;
  rawCategory?: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  selected: boolean;
}

export const bulkDeleteClientSchema = z.object({
  cashflowId: z.string(),
  entryIds: z.array(z.string()),
});

export const bulkUpdateCategoryClientSchema = z.object({
  cashflowId: z.string(),
  entryIds: z.array(z.string()),
  category: z.optional(z.nullable(z.string())),
});

export const bulkAddTagsClientSchema = z.object({
  cashflowId: z.string(),
  entryIds: z.array(z.string()),
  tags: z.array(z.string()),
});

