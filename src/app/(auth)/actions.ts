'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { validateUsername } from '@/lib/username';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email')?.toString() || '',
    password: formData.get('password')?.toString() || '',
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    let message = error.message;
    if (error.message === 'Invalid login credentials') {
      message = 'Invalid email or password';
    } else if (error.message === 'Email not confirmed') {
      message =
        'Please check your email and confirm your account before logging in';
    }
    return { error: message };
  }

  revalidatePath('/', 'layout');
  redirect('/app');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email')?.toString() || '';
  const password = formData.get('password')?.toString() || '';
  const username = (formData.get('username')?.toString() || '')
    .toLowerCase()
    .trim();

  // Validate the username
  const validation = validateUsername(username);
  if (!validation.valid) {
    return { error: validation.error };
  }

  // Check if username is already taken
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (existingProfile) {
    return { error: 'Username is already taken' };
  }

  // Sign up the user with auto-generated username in metadata
  // The database trigger will automatically create the profile
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: email.split('@')[0],
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // Check if email confirmation is required
  // If user.identities is empty, email confirmation is needed
  if (data?.user?.identities?.length === 0) {
    return {
      error: 'This email is already registered. Please sign in instead.',
    };
  }

  // If session exists, user is immediately logged in (email verification disabled)
  if (data?.session) {
    revalidatePath('/', 'layout');
    redirect('/app');
  }

  // Email verification required - redirect to login with message
  redirect('/login?message=Check your email to confirm your account');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email')?.toString() || '';

  // Get origin from request headers
  const headersList = await headers();
  const origin =
    headersList.get('origin') ||
    headersList.get('referer')?.split('/').slice(0, 3).join('/') ||
    '';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get('password')?.toString() || '';

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/login?message=Password updated successfully');
}

/**
 * Check username availability for signup form
 * Does NOT require authentication
 */
export async function checkUsernameAvailable(username: string) {
  const supabase = await createClient();

  const safeUsername = username.toLowerCase().trim();

  // Validate format using Kytbox spec
  const validation = validateUsername(safeUsername);
  if (!validation.valid) {
    return { available: false, error: validation.error };
  }

  // Check if username exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', safeUsername)
    .single();

  return { available: !existingProfile };
}

export async function updateUsername(formData: FormData) {
  const supabase = await createClient();
  const username = (formData.get('username')?.toString() || '')
    .toLowerCase()
    .trim();

  // Validate
  const validation = validateUsername(username);
  if (!validation.valid) {
    return { error: validation.error };
  }

  // Check availability
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (existingProfile) {
    return { error: 'Username is already taken' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Create or Update profile
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    username,
    display_name: username,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/app');
}
