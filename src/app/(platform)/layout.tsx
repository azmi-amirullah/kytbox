import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';
import { userRoleSchema } from '@/lib/validation.schemas';
import { redirect } from 'next/navigation';
import { PlatformOverlays } from '@/components/platform-overlays';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getAuthenticatedUserAndProfile();

  if (!profile) {
    redirect('/onboarding');
  }

  const userData = {
    id: user.id,
    username: profile.username,
    email: user.email,
    avatar_url: profile.avatar_url,
    display_name: profile.display_name,
    role: userRoleSchema.parse(profile.role),
  };

  return (
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs />
      <Header
        variant='dashboard'
        user={userData}
        publicUrl={`/${profile.username}`}
      />
      <main className='relative z-20 flex-1 w-full pt-16'>{children}</main>
      <PlatformOverlays hasCompletedOnboarding={profile.has_completed_onboarding} />
      <Footer />
    </div>
  );
}
