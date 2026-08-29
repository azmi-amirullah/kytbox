import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { SettingsForm } from '@/features/settings';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const { user, supabase } = await getAuthenticatedUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, username, display_name, bio, avatar_url, theme_name, button_style, button_shape, default_currency',
    )
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  return (
    <div className='max-w-2xl mx-auto px-4 py-8 w-full'>
      <div className='space-y-1.5 sm:space-y-2 mb-6'>
        <BreadcrumbNav />
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Account Settings
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage your profile and preferences
          </p>
        </div>
      </div>
      <SettingsForm profile={profile} email={user.email || ''} />
    </div>
  );
}
