import type { Metadata } from 'next';
import { BackgroundBlobs } from '@/components/background-blobs';

export const metadata: Metadata = {
  title: 'Kytbox - Authentication',
  description: 'Login or create an account',
};

import { Header } from '@/components/header';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='relative min-h-screen w-full flex flex-col pt-16'>
      {/* Unified Header - Auth Variant */}
      <Header variant='auth' />

      <div className='relative flex-1 flex items-center justify-center p-4'>
        {/* Shared Background */}
        <BackgroundBlobs />

        {/* Content */}
        <div className='relative z-10 w-full max-w-md'>
          {children}
          <div className='mt-8 text-center text-xs text-muted-foreground'>
            <p>© 2026 Kytbox. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
