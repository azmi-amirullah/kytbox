'use server';

import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { revalidatePath, updateTag } from 'next/cache';
import { getAuthenticatedUser } from '@/lib/auth';
import { validateUsername } from '@/lib/username';
import { z } from 'zod';
import { updateProfileSchema } from '@/lib/validation.schemas';

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
  const { user, supabase } = await getAuthenticatedUser();

  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { displayName, bio = '', currency = null } = parsed.data;
  const username = parsed.data.username.toLowerCase().trim();

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

  updateTag(`profile-${username}`);
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

  const parsed = z
    .object({
      avatar: z.instanceof(File, { message: 'Avatar must be a file' }),
    })
    .safeParse({ avatar: formData.get('avatar') });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const file = parsed.data.avatar;
  if (file.size === 0) return { error: 'No file provided' };

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  if (currentProfileError || !currentProfile) {
    return { error: 'Profile not found' };
  }

  // Validate file type & size
  const isValidType = ALLOWED_AVATAR_TYPES.some((t) => t === file.type);
  const isValidSize = file.size <= 2 * 1024 * 1024; // 2MB

  if (!isValidType)
    return { error: 'Invalid file type. JPG, PNG or WebP only.' };
  if (!isValidSize) return { error: 'File too large. Max 2MB.' };

  const extByType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const fileExt = extByType[file.type] || 'jpg';
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

  if (profile) updateTag(`profile-${profile.username}`);
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

  if (profile) updateTag(`profile-${profile.username}`);
  revalidatePath('/settings', 'page');
  revalidatePath('/bio', 'page');
  return { success: true };
}

export async function checkUsername(username: string) {
  const { user, supabase } = await getAuthenticatedUser();

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
