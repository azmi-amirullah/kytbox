'use client';

import { FiAlertTriangle } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ErrorStateProps {
  title?: string;
  description?: string | React.ReactNode;
  context?: string;
  retryAction?: () => void;
  variant?: 'default' | 'card';
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error while loading this content.',
  context,
  retryAction,
  variant = 'default',
  className,
}: ErrorStateProps) {
  const router = useRouter();

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 md:p-16 rounded-2xl md:rounded-3xl border-2 border-dashed bg-card/50 backdrop-blur-sm text-center animate-in fade-in zoom-in-95 duration-300 w-full max-w-2xl mx-auto shadow-sm',
          className,
        )}
      >
        <div className='w-12 h-12 md:w-16 md:h-16 rounded-full bg-red-100/50 flex items-center justify-center mb-4 md:mb-6 text-red-500 ring-4 md:ring-8 ring-red-50/20'>
          <FiAlertTriangle className='w-6 h-6 md:w-8 md:h-8' />
        </div>
        <h3 className='text-2xl font-bold mb-2 tracking-tight'>{title}</h3>
        {context && (
          <div className='mb-4 px-2 py-1 bg-muted/50 rounded-lg border text-xs font-mono text-muted-foreground'>
            Path: {context}
          </div>
        )}
        <p className='text-muted-foreground text-lg max-w-md mb-8 text-balance leading-relaxed'>
          {description}
        </p>

        <div className='flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto'>
          <Button
            variant='outline'
            size='lg'
            className='rounded-full px-8 w-full sm:w-auto order-2 sm:order-1'
            onClick={() => router.back()}
          >
            Go Back
          </Button>
          {retryAction && (
            <Button
              size='lg'
              className='rounded-full px-8 w-full sm:w-auto order-1 sm:order-2'
              onClick={retryAction}
            >
              Try Again
            </Button>
          )}
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
