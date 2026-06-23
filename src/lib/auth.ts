import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

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

