'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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

  // Validate username format
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return {
      error: 'Username must be 3-20 characters (letters, numbers, underscores)',
    };
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

  revalidatePath('/', 'layout');
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
  const filePath = `avatars/${fileName}`;

  // Delete old avatar if exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single();

  if (profile?.avatar_url) {
    // Extract filename securely, handling potential query params
    const fileName = profile.avatar_url.split('/').pop()?.split('?')[0];
    if (fileName) {
      await supabase.storage.from('avatars').remove([`avatars/${fileName}`]);
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

  revalidatePath('/', 'layout');
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
    .select('avatar_url')
    .eq('id', user.id)
    .single();

  if (profile?.avatar_url) {
    // Delete from storage
    const fileName = profile.avatar_url.split('/').pop()?.split('?')[0];
    if (fileName) {
      await supabase.storage.from('avatars').remove([`avatars/${fileName}`]);
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

  revalidatePath('/', 'layout');
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

  // Validate format
  if (!/^[a-z0-9_]{3,20}$/.test(safeUsername)) {
    return { available: false, error: 'Invalid format' };
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
