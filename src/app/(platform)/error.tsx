'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error('Platform Error:', error, { path: pathname });
    Sentry.captureException(error, {
      tags: { path: pathname },
      extra: { digest: error.digest },
    });
  }, [error, pathname]);

  return (
    <div className='flex items-center justify-center min-h-[400px] md:min-h-[600px] w-full p-4 md:p-12'>
      <ErrorState
        variant='card'
        title='Platform Error'
        context={pathname}
        description={
          <>
            We couldn’t load this part of your dashboard. If the problem
            persists, please report it via our{' '}
            <Link
              href='/support'
              className='text-primary underline hover:opacity-80'
            >
              Support Page
            </Link>
            .
          </>
        }
        retryAction={reset}
      />
    </div>
  );
}
