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
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className='flex items-center justify-center min-h-[500px] w-full'>
      <ErrorState
        title='Dashboard Error'
        description='We couldn’t load your dashboard. This might be a temporary connection issue.'
        retryAction={reset}
      />
    </div>
  );
}
