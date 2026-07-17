import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { userRoleSchema } from '@/lib/validation.schemas';
import { connection } from 'next/server';

export async function checkAdmin() {
  await connection();
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

  return userRoleSchema.parse(profile?.role) === 'admin';
}

export async function requireAdmin() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect('/app');
  }
}
