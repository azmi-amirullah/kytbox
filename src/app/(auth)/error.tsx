'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { usePathname } from 'next/navigation';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error('Auth System Error:', error, { path: pathname });
  }, [error, pathname]);

  return (
    <div className='flex items-center justify-center min-h-[500px] w-full p-6'>
      <ErrorState
        variant='card'
        title='Authentication Error'
        context={pathname}
        description={
          <>
            We encountered an issue with the login system. Please try again or
            email us at{' '}
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
