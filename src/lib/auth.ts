import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Fast-path auth checker for public/marketing pages.
 * Inspects request cookies first. If no Supabase session cookies exist,
 * returns { user: null, profile: null, supabase: null } instantly with 0ms network latency.
 * Wrapped in React.cache to guarantee zero redundant calls per request lifecycle.
 */
export const getOptionalUserAndProfile = cache(async () => {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith('sb-') || c.name.includes('auth-token'),
  );

  if (!hasAuthCookie) {
    return { user: null, profile: null, supabase: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, supabase };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, display_name, role')
    .eq('id', user.id)
    .single();

  return { user, profile, supabase };
});

export async function getAuthenticatedUserAndProfile() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error('Profile not found for authenticated user:', user.id);
    // In many cases, we might want to redirect if the profile is missing
    // but handle_new_user trigger should prevent this.
    return { user, profile: null, supabase };
  }

  return { user, profile, supabase };
}

export async function getAuthenticatedUser() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return { user, supabase };
}

