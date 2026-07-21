import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getOptionalUserAndProfile } from '@/lib/auth';

export default async function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getOptionalUserAndProfile();

  const userData =
    user && profile
      ? {
          id: user.id,
          username: profile.username,
          email: user.email,
          avatar_url: profile.avatar_url,
          display_name: profile.display_name,
          role: profile.role,
        }
      : null;

  return (
    <div className='min-h-screen flex flex-col bg-background relative overflow-hidden'>
      {/* Background Pattern */}
      <div className='absolute inset-0 z-0 opacity-30 pointer-events-none'>
        <div className='absolute top-[-20%] right-[-10%] w-150 h-150 rounded-full bg-primary/10 blur-[100px]' />
        <div className='absolute bottom-[-20%] left-[-10%] w-150 h-150 rounded-full bg-blue-500/10 blur-[100px]' />
      </div>

      {/* Header */}
      <Header variant='legal' user={userData} />

      {/* Content */}
      <main className='flex-1 relative z-10 container mx-auto px-4 py-12 md:py-20 mt-16'>
        <div className='max-w-3xl mx-auto prose prose-slate dark:prose-invert prose-headings:font-bold prose-a:text-primary hover:prose-a:underline'>
          {children}
        </div>
      </main>

      <Footer variant='landing' />
    </div>
  );
}
