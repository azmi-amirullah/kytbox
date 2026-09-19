import * as z from 'zod/mini';

export const listTypeClientSchema = z.catch(
  z.enum(['todo', 'wishlist', 'idea']),
  'todo'
);

export const listItemMetadataClientSchema = z.catch(
  z.record(z.string(), z.unknown()),
  {}
);

export const wishlistClaimClientSchema = z.catch(
  z.union([
    z.object({
      claimed_by_name: z.string(),
      claimed_at: z.string(),
      claim_token: z.optional(z.string()),
      note: z.optional(z.union([z.string(), z.null()])),
    }),
    z.null(),
  ]),
  null
);

export const wishlistMetadataClientSchema = z.catch(
  z.object({
    price: z.catch(z.union([z.number(), z.null()]), null),
    currency: z.catch(z.union([z.string(), z.null()]), null),
    purchase_url: z.catch(z.union([z.string(), z.null()]), null),
    claim: wishlistClaimClientSchema,
  }),
  { price: null, currency: null, purchase_url: null, claim: null }
);

export const listItemPriorityClientSchema = z.catch(
  z.union([
    z.literal('urgent'),
    z.literal('high'),
    z.literal('medium'),
    z.literal('low'),
    z.null(),
  ]),
  null
);

export const listItemRecurrenceClientSchema = z.catch(
  z.union([
    z.literal('daily'),
    z.literal('weekdays'),
    z.literal('weekly'),
    z.literal('monthly'),
    z.null(),
  ]),
  null
);

export const listLabelsClientSchema = z.catch(
  z.array(z.string()),
  []
);


