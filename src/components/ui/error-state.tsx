'use client';

import { FiAlertTriangle } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ErrorStateProps {
  title?: string;
  description?: string;
  retryAction?: () => void;
  variant?: 'default' | 'card';
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error while loading this content.',
  retryAction,
  variant = 'default',
  className,
}: ErrorStateProps) {
  const router = useRouter();

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 rounded-xl border border-dashed text-center animate-in fade-in zoom-in-95 duration-300',
          className,
        )}
      >
        <div className='w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500'>
          <FiAlertTriangle className='w-6 h-6' />
        </div>
        <h3 className='text-lg font-semibold mb-2'>{title}</h3>
        <p className='text-sm text-muted-foreground max-w-[300px] mb-6 text-balance'>
          {description}
        </p>
        <div className='flex gap-3'>
          <Button variant='outline' onClick={() => router.back()}>
            Go Back
          </Button>
          {retryAction && <Button onClick={retryAction}>Try Again</Button>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px] p-6 text-center animate-in fade-in zoom-in-95 duration-300',
        className,
      )}
    >
      <div className='w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6 text-red-500 ring-4 ring-red-50/50'>
        <FiAlertTriangle className='w-8 h-8' />
      </div>
      <h2 className='text-2xl font-bold tracking-tight mb-3'>{title}</h2>
      <p className='text-muted-foreground max-w-md mb-8 text-balance'>
        {description}
      </p>
      <div className='flex gap-4'>
        <Button variant='outline' size='lg' onClick={() => router.back()}>
          Go Back
        </Button>
        {retryAction && (
          <Button size='lg' onClick={retryAction}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
