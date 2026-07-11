'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { validateUsername } from '@/lib/username';
import { authRateLimit, usernameRateLimit, redis } from '@/lib/upstash/redis';
import { getIp } from '@/lib/ip';
import {
  loginSchema,
  signupSchema,
  resetPasswordSchema,
} from './schemas.server';
import { z } from 'zod';
import { getSafeOrigin } from '@/lib/origin';

const COOLDOWN_PREFIX = '@kytbox/email-cooldown:';

/**
 * Check if the user is currently in a cooldown period
 */
async function getEmailCooldown(ip: string) {
  const ttl = await redis.ttl(`${COOLDOWN_PREFIX}${ip}`);
  return ttl > 0 ? ttl : 0;
}

/**
 * Set a cooldown lock after a successful email action
 */
async function setEmailCooldown(ip: string) {
  await redis.set(`${COOLDOWN_PREFIX}${ip}`, 'locked', { ex: 62 });
}

export async function login(formData: FormData) {
  const ip = await getIp();
  const { success: rlSuccess, reset } = await authRateLimit.limit(ip);
  if (!rlSuccess) {
    const seconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return {
      error: `Too many login attempts. Please wait ${seconds} seconds.`,
    };
  }

  const supabase = await createClient();

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

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
  const ip = await getIp();

  // 1. Check strict cooldown first
  const cooldown = await getEmailCooldown(ip);
  if (cooldown > 0) {
    return { error: `Too many attempts. Please wait ${cooldown} seconds.` };
  }

  // 2. Bruteforce protection layer
  const { success: rlSuccess } = await authRateLimit.limit(ip);
  if (!rlSuccess) {
    return { error: 'Too many requests. Please try again later.' };
  }

  const supabase = await createClient();

  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const email = parsed.data.email;
  const password = parsed.data.password;
  const username = parsed.data.username.toLowerCase().trim();

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
    const message =
      authError.message.charAt(0).toUpperCase() + authError.message.slice(1);
    if (message.toLowerCase().includes('email rate limit exceeded')) {
      return {
        error: `${message}. Try sign up or sign in with Google instead.`,
      };
    }
    return { error: message };
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
  await setEmailCooldown(ip);
  redirect('/login?message=Check your email to confirm your account');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function resetPassword(formData: FormData) {
  const ip = await getIp();

  // 1. Check strict cooldown first
  const cooldown = await getEmailCooldown(ip);
  if (cooldown > 0) {
    return { error: `Too many attempts. Please wait ${cooldown} seconds.` };
  }

  // 2. Bruteforce protection layer
  const { success: rlSuccess } = await authRateLimit.limit(ip);
  if (!rlSuccess) {
    return { error: 'Too many requests. Please try again later.' };
  }

  const supabase = await createClient();
  const parsed = z
    .object({ email: z.email({ message: 'Invalid email' }) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const email = parsed.data.email;

  // Get origin from request headers and validate it
  const headersList = await headers();
  const rawOrigin =
    headersList.get('origin') ||
    headersList.get('referer')?.split('/').slice(0, 3).join('/') ||
    '';

  const origin = getSafeOrigin(rawOrigin);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  await setEmailCooldown(ip);
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const password = parsed.data.password;

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
  const ip = await getIp();
  const { success: rlSuccess, reset } = await usernameRateLimit.limit(ip);
  if (!rlSuccess) {
    const seconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000) + 1);
    return { available: false, error: `Too many requests. Wait ${seconds}s.` };
  }

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
  const parsed = z
    .object({ username: z.string().min(1, 'Username required') })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const username = parsed.data.username.toLowerCase().trim();

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
