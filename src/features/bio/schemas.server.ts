import { z } from 'zod';

export const bioTabSchema = z.enum(['links', 'appearance', 'subscribers']).catch('links');

export const subscribeSchema = z.object({
  profileId: z.string().uuid({ message: 'Invalid profile ID' }),
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  sourceUrl: z.string().trim().optional().or(z.literal('')),
});

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
  displayMode: z.string().optional().or(z.literal('')),
  icon_url: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: 'Thumbnail URL must start with http:// or https://',
    }),
  scheduled_at: z.preprocess((val) => val === '' ? null : val, z.coerce.date().nullable().optional()),
  expires_at: z.preprocess((val) => val === '' ? null : val, z.coerce.date().nullable().optional()),
  isPinned: z.preprocess((val) => val === 'true', z.boolean()).optional(),
  isSensitive: z.preprocess((val) => val === 'true', z.boolean()).optional(),
}).refine(
  (data) => !data.scheduled_at || !data.expires_at || data.expires_at > data.scheduled_at,
  { message: 'Expiry must be after start date', path: ['expires_at'] }
);

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
  displayMode: z.string().optional().or(z.literal('')),
  icon_url: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: 'Thumbnail URL must start with http:// or https://',
    }),
  scheduled_at: z.preprocess((val) => val === '' ? null : val, z.coerce.date().nullable().optional()),
  expires_at: z.preprocess((val) => val === '' ? null : val, z.coerce.date().nullable().optional()),
  isPinned: z.preprocess((val) => val === 'true', z.boolean()).optional(),
  isSensitive: z.preprocess((val) => val === 'true', z.boolean()).optional(),
}).refine(
  (data) => !data.scheduled_at || !data.expires_at || data.expires_at > data.scheduled_at,
  { message: 'Expiry must be after start date', path: ['expires_at'] }
);

export const updateSeoSchema = z.object({
  metaTitle: z.string().trim().max(120, 'Title must be under 120 characters').optional().or(z.literal('')),
  metaDescription: z.string().trim().max(300, 'Description must be under 300 characters').optional().or(z.literal('')),
  ogImageUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: 'OG image URL must start with http:// or https://',
    }),
});

export const updateAppearanceSchema = z.object({
  themeName: z.string().optional().or(z.literal('')),
  buttonStyle: z.string().optional().or(z.literal('')),
  buttonShape: z.string().optional().or(z.literal('')),
  socialLinks: z.string().optional().or(z.literal('')),
  customTheme: z.string().optional().or(z.literal('')),
  metaTitle: z.string().optional().or(z.literal('')),
  metaDescription: z.string().optional().or(z.literal('')),
  ogImageUrl: z.string().optional().or(z.literal('')),
});

export const socialLinksSchema = z.record(z.string(), z.string()).catch({});

const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const customDomainInputSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Domain must be at least 3 characters')
  .max(253, 'Domain must be under 253 characters')
  .refine(
    (domain) => {
      const isDevOrTest =
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test';
      const isTestDomain =
        domain.endsWith('.local') ||
        domain.endsWith('.test') ||
        domain.endsWith('.localhost');
      if (isDevOrTest && isTestDomain) {
        return true;
      }
      return DOMAIN_REGEX.test(domain);
    },
    { message: 'Invalid domain format (e.g., links.creator.com or mybio.me)' }
  )
  .refine(
    (domain) =>
      domain !== 'localhost' &&
      domain !== '127.0.0.1' &&
      domain !== 'kytbox.app' &&
      !domain.endsWith('.kytbox.app'),
    { message: 'Reserved platform domain cannot be used as a custom domain' }
  );

export const addCustomDomainSchema = z.object({
  domain: customDomainInputSchema,
});


