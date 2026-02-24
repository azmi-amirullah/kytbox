import { z } from 'zod';

// ==========================================
// AUTH SCHEMAS
// ==========================================

export const loginSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
});

export const forgotPasswordSchema = z
  .object({
    email: z
      .email({ message: 'Invalid email address' })
      .optional()
      .or(z.literal('')),
    username: z.string().optional().or(z.literal('')),
  })
  .refine((data) => data.email || data.username, {
    message: 'Either email or username is required',
    path: ['email'],
  });

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ==========================================
// SETTINGS SCHEMAS
// ==========================================

export const updateProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  displayName: z.string().min(1, 'Display name is required'),
  bio: z
    .string()
    .max(160, 'Bio must be less than 160 characters')
    .optional()
    .or(z.literal('')),
  currency: z.string().optional().nullable(),
});

// ==========================================
// BIO SCHEMAS
// ==========================================

export const addLinkSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  url: z.string().trim().optional().or(z.literal('')),
  parentId: z
    .uuid({ message: 'Invalid folder ID' })
    .nullable()
    .optional()
    .or(z.literal('')),
  isFolder: z.preprocess((val) => val === 'true', z.boolean()).optional(),
});

export const moveToFolderSchema = z.object({
  linkId: z.uuid({ message: 'Invalid link ID' }),
  parentId: z
    .uuid({ message: 'Invalid folder ID' })
    .nullable()
    .optional()
    .or(z.literal('')),
});

export const updateLinkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().optional().nullable().or(z.literal('')),
  isFolder: z.preprocess((val) => val === 'true', z.boolean()),
});

export const updateAppearanceSchema = z.object({
  themeName: z.string().optional().or(z.literal('')),
  buttonStyle: z.string().optional().or(z.literal('')),
  buttonShape: z.string().optional().or(z.literal('')),
  socialLinks: z.string().optional().or(z.literal('')),
  customTheme: z.string().optional().or(z.literal('')),
});

// ==========================================
// CASHFLOW SCHEMAS
// ==========================================

export const cashflowEntrySchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

export const updateCashflowEntrySchema = cashflowEntrySchema.extend({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
});

// ==========================================
// SUPPORT SCHEMAS
// ==========================================

export const supportTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.enum(['general', 'bug', 'billing', 'feature_request', 'account']),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const replyTicketSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});
