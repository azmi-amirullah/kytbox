'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Public Profile Error:', error);
  }, [error]);

  return (
    <div className='flex items-center justify-center min-h-screen w-full bg-neutral-50 dark:bg-neutral-900'>
      <ErrorState
        title='Profile unavailable'
        description='We couldn’t find this profile or something went wrong. Please check the URL or try again.'
        retryAction={reset}
        variant='default'
      />
    </div>
  );
}
