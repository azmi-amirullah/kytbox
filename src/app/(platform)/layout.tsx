import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has a profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  // If no profile exists, they must complete onboarding
  if (!profile) {
    redirect('/onboarding');
  }

  return <>{children}</>;
}
