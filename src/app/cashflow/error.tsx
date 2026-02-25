'use client';

import { useEffect, useState } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CashflowRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    console.error('Cashflow Route Error:', error, { path: pathname });

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
    <div className='flex items-center justify-center min-h-[500px] w-full p-6'>
      <ErrorState
        variant='card'
        title='Cashflow System Error'
        context={pathname}
        description={
          <>
            We couldn&apos;t load the cashflow details. Please try again or
            contact us at {supportLink}.
          </>
        }
        retryAction={reset}
      />
    </div>
  );
}
