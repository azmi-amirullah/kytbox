import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import { createClient } from '@/lib/supabase/server';
import { connection } from 'next/server';
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { LuShieldAlert } from 'react-icons/lu';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
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

  if (!profile || profile.role !== 'admin') {
    redirect('/app');
  }

  const userData = {
    username: profile.username,
    email: user.email,
    avatar_url: profile.avatar_url,
    display_name: profile.display_name,
    role: 'admin',
  };

  return (
    <div className='min-h-screen relative bg-background flex flex-col pt-16'>
      <BackgroundBlobs />
      <Header
        variant='dashboard'
        user={userData}
        publicUrl={`/${profile.username}`}
      />

      <div className='relative z-10 border-y border-blue-200 bg-blue-50/90 text-blue-700'>
        <div className='max-w-7xl mx-auto px-4 py-2 text-sm font-semibold flex items-center gap-2'>
          <LuShieldAlert className='h-4 w-4 shrink-0' />
          <span>
            Admin mode. You are managing support data as an administrator.
          </span>
        </div>
      </div>

      <main className='relative z-10 flex-1 w-full'>{children}</main>
      <Footer />
    </div>
  );
}
