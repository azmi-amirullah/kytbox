'use client'

import { useEffect, useState } from 'react'
import { ErrorState } from '@/components/ui/error-state'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import * as Sentry from '@sentry/nextjs'

export default function CashflowRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  const isNetworkError =
    error?.message?.toLowerCase().includes('load failed') ||
    error?.message?.toLowerCase().includes('failed to fetch') ||
    error?.message?.toLowerCase().includes('networkerror') ||
    error?.name === 'AbortError'

  useEffect(() => {
    console.error('Cashflow Route Error:', error, { path: pathname })
    Sentry.captureException(error, {
      tags: { path: pathname, is_network_error: isNetworkError ? 'true' : 'false' },
      extra: { digest: error.digest },
      level: isNetworkError ? 'warning' : 'error',
    })

    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    }

    checkAuth()
  }, [error, pathname, isNetworkError])

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
  )

  return (
    <div className='flex items-center justify-center min-h-125 w-full p-6'>
      <ErrorState
        variant='card'
        title={isNetworkError ? 'Connection Interrupted' : 'Cashflow System Error'}
        context={pathname}
        description={
          isNetworkError ? (
            <>
              We couldn&apos;t refresh the view because the network connection was interrupted.
              Any saved changes are safe in your account.
            </>
          ) : (
            <>
              We couldn&apos;t load the cashflow details. Please try again or
              contact us at {supportLink}.
            </>
          )
        }
        retryAction={reset}
      />
    </div>
  )
}
