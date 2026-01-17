'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
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
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Generate username from email prefix
  const emailPrefix = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const baseUsername = emailPrefix.slice(0, 20);
  let username = baseUsername;

  // Check if username exists, if so find next available increment
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('username')
    .or(`username.eq.${baseUsername},username.like.${baseUsername}_%`);

  if (existingProfiles && existingProfiles.length > 0) {
    // Check if base username is taken
    const baseIsTaken = existingProfiles.some(
      (p) => p.username === baseUsername
    );

    if (baseIsTaken) {
      // Find the highest increment number
      let maxNum = 1;
      for (const profile of existingProfiles) {
        const match = profile.username.match(
          new RegExp(`^${baseUsername}_(\\d+)$`)
        );
        if (match) {
          maxNum = Math.max(maxNum, parseInt(match[1], 10) + 1);
        }
      }
      username = `${baseUsername}_${maxNum}`;
    }
    // If base is NOT taken but variants exist, just use the base
  }

  // Sign up the user with auto-generated username in metadata
  // The database trigger will automatically create the profile
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: emailPrefix,
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
    redirect('/dashboard');
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
  const email = formData.get('email') as string;

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
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/login?message=Password updated successfully');
}
