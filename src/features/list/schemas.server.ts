import { z } from 'zod';

export const listTypeSchema = z.enum(['todo', 'wishlist', 'idea']);

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

export const listItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300, 'Title too long'),
  description: z.string().max(1000).optional().or(z.literal('')),
});

export const createListItemSchema = listItemSchema.extend({
  listId: z.uuid({ message: 'Invalid list ID' }),
  columnId: z.string().uuid().optional().or(z.literal('')),
});

export const wishlistMetadataSchema = z.object({
  price: z.coerce.number().nonnegative().nullable().catch(null),
  currency: z.string().max(3).nullable().catch(null),
  purchase_url: z.string().url().nullable().catch(null),
}).catch({ price: null, currency: null, purchase_url: null });

export const listItemMetadataSchema = z.record(z.string(), z.unknown()).catch({});
