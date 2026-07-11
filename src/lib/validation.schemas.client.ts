import * as z from 'zod/mini';

/**
 * CLIENT-SIDE SCHEMAS (zod/mini)
 * Used for runtime validation and type narrowing in Client Components.
 * Follows the "Ruthless Mentor" protocol: Never write manual ternary chains or typeof guards.
 * Use .catch(default) for all enum-like or relational values from DB/API.
 *
 * NOTE: zod/mini API is extremely restricted.
 * - Use z.union([S, z.null()]) instead of .nullable()
 * - Use z.catch(S, default) instead of .default()
 * - No .preprocess(), .refine(), or .transform()
 */

// ==========================================
// SUPPORT
// ==========================================

export const ticketStatusSchema = z.catch(
  z.enum(['open', 'in_progress', 'resolved', 'closed']),
  'open',
);

export const ticketCategorySchema = z.catch(
  z.enum(['general', 'bug', 'billing', 'feature_request', 'account']),
  'general',
);

// ==========================================
// BIO
// ==========================================

export const bioTabSchema = z.catch(z.enum(['links', 'appearance']), 'links');
export const linkTypeSchema = z.catch(z.enum(['link', 'folder']), 'link');
export const linkAnimationSchema = z.catch(
  z.enum(['none', 'pulse', 'bounce', 'glow']),
  'none',
);

// ==========================================
// CASHFLOW
// ==========================================

export const entryTypeSchema = z.catch(
  z.enum(['income', 'expense']),
  'expense',
);

export const entryCategorySchema = z.catch(
  z.union([z.string(), z.null()]),
  null,
);

export const recurrenceIntervalSchema = z.catch(
  z.enum(['monthly', 'yearly']),
  'monthly',
);

export const yearlyCalculationSchema = z.catch(
  z.enum(['prorated', 'exact']),
  'prorated',
);

export const shareRoleSchema = z.catch(
  z.enum(['owner', 'edit', 'read', 'public']),
  'read',
);

export const budgetExpenseCategorySchema = z.catch(
  z.enum([
    'food',
    'transport',
    'utilities',
    'entertainment',
    'shopping',
    'health',
    'other',
  ]),
  'other',
);

export const dateFilterPresetSchema = z.catch(
  z.enum(['all-time', 'this-month', 'last-month', 'last-3-months', 'custom']),
  'all-time',
);

// ==========================================
// SHARED / JSON FIELDS
// ==========================================

export const socialLinksSchema = z.catch(z.record(z.string(), z.string()), {});
export const customThemeSchema = z.catch(z.record(z.string(), z.string()), {});

/**
 * Share Schema for collections of share objects.
 * Required by ShareModal.tsx to define the Share type and parse results from getShares().
 */
export const shareSchema = z.catch(
  z.array(
    z.object({
      id: z.string(),
      cashflow_id: z.string(),
      email: z.string(),
      role: z.string(),
      created_at: z.string(),
      created_via_public_access: z.union([z.boolean(), z.null()]),
      is_included_in_totals: z.union([z.boolean(), z.null()]),
      is_pinned: z.union([z.boolean(), z.null()]),
    }),
  ),
  [],
);

export const linkDtoSchema = z.object({
  id: z.string(),
  title: z.catch(z.string(), ''),
  url: z.catch(z.string(), '#'),
  is_active: z.catch(z.boolean(), true),
  sort_order: z.catch(z.number(), 0),
  is_folder: z.catch(z.boolean(), false),
  parent_id: z.catch(z.union([z.string(), z.null()]), null),
  clicks: z.catch(z.union([z.number(), z.null()]), null),
  animation_type: z.catch(z.union([z.string(), z.null()]), null),
  child_count: z.catch(z.number(), 0),
});

export const linkDtoListSchema = z.catch(z.array(linkDtoSchema), []);

// Compatibility aliases
export const rawLinkSchema = linkDtoSchema;
export const rawLinkListSchema = linkDtoListSchema;

export const linkActionResponseSchema = z.object({
  success: z.boolean(),
  link: z.union([linkDtoSchema, z.null()]),
  newCount: z.catch(z.union([z.number(), z.null()]), null),
  error: z.catch(z.union([z.string(), z.null()]), null),
});

export const budgetDtoSchema = z.object({
  id: z.string(),
  cashflow_id: z.string(),
  category: z.catch(z.string(), ''),
  amount: z.catch(z.number(), 0),
  period: z.catch(z.enum(['monthly']), 'monthly'),
});

export const budgetDtoListSchema = z.catch(z.array(budgetDtoSchema), []);

// ==========================================
// LIST
// ==========================================

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
