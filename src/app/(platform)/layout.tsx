import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';
import { userRoleSchema } from '@/lib/validation.schemas';
import { redirect } from 'next/navigation';
import { PlatformOverlays } from '@/components/platform-overlays';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kytbox App',
  },
};

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
        publicUrl={`${siteConfig.url}/${profile.username}`}
      />
      <main className='relative z-20 flex-1 w-full pt-16'>{children}</main>
      <PlatformOverlays hasCompletedOnboarding={profile.has_completed_onboarding} />
      <Footer />
    </div>
  );
}
