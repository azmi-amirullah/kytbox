import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { SettingsForm, BackButton } from '@/features/settings';
import Link from 'next/link';
import { LuChevronRight } from 'react-icons/lu';

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
      <div className='mb-6'>
        <nav className='flex items-center gap-1 text-sm text-muted-foreground mb-4'>
          <Link href='/app' className='hover:text-foreground transition-colors'>
            Kytbox
          </Link>
          <LuChevronRight className='w-3 h-3' />
          <span className='text-foreground font-medium'>Settings</span>
        </nav>

        <div className='flex items-center gap-4 mb-2'>
          <BackButton />
          <h1 className='text-3xl font-bold tracking-tight'>
            Account Settings
          </h1>
        </div>

        <p className='text-muted-foreground'>
          Manage your profile and preferences
        </p>
      </div>
      <SettingsForm profile={profile} email={user.email || ''} />
    </div>
  );
}
