import { z } from 'zod';

export const ticketStatusSchema = z
  .enum(['open', 'in_progress', 'resolved', 'closed'])
  .catch('open');

export const ticketCategorySchema = z
  .enum(['general', 'bug', 'billing', 'feature_request', 'account'])
  .catch('general');

export const supportTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.enum(['general', 'bug', 'billing', 'feature_request', 'account']),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const replyTicketSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

export const userRoleSchema = z.enum(['admin', 'user']).catch('user');
