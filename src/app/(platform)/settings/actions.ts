'use server';

import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';
import { validateUsername } from '@/lib/username';

const AVATAR_BUCKET = 'avatars';
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

function extractAvatarObjectPath(avatarUrl: string): string | null {
  try {
    const url = new URL(avatarUrl);
    const marker = `/object/public/${AVATAR_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex < 0) return null;

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export async function updateProfile(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  const username = (formData.get('username') as string).toLowerCase().trim();
  const displayName = formData.get('displayName') as string;
  const bio = formData.get('bio') as string;
  const currency = formData.get('currency') as string | null;

  // Validate username format using Kytbox spec
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
      ...(currency && { default_currency: currency }),
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidateTag(`profile-${username}`, 'max');
  revalidatePath('/settings', 'page');
  revalidatePath('/bio', 'page');
  revalidatePath('/cashflow', 'page');
  return { success: true };
}

/**
 * Upload Avatar
 */
export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const file = formData.get('avatar') as File;
  if (!file || file.size === 0) return { error: 'No file provided' };

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  if (currentProfileError || !currentProfile) {
    return { error: 'Profile not found' };
  }

  // Validate file type & size
  const isValidType = ALLOWED_AVATAR_TYPES.includes(
    file.type as (typeof ALLOWED_AVATAR_TYPES)[number],
  );
  const isValidSize = file.size <= 2 * 1024 * 1024; // 2MB

  if (!isValidType)
    return { error: 'Invalid file type. JPG, PNG or WebP only.' };
  if (!isValidSize) return { error: 'File too large. Max 2MB.' };

  const extByType: Record<(typeof ALLOWED_AVATAR_TYPES)[number], string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const fileExt = extByType[file.type as (typeof ALLOWED_AVATAR_TYPES)[number]];
  const filePath = `${user.id}/${randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('Upload Error:', uploadError);
    return { error: 'Failed to upload image' };
  }

  const { data: urlData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath);

  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', user.id)
    .select('username')
    .single();

  if (updateError) {
    await supabase.storage.from(AVATAR_BUCKET).remove([filePath]);
    console.error('Update Profile Error:', updateError);
    return { error: 'Failed to update profile' };
  }

  const oldAvatarPath = currentProfile.avatar_url
    ? extractAvatarObjectPath(currentProfile.avatar_url)
    : null;
  if (oldAvatarPath && oldAvatarPath !== filePath) {
    await supabase.storage.from(AVATAR_BUCKET).remove([oldAvatarPath]);
  }

  if (profile) revalidateTag(`profile-${profile.username}`, 'max');
  revalidatePath('/settings', 'page');
  revalidatePath('/bio', 'page');
  return { success: true, url: urlData.publicUrl };
}

/**
 * Remove Avatar
 */
export async function removeAvatar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  if (currentProfileError || !currentProfile) {
    return { error: 'Profile not found' };
  }

  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id)
    .select('username')
    .single();

  if (updateError) return { error: 'Failed to remove avatar' };

  const oldAvatarPath = currentProfile.avatar_url
    ? extractAvatarObjectPath(currentProfile.avatar_url)
    : null;
  if (oldAvatarPath) {
    await supabase.storage.from(AVATAR_BUCKET).remove([oldAvatarPath]);
  }

  if (profile) revalidateTag(`profile-${profile.username}`, 'max');
  revalidatePath('/settings', 'page');
  revalidatePath('/bio', 'page');
  return { success: true };
}

export async function checkUsername(username: string) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  const safeUsername = username.toLowerCase().trim();

  // Validate format using Kytbox spec
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
