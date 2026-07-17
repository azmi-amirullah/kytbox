import { z } from 'zod';

// ==========================================
// SHARED / CORE SCHEMAS
// ==========================================

export const ticketStatusSchema = z
  .enum(['open', 'in_progress', 'resolved', 'closed'])
  .catch('open');

export const ticketCategorySchema = z
  .enum(['general', 'bug', 'billing', 'feature_request', 'account'])
  .catch('general');

export const userRoleSchema = z.enum(['admin', 'user']).catch('user');
export const adminRoleSchema = z.enum(['admin', 'user']).catch('user');

// Shared parsers for Supabase Json fields
export const socialLinksSchema = z.record(z.string(), z.string()).catch({});

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

export const bioTabSchema = z.enum(['links', 'appearance']).catch('links');

export const addLinkSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  url: z.string().trim().optional().or(z.literal('')),
  parentId: z
    .uuid({ message: 'Invalid folder ID' })
    .nullable()
    .optional()
    .or(z.literal('')),
  isFolder: z.preprocess((val) => val === 'true', z.boolean()).optional(),
  animationType: z.string().optional().or(z.literal('')),
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
  animationType: z.string().optional().or(z.literal('')),
});

export const updateAppearanceSchema = z.object({
  themeName: z.string().optional().or(z.literal('')),
  buttonStyle: z.string().optional().or(z.literal('')),
  buttonShape: z.string().optional().or(z.literal('')),
  socialLinks: z.string().optional().or(z.literal('')),
  customTheme: z.string().optional().or(z.literal('')),
});

export const customThemeDataSchema = z.object({
  background: z.string(),
  textPrimary: z.string(),
  textSecondary: z.string(),
  elementBg: z.string(),
  elementBorder: z.string(),
  elementRing: z.string(),
  buttonBg: z.string(),
  buttonBorder: z.string(),
  buttonText: z.string(),
  footerBg: z.string(),
  footerBorder: z.string(),
  footerText: z.string(),
});

// ==========================================
// CASHFLOW SCHEMAS
// ==========================================

export const shareRoleSchema = z
  .enum(['owner', 'edit', 'read', 'public'])
  .catch('read');

export const recurrenceIntervalSchema = z.enum(['monthly', 'yearly']).nullable();

export const yearlyCalculationSchema = z.enum(['prorated', 'exact']).nullable();

export const dtoShareRoleSchema = z
  .string()
  .transform((v): 'editor' | 'viewer' => (v === 'edit' ? 'editor' : 'viewer'));

export const cashflowEntrySchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  is_recurring: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
  recurrence_interval: z.enum(['monthly', 'yearly']).nullable().optional(),
  yearly_calculation: z.enum(['prorated', 'exact']).nullable().optional(),
});

export const updateCashflowEntrySchema = cashflowEntrySchema.extend({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
});

export const cashflowBudgetSchema = z.object({
  cashflowId: z.uuid({ message: 'Invalid cashflow ID' }),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
});

export const deleteCashflowBudgetSchema = z.object({
  budgetId: z.uuid({ message: 'Invalid budget ID' }),
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

// ==========================================
// LIST SCHEMAS
// ==========================================

export const listTypeSchema = z.enum(['todo', 'wishlist', 'idea']);

export const createListSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title too long'),
  type: listTypeSchema,
  description: z.string().max(500).optional().or(z.literal('')),
});

export const updateListSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500).optional().or(z.literal('')),
});

export const listColumnSchema = z.object({
  title: z.string().trim().min(1, 'Column name is required').max(50, 'Column name too long'),
});

export const listItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300, 'Title too long'),
  description: z.string().max(1000).optional().or(z.literal('')),
});

export const createListItemSchema = listItemSchema.extend({
  listId: z.uuid({ message: 'Invalid list ID' }),
  columnId: z.string().uuid().optional().or(z.literal('')),
});

export const wishlistMetadataSchema = z.object({
  price: z.coerce.number().nonnegative().nullable().catch(null),
  currency: z.string().max(3).nullable().catch(null),
  purchase_url: z.string().url().nullable().catch(null),
}).catch({ price: null, currency: null, purchase_url: null });

export const listItemMetadataSchema = z.record(z.string(), z.unknown()).catch({});
