import { z } from 'zod';

export const adminUserSearchClientSchema = z.object({
  search: z.string().trim().max(100).optional(),
});

export type AdminUserSearchClientInput = z.infer<typeof adminUserSearchClientSchema>;
