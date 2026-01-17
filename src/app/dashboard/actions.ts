'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addLink(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

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

  const { error } = await supabase.from('links').insert({
    user_id: user.id,
    title,
    url,
    sort_order: nextOrder,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateLink(linkId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

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

  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteLink(linkId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', linkId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function toggleLinkActive(linkId: string, isActive: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('links')
    .update({ is_active: isActive })
    .eq('id', linkId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function reorderLinks(linkIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Update each link's sort_order based on its position in the array
  const updates = linkIds.map((id, index) =>
    supabase
      .from('links')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('user_id', user.id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);

  if (errors.length > 0) {
    return { error: 'Failed to reorder some links' };
  }

  // revalidatePath('/'); // Optimization: Don't revalidate to prevent UI jitter. Client has optimistic state.
  return { success: true };
}
