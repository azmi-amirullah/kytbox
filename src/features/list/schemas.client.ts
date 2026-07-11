import * as z from 'zod/mini';

export const listTypeClientSchema = z.catch(
  z.enum(['todo', 'wishlist', 'idea']),
  'todo'
);

export const listItemMetadataClientSchema = z.catch(
  z.record(z.string(), z.unknown()),
  {}
);

export const wishlistMetadataClientSchema = z.catch(
  z.object({
    price: z.catch(z.union([z.number(), z.null()]), null),
    currency: z.catch(z.union([z.string(), z.null()]), null),
    purchase_url: z.catch(z.union([z.string(), z.null()]), null),
  }),
  { price: null, currency: null, purchase_url: null }
);
