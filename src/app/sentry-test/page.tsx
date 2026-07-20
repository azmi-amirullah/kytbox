'use client';

import { Button } from '@/components/ui/button';

export default function SentryTestPage() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen gap-4 bg-background p-6'>
      <h1 className='text-2xl font-bold'>Sentry Integration Test</h1>
      <p className='text-muted-foreground text-sm max-w-md text-center'>
        Click the button below to throw a runtime exception. Then check your Sentry dashboard to verify it is received.
      </p>
      <Button
        onClick={() => {
          throw new Error('Sentry Test Error: ' + new Date().toISOString());
        }}
        variant='destructive'
      >
        Throw Test Error
      </Button>
    </div>
  );
}
