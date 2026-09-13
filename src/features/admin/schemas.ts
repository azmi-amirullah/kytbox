import { z } from 'zod';

export const adminUsersQuerySchema = z.object({
  search: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(10).max(100).catch(25),
});

export type AdminUsersQueryInput = z.infer<typeof adminUsersQuerySchema>;
