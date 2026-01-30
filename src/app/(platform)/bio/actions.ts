'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';

export async function addLink(formData: FormData) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const title = formData.get('title') as string;
  let url = formData.get('url') as string;

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

  // Get the highest sort_order
  const { data: lastLink } = await supabase
    .from('links')
    .select('sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (lastLink?.sort_order ?? 0) + 1;

  // Get next short_id for this user
  const { data: nextShortId, error: rpcError } = await supabase.rpc(
    'get_next_short_id',
    { p_user_id: user.id },
  );

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
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app/bio', 'page');
  if (profile) revalidateTag(`profile-${profile.username}`, 'max');
  return { success: true };
}

export async function updateLink(linkId: string, formData: FormData) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const title = formData.get('title') as string;
  let url = formData.get('url') as string;

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

  const { error } = await supabase
    .from('links')
    .update({ title, url })
    .eq('id', linkId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app/bio', 'page');
  if (profile) revalidateTag(`profile-${profile.username}`, 'max');
  return { success: true };
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

  revalidatePath('/app/bio', 'page');
  if (profile) revalidateTag(`profile-${profile.username}`, 'max');
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

  revalidatePath('/app/bio', 'page');
  if (profile) revalidateTag(`profile-${profile.username}`, 'max');
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

  revalidatePath('/app/bio', 'page');
  if (profile) revalidateTag(`profile-${profile.username}`, 'max');
  return { success: true };
}
export async function updateAppearance(formData: FormData) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  const themeName = formData.get('themeName') as string;
  const buttonStyle = formData.get('buttonStyle') as string;
  const buttonShape = formData.get('buttonShape') as string;

  const { error } = await supabase
    .from('profiles')
    .update({
      theme_name: themeName,
      button_style: buttonStyle,
      button_shape: buttonShape,
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app/bio', 'page');
  if (profile) {
    revalidateTag(`profile-${profile.username}`, 'max');
    revalidatePath(`/${profile.username}`, 'page');
  }
  return { success: true };
}
