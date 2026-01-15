import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-2xl mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
          <p className='text-muted-foreground mt-1'>
            Manage your profile and preferences
          </p>
        </div>
        <SettingsForm profile={profile} email={user.email || ''} />
      </div>
    </div>
  );
}
