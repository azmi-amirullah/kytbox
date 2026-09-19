import * as z from 'zod/mini';

export const bioTabSchema = z.catch(z.enum(['links', 'appearance', 'subscribers', 'messages']), 'links');
export const linkTypeSchema = z.catch(z.enum(['link', 'folder']), 'link');
export const linkAnimationSchema = z.catch(
  z.enum(['none', 'pulse', 'bounce', 'glow']),
  'none',
);

export const linkDtoSchema = z.object({
  id: z.string(),
  title: z.catch(z.string(), ''),
  url: z.catch(z.string(), '#'),
  is_active: z.catch(z.boolean(), true),
  sort_order: z.catch(z.number(), 0),
  is_folder: z.catch(z.boolean(), false),
  is_header: z.catch(z.boolean(), false),
  parent_id: z.catch(z.union([z.string(), z.null()]), null),
  clicks: z.catch(z.union([z.number(), z.null()]), null),
  animation_type: z.catch(z.union([z.string(), z.null()]), null),
  display_mode: z.catch(z.union([z.string(), z.null()]), 'link'),
  icon_url: z.catch(z.union([z.string(), z.null()]), null),
  child_count: z.catch(z.number(), 0),
  scheduled_at: z.catch(z.union([z.string(), z.null()]), null),
  expires_at: z.catch(z.union([z.string(), z.null()]), null),
  is_pinned: z.catch(z.boolean(), false),
  is_sensitive: z.catch(z.boolean(), false),
  grid_size: z.catch(z.enum(['1x1', '1x2', '2x2', 'full']), 'full'),
  stream_url: z.catch(z.union([z.string(), z.null()]), null),
  audio_artist: z.catch(z.union([z.string(), z.null()]), null),
  audio_cover_url: z.catch(z.union([z.string(), z.null()]), null),
});

export const linkDtoListSchema = z.catch(z.array(linkDtoSchema), []);

export const rawLinkSchema = linkDtoSchema;
export const rawLinkListSchema = linkDtoListSchema;

export const linkActionResponseSchema = z.object({
  success: z.boolean(),
  link: z.union([linkDtoSchema, z.null()]),
  newCount: z.catch(z.union([z.number(), z.null()]), null),
  error: z.catch(z.union([z.string(), z.null()]), null),
});

export const socialLinksSchema = z.catch(z.record(z.string(), z.string()), {});

export const contactMessageStatusClientSchema = z.catch(
  z.union([
    z.literal('unread'),
    z.literal('read'),
    z.literal('archived'),
  ]),
  'unread'
);

export const bioContactMessageDtoSchema = z.object({
  id: z.string(),
  profile_id: z.string(),
  sender_name: z.catch(z.string(), ''),
  sender_email: z.catch(z.string(), ''),
  message: z.catch(z.string(), ''),
  status: contactMessageStatusClientSchema,
  created_at: z.catch(z.string(), ''),
});
