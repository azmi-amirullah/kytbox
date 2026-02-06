import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Platform Layout - Auth Guard Only
 * Profile checks are handled by individual pages to avoid duplicate DB calls.
 * Profile existence is guaranteed by the onboarding flow.
 */
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

  return <>{children}</>;
}
