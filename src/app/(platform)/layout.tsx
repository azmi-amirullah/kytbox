import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  const userData = {
    username: profile.username,
    email: user.email,
    avatar_url: profile.avatar_url,
    display_name: profile.display_name,
    role: profile.role,
  };

  return (
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs />
      <Header
        variant='dashboard'
        user={userData}
        publicUrl={`/${profile.username}`}
      />
      <main className='relative z-10 flex-1 w-full'>{children}</main>
      <Footer />
    </div>
  );
}
