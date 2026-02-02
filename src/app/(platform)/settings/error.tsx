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
    console.error('Settings Error:', error);
  }, [error]);

  return (
    <div className='flex items-center justify-center min-h-[500px] w-full'>
      <ErrorState
        title='Settings unavailable'
        description='We couldn’t load your settings. Please try again in a moment.'
        retryAction={reset}
      />
    </div>
  );
}
