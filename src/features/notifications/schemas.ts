import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'support_reply',
  'budget_warning',
  'budget_exceeded',
  'click_milestone',
  'system',
]);

export const markAsReadSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});

export const createNotificationSchema = z.object({
  userId: z.string().uuid('Invalid target user ID'),
  type: notificationTypeSchema,
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().optional(),
  linkUrl: z.string().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
