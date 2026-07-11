import { z } from 'zod';

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

export const socialLinksSchema = z.record(z.string(), z.string()).catch({});
