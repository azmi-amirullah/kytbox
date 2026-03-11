'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';
import {
  addLinkSchema,
  updateLinkSchema,
  updateAppearanceSchema,
  moveToFolderSchema,
} from '@/lib/validation.schemas';

export async function addLink(formData: FormData) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const parsed = addLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { title, parentId, animationType } = parsed.data;
  let url = parsed.data.url || '';

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Validate URL scheme to prevent XSS (javascript:, data:, etc.)
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { error: 'Only HTTP and HTTPS URLs are allowed' };
    }
    // Enforce domain format: must have TLD (letters only, 2+ chars)
    if (
      !/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(parsed.hostname) &&
      parsed.hostname !== 'localhost'
    ) {
      return { error: 'Invalid URL' };
    }
  } catch {
    return { error: 'Invalid URL format' };
  }

  // Get the highest sort_order and next short_id in parallel
  const [{ data: lastLink }, { data: nextShortId, error: rpcError }] =
    await Promise.all([
      supabase
        .from('links')
        .select('sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single(),
      supabase.rpc('get_next_short_id', { p_user_id: user.id }),
    ]);

  const nextOrder = (lastLink?.sort_order ?? 0) + 1;

  if (rpcError) {
    console.error('Failed to get next short_id:', rpcError);
    return { error: 'Failed to create link' };
  }

  const { error } = await supabase.from('links').insert({
    user_id: user.id,
    title,
    url,
    sort_order: nextOrder,
    short_id: nextShortId,
    parent_id: parentId || null,
    animation_type: animationType || 'none',
  });

  if (error) {
    return { error: error.message };
  }

  // Fetch the created link and the new count for the parent folder
  const [{ data: newLink }, { count: nextCount }] = await Promise.all([
    supabase
      .from('links')
      .select('*')
      .eq('user_id', user.id)
      .eq('short_id', nextShortId)
      .single(),
    parentId 
      ? supabase.from('links').select('id', { count: 'exact', head: true }).eq('parent_id', parentId)
      : Promise.resolve({ count: 0 })
  ]);

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true, link: newLink, newCount: nextCount };
}

export async function updateLink(linkId: string, formData: FormData) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const rawData = Object.fromEntries(formData);
  const parsed = updateLinkSchema.safeParse({
    ...rawData,
    isFolder: rawData.isFolder === 'true',
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { title, isFolder, animationType } = parsed.data;
  let url = parsed.data.url || null;

  const updates: { title: string; url?: string; animation_type?: string } = {
    title,
    animation_type: animationType || 'none',
  };

  if (!isFolder && url) {
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    // Validate URL scheme to prevent XSS
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { error: 'Only HTTP and HTTPS URLs are allowed' };
      }
      // Enforce domain format: must have TLD (letters only, 2+ chars)
      if (
        !/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(parsed.hostname) &&
        parsed.hostname !== 'localhost'
      ) {
        return { error: 'Invalid URL' };
      }
    } catch {
      return { error: 'Invalid URL format' };
    }
    updates.url = url;
  }

  const { error } = await supabase
    .from('links')
    .update(updates)
    .eq('id', linkId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  // Fetch the updated link
  const { data: updatedLink } = await supabase
    .from('links')
    .select('*')
    .eq('id', linkId)
    .single();

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true, link: updatedLink };
}

export async function deleteLink(linkId: string) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', linkId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true };
}

export async function toggleLinkActive(linkId: string, isActive: boolean) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const { error } = await supabase
    .from('links')
    .update({ is_active: isActive })
    .eq('id', linkId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true };
}

export async function reorderLinks(linkIds: string[]) {
  const { profile, supabase } = await getAuthenticatedUserAndProfile();

  // Update each link's sort_order atomically via RPC
  const { error } = await supabase.rpc('reorder_links', {
    p_link_ids: linkIds,
  });

  if (error) {
    console.error('Failed to reorder links:', error);
    return { error: 'Failed to reorder links' };
  }

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true };
}
export async function updateAppearance(formData: FormData) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const parsed = updateAppearanceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const {
    themeName = '',
    buttonStyle = '',
    buttonShape = '',
    socialLinks: socialLinksRaw = '',
    customTheme: customThemeRaw = '',
  } = parsed.data;

  const updateData: {
    theme_name: string;
    button_style: string;
    button_shape: string;
    social_links?: Record<string, string>;
    custom_theme?: Record<string, string> | null;
  } = {
    theme_name: themeName,
    button_style: buttonStyle,
    button_shape: buttonShape,
  };

  if (socialLinksRaw) {
    try {
      updateData.social_links = JSON.parse(socialLinksRaw);
    } catch (e) {
      console.error('Failed to parse social links JSON', e);
    }
  }

  if (themeName === 'custom' && customThemeRaw) {
    try {
      updateData.custom_theme = JSON.parse(customThemeRaw);
    } catch (e) {
      console.error('Failed to parse custom theme JSON', e);
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/bio', 'page');
  if (profile) {
    updateTag(`profile-${profile.username}`);
    revalidatePath(`/${profile.username}`, 'page');
  }
  return { success: true };
}

export async function createFolder(formData: FormData) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const parsed = addLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { title, parentId, animationType } = parsed.data;

  // Get the highest sort_order and next short_id in parallel
  const [{ data: lastLink }, { data: nextShortId, error: rpcError }] =
    await Promise.all([
      supabase
        .from('links')
        .select('sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single(),
      supabase.rpc('get_next_short_id', { p_user_id: user.id }),
    ]);

  const nextOrder = (lastLink?.sort_order ?? 0) + 1;

  if (rpcError) {
    console.error('Failed to get next short_id:', rpcError);
    return { error: 'Failed to create folder' };
  }

  const { error } = await supabase.from('links').insert({
    user_id: user.id,
    title,
    url: '#', // Folders don't have a real URL
    sort_order: nextOrder,
    short_id: nextShortId,
    is_folder: true,
    parent_id: parentId || null,
    animation_type: animationType || 'none',
  });

  if (error) {
    return { error: error.message };
  }

  // Fetch the created link and the new count for the parent folder
  const [{ data: newFolder }, { count: nextCount }] = await Promise.all([
    supabase
      .from('links')
      .select('*')
      .eq('user_id', user.id)
      .eq('short_id', nextShortId)
      .single(),
    parentId 
      ? supabase.from('links').select('id', { count: 'exact', head: true }).eq('parent_id', parentId)
      : Promise.resolve({ count: 0 })
  ]);

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true, link: newFolder, newCount: nextCount };
}

export async function moveToFolder(formData: FormData) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const parsed = moveToFolderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { linkId, parentId } = parsed.data;
  const targetParentId = parentId || null;

  // Get the highest sort_order in the target destination
  const { data: lastLink } = await supabase
    .from('links')
    .select('sort_order')
    .eq('user_id', user.id)
    .filter('parent_id', targetParentId === null ? 'is' : 'eq', targetParentId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (lastLink?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from('links')
    .update({ 
      parent_id: targetParentId,
      sort_order: nextOrder 
    })
    .eq('id', linkId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/bio', 'page');
  if (profile) updateTag(`profile-${profile.username}`);
  return { success: true };
}

export async function loadMoreLinks(offset: number, limit: number = 50) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();
  
  const { data, error, count } = await supabase
    .from('links')
    .select('*, children:links(count)', { count: 'exact' })
    .eq('user_id', user.id)
    .is('parent_id', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);
    
  if (error) {
    return { error: error.message };
  }
  
  return { links: data, totalCount: count || 0 };
}

export async function loadFolderLinks(folderId: string, offset: number, limit: number = 50) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();
  
  const { data, error, count } = await supabase
    .from('links')
    .select(
      'id, title, url, is_active, short_id, is_folder, parent_id, sort_order, animation_type, clicks, children:links(count)',
      { count: 'exact' }
    ).eq('user_id', user.id)
    .eq('parent_id', folderId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);
    
  if (error) {
    return { error: error.message };
  }
  
  return { links: data, totalCount: count || 0 };
}
