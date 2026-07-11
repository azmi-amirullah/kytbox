import * as z from 'zod/mini';

export const ticketStatusSchema = z.catch(
  z.enum(['open', 'in_progress', 'resolved', 'closed']),
  'open',
);

export const ticketCategorySchema = z.catch(
  z.enum(['general', 'bug', 'billing', 'feature_request', 'account']),
  'general',
);

export const userRoleSchema = z.catch(
  z.enum(['admin', 'user']),
  'user',
);
