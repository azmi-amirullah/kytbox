import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { createClient } from '@/lib/supabase/server';

export default async function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userData = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url, display_name, role')
      .eq('id', user.id)
      .single();

    if (profile) {
      userData = {
        username: profile.username,
        email: user.email,
        avatar_url: profile.avatar_url,
        display_name: profile.display_name,
        role: profile.role,
      };
    }
  }

  return (
    <div className='min-h-screen flex flex-col bg-background relative overflow-hidden'>
      {/* Background Pattern */}
      <div className='absolute inset-0 z-0 opacity-30 pointer-events-none'>
        <div className='absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[100px]' />
        <div className='absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[100px]' />
      </div>

      {/* Header */}
      {/* Header */}
      <Header variant='legal' user={userData} />

      {/* Content */}
      <main className='flex-1 relative z-10 container mx-auto px-4 py-12 md:py-20'>
        <div className='max-w-3xl mx-auto prose prose-slate dark:prose-invert prose-headings:font-bold prose-a:text-primary hover:prose-a:underline'>
          {children}
        </div>
      </main>

      <Footer variant='landing' />
    </div>
  );
}
