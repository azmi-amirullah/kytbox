import { z } from 'zod';

export const adminUsersQuerySchema = z.object({
  search: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(10).max(100).catch(25),
});

export type AdminUsersQueryInput = z.infer<typeof adminUsersQuerySchema>;

export const adminTokenUsageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).catch(1),
  pageSize: z.coerce.number().int().min(10).max(100).catch(25),
});

export type AdminTokenUsageQueryInput = z.infer<typeof adminTokenUsageQuerySchema>;

export const adminTokenUsageHistoryQuerySchema = z.object({
  period: z.enum(['daily', 'monthly']).catch('daily'),
  page: z.coerce.number().int().min(1).max(1_000_000).catch(1),
  pageSize: z.coerce.number().int().min(10).max(100).catch(25),
});

export const adminTokenUsageUserIdSchema = z.string().uuid();

export type AdminTokenUsageHistoryQueryInput = z.infer<
  typeof adminTokenUsageHistoryQuerySchema
>;
