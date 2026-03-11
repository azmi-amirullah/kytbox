'use server';

import { createStaticClient } from '@/lib/supabase/server';
import { z } from 'zod';

export async function loadMorePublicLinks(profileId: string, offset: number, limit: number = 50) {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('links')
    .select(
      'id, title, url, is_active, short_id, is_folder, parent_id, sort_order, animation_type, children:links(count)',
    )
    .eq('user_id', profileId)
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return { error: error.message };
  }

  const { data: rawLinks } = z.array(z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().nullable(),
    is_active: z.boolean(),
    short_id: z.union([z.string(), z.number()]).nullable(),
    is_folder: z.boolean(),
    parent_id: z.string().nullable(),
    sort_order: z.number().nullable(),
    animation_type: z.string().nullable(),
    children: z.array(z.object({ count: z.number() })).optional(),
  })).safeParse(data);

  return { 
    links: rawLinks ? rawLinks.map((link) => ({
      ...link,
      url: link.url || '',
      is_active: !!link.is_active,
      child_count: link.children?.[0]?.count ?? 0,
    })) : [] 
  };
}

export async function loadMorePublicFolderLinks(profileId: string, folderId: string, offset: number, limit: number = 50) {
  const supabase = createStaticClient();
  const { data, error, count } = await supabase
    .from('links')
    .select(
      'id, title, url, is_active, short_id, is_folder, parent_id, sort_order, animation_type, children:links(count)',
      { count: 'exact' }
    )
    .eq('user_id', profileId)
    .eq('is_active', true)
    .eq('parent_id', folderId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return { error: error.message };
  }

  const { data: rawLinks } = z.array(z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().nullable(),
    is_active: z.boolean(),
    short_id: z.union([z.string(), z.number()]).nullable(),
    is_folder: z.boolean(),
    parent_id: z.string().nullable(),
    sort_order: z.number().nullable(),
    animation_type: z.string().nullable(),
    children: z.array(z.object({ count: z.number() })).optional(),
  })).safeParse(data);

  return { 
    links: rawLinks ? rawLinks.map((link) => ({
      ...link,
      url: link.url || '',
      is_active: !!link.is_active,
      child_count: link.children?.[0]?.count ?? 0,
    })) : [],
    totalFolderLinks: count || 0
  };
}
