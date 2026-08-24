import { z } from 'zod';

export const listTypeSchema = z.enum(['todo', 'wishlist', 'idea']);

export const listIdSchema = z.uuid({ message: 'Invalid list ID' });
export const listItemIdSchema = z.uuid({ message: 'Invalid item ID' });
export const listColumnIdSchema = z.uuid({ message: 'Invalid column ID' });

export const createListSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title too long'),
  type: listTypeSchema,
  description: z.string().max(500).optional().or(z.literal('')),
});

export const updateListSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500).optional().or(z.literal('')),
});

export const listColumnSchema = z.object({
  title: z.string().trim().min(1, 'Column name is required').max(50, 'Column name too long'),
});

export const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
  .nullable()
  .optional()
  .or(z.literal(''));

export const listItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300, 'Title too long'),
  description: z.string().max(1000).optional().or(z.literal('')),
  dueDate: dueDateSchema,
});

export const setDueDateSchema = z.object({
  itemId: listItemIdSchema,
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .nullable()
    .or(z.literal('')),
});

export const createListItemSchema = listItemSchema.extend({
  listId: listIdSchema,
  columnId: z.string().uuid().optional().or(z.literal('')),
});

export const updateListActionSchema = updateListSchema.extend({
  listId: listIdSchema,
});

export const toggleListPublicSchema = z.object({
  listId: listIdSchema,
  isPublic: z.boolean(),
});

export const updateItemActionSchema = listItemSchema.extend({
  itemId: listItemIdSchema,
});

export const toggleItemSchema = z.object({
  itemId: listItemIdSchema,
  isCompleted: z.boolean(),
});

export const reorderItemsSchema = z.object({
  listId: listIdSchema,
  itemIds: z
    .array(listItemIdSchema)
    .min(1)
    .max(500)
    .superRefine((itemIds, context) => {
      if (new Set(itemIds).size !== itemIds.length) {
        context.addIssue({
          code: 'custom',
          message: 'Item IDs must be unique',
        });
      }
    }),
});

export const moveItemSchema = z.object({
  itemId: listItemIdSchema,
  columnId: listColumnIdSchema,
  sortOrder: z.number().finite(),
  isDoneColumn: z.boolean(),
});

export const moveItemToListSchema = z.object({
  itemId: listItemIdSchema,
  targetListId: listIdSchema,
});

export const seedDefaultColumnsSchema = z.object({
  listId: listIdSchema,
});

export const addColumnActionSchema = listColumnSchema.extend({
  listId: listIdSchema,
});

export const updateColumnSchema = z.object({
  columnId: listColumnIdSchema,
  title: listColumnSchema.shape.title,
});

export const reorderColumnsSchema = z.object({
  listId: listIdSchema,
  columnIds: z
    .array(listColumnIdSchema)
    .min(1)
    .max(100)
    .superRefine((columnIds, context) => {
      if (new Set(columnIds).size !== columnIds.length) {
        context.addIssue({
          code: 'custom',
          message: 'Column IDs must be unique',
        });
      }
    }),
});

export const toggleDoneColumnSchema = z.object({
  columnId: listColumnIdSchema,
  isDoneColumn: z.boolean(),
});

export const wishlistMetadataSchema = z.object({
  price: z.coerce.number().nonnegative().nullable().catch(null),
  currency: z.string().max(3).nullable().catch(null),
  purchase_url: z.string().url().nullable().catch(null),
}).catch({ price: null, currency: null, purchase_url: null });

export const listItemMetadataSchema = z.record(z.string(), z.unknown()).catch({});

export const listSubtaskIdSchema = z.uuid({ message: 'Invalid subtask ID' });

export const subtaskTitleSchema = z
  .string()
  .trim()
  .min(1, 'Subtask title is required')
  .max(300, 'Subtask title too long');

export const createSubtaskSchema = z.object({
  itemId: listItemIdSchema,
  title: subtaskTitleSchema,
});

export const updateSubtaskTitleSchema = z.object({
  subtaskId: listSubtaskIdSchema,
  title: subtaskTitleSchema,
});

export const toggleSubtaskSchema = z.object({
  subtaskId: listSubtaskIdSchema,
  isCompleted: z.boolean(),
});

export const deleteSubtaskSchema = z.object({
  subtaskId: listSubtaskIdSchema,
});

export const reorderSubtasksSchema = z.object({
  itemId: listItemIdSchema,
  subtaskIds: z
    .array(listSubtaskIdSchema)
    .min(1)
    .max(200)
    .superRefine((subtaskIds, context) => {
      if (new Set(subtaskIds).size !== subtaskIds.length) {
        context.addIssue({
          code: 'custom',
          message: 'Subtask IDs must be unique',
        });
      }
    }),
});

