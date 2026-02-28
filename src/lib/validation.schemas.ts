import { z } from 'zod';

// Support
export const ticketStatusSchema = z
  .enum(['open', 'in_progress', 'resolved', 'closed'])
  .catch('open');
export const ticketCategorySchema = z
  .enum(['general', 'bug', 'billing', 'feature_request', 'account'])
  .catch('general');
export const userRoleSchema = z.enum(['admin', 'user']).catch('user');
export const adminRoleSchema = z.enum(['admin', 'user']).catch('user');

// Bio
export const bioTabSchema = z.enum(['links', 'appearance']).catch('links');

// Cashflow
export const shareRoleSchema = z
  .enum(['owner', 'edit', 'read', 'public'])
  .catch('read');
export const dtoShareRoleSchema = z
  .string()
  .transform((v): 'editor' | 'viewer' => (v === 'edit' ? 'editor' : 'viewer'));

// Shared parsers for Supabase Json fields
export const socialLinksSchema = z.record(z.string(), z.string()).catch({});
