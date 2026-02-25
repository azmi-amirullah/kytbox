'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Application Error:', error, { path: pathname });
  }, [error, pathname]);

  return (
    <html>
      <body>
        <div className='flex items-center justify-center min-h-screen w-full bg-background'>
          <ErrorState
            variant='card'
            title='Something went wrong'
            context={pathname}
            description={
              <>
                We encountered a critical error. Please try refreshing. If it
                persists, report it via our{' '}
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
      </body>
    </html>
  );
}
