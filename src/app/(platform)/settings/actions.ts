'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { validateUsername } from '@/lib/username';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const username = (formData.get('username') as string).toLowerCase().trim();
  const displayName = formData.get('displayName') as string;
  const bio = formData.get('bio') as string;

  // Validate username format using UKIT spec
  const validation = validateUsername(username);
  if (!validation.valid) {
    return { error: validation.error };
  }

  // Check if username is taken (by another user)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .single();

  if (existingProfile) {
    return { error: 'Username is already taken' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      display_name: displayName,
      bio,
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidateTag(`profile-${username}`, 'max');
  revalidatePath('/settings', 'page');
  revalidatePath('/bio', 'page');
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const file = formData.get('avatar') as File;

  if (!file || file.size === 0) {
    return { error: 'No file provided' };
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { error: 'File must be an image' };
  }

  // Limit file size to 2MB (will be compressed client-side, but safety check)
  if (file.size > 2 * 1024 * 1024) {
    return { error: 'Image must be less than 2MB' };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = fileName;

  // Delete old avatar if exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  if (profile?.avatar_url) {
    // Extract filename securely, handling potential query params
    const oldFileName = profile.avatar_url.split('/').pop()?.split('?')[0];
    if (oldFileName) {
      await supabase.storage.from('avatars').remove([oldFileName]);
    }
  }

  // Upload new avatar
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return { error: uploadError.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Update profile with new avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  if (profile) revalidateTag(`profile-${profile.username}`, 'max');
  revalidatePath('/settings', 'page');
  revalidatePath('/bio', 'page');
  return { success: true, url: urlData.publicUrl };
}

export async function removeAvatar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get current avatar
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  if (profile?.avatar_url) {
    // Delete from storage
    const fileName = profile.avatar_url.split('/').pop()?.split('?')[0];
    if (fileName) {
      await supabase.storage.from('avatars').remove([fileName]);
    }
  }

  // Clear avatar_url in profile
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  if (profile) revalidateTag(`profile-${profile.username}`, 'max');
  revalidatePath('/settings', 'page');
  revalidatePath('/bio', 'page');
  return { success: true };
}

export async function checkUsername(username: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { available: false, error: 'Not authenticated' };
  }

  const safeUsername = username.toLowerCase().trim();

  // Validate format using UKIT spec
  const validation = validateUsername(safeUsername);
  if (!validation.valid) {
    return { available: false, error: validation.error };
  }

  // Check if taken by another user
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', safeUsername)
    .neq('id', user.id) // Exclude current user
    .single();

  return { available: !existingProfile };
}
