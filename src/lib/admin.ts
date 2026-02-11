import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

export async function requireAdmin() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect('/app');
  }
}
