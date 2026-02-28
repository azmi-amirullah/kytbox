import * as z from 'zod/mini';

// Support (client components like StatusSelector)
export const ticketStatusSchema = z.catch(
  z.enum(['open', 'in_progress', 'resolved', 'closed']),
  'open',
);

// Bio (client components like DashboardClient, LinkModal)
export const bioTabSchema = z.catch(z.enum(['links', 'appearance']), 'links');
export const linkTypeSchema = z.catch(z.enum(['link', 'folder']), 'link');
export const entryTypeSchema = z.catch(
  z.enum(['income', 'expense']),
  'expense',
);

// Shared parsers for Supabase Json fields
export const socialLinksSchema = z.catch(z.record(z.string(), z.string()), {});

// Cashflow shares (server action boundary loses types)
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
