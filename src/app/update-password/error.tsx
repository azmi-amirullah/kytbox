'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { usePathname } from 'next/navigation';

export default function UpdatePasswordError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error('Update Password Error:', error, { path: pathname });
  }, [error, pathname]);

  return (
    <div className='flex items-center justify-center min-h-screen w-full p-6 bg-background'>
      <ErrorState
        variant='card'
        title='Security Error'
        context={pathname}
        description={
          <>
            We couldn&apos;t update your password. Please try again or email us
            directly at{' '}
            <a
              href='mailto:support@kytbox.com'
              className='text-primary underline hover:opacity-80'
            >
              support@kytbox.com
            </a>
          </>
        }
        retryAction={reset}
      />
    </div>
  );
}
