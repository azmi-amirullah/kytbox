'use client';

import { useEffect, useState } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Application Error:', error, { path: pathname });
    Sentry.captureException(error, {
      tags: { path: pathname },
      extra: { digest: error.digest },
    });

    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };

    checkAuth();
  }, [error, pathname]);

  const supportLink = isLoggedIn ? (
    <Link href='/support' className='text-primary underline hover:opacity-80'>
      Support Page
    </Link>
  ) : (
    <a
      href='mailto:support@kytbox.com'
      className='text-primary underline hover:opacity-80'
    >
      support@kytbox.com
    </a>
  );

  return (
    <div className='flex items-center justify-center min-h-screen w-full bg-background p-6'>
      <ErrorState
        variant='card'
        title='Something went wrong'
        context={pathname}
        description={
          <>
            We encountered a critical error. Please try refreshing. If it
            persists, contact us via {supportLink}.
          </>
        }
        retryAction={reset}
      />
    </div>
  );
}
