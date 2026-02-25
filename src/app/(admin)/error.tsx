'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error('Admin Panel Error:', error, { path: pathname });
  }, [error, pathname]);

  return (
    <div className='flex items-center justify-center min-h-[500px] w-full p-6'>
      <ErrorState
        variant='card'
        title='Admin Panel Error'
        context={pathname}
        description={
          <>
            We encountered an issue in the admin area. If this persists, please
            report it via the{' '}
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
