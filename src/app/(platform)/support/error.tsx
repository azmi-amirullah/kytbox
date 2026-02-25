'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { usePathname } from 'next/navigation';

export default function SupportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error('Support System Error:', error, { path: pathname });
  }, [error, pathname]);

  return (
    <div className='flex items-center justify-center min-h-[500px] w-full p-6'>
      <ErrorState
        variant='card'
        title='Support System Unavailable'
        context={pathname}
        description={
          <>
            We couldn&apos;t load the support system. Since you can&apos;t
            report bugs here, please email us directly at{' '}
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
