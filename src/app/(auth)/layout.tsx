import type { Metadata } from 'next';
import { ThemeToggle } from '@/components/theme-toggle';
import { BackgroundBlobs } from '@/components/background-blobs';

export const metadata: Metadata = {
  title: 'UKIT - Authentication',
  description: 'Login or create an account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='relative min-h-screen w-full flex items-center justify-center'>
      {/* Theme Toggle */}
      <div className='absolute top-4 right-4 z-20'>
        <ThemeToggle />
      </div>

      {/* Shared Background */}
      <BackgroundBlobs />

      {/* Content */}
      <div className='relative z-10 w-full max-w-md p-4'>
        {children}
        <div className='mt-8 text-center text-xs text-muted-foreground'>
          <p>© {new Date().getFullYear()} UKIT. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
