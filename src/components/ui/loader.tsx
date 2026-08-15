import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface LoaderProps {
  fullScreen?: boolean;
  text?: string;
  className?: string;
}

export function Loader({
  fullScreen = false,
  text = 'Loading...',
  className,
}: LoaderProps) {
  return (
    <div
      role='status'
      aria-live='polite'
      className={cn(
        'flex flex-col items-center justify-center w-full',
        fullScreen
          ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-md'
          : 'min-h-[60vh] py-12',
        className,
      )}
    >
      <div className='relative flex items-center justify-center'>
        {/* Glow behind the spinner */}
        <div className='absolute w-24 h-24 rounded-full bg-primary/20 blur-xl animate-pulse' />

        {/* Spinner outer ring */}
        <div className='w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin' />

        {/* Center brand logo image */}
        <div className='absolute flex items-center justify-center animate-pulse'>
          <Image
            src='/icon.png'
            alt='Kytbox'
            width={28}
            height={28}
            className='size-7 rounded-md object-cover shadow-xs'
          />
        </div>
      </div>

      {text && (
        <p className='mt-6 text-sm font-medium text-muted-foreground tracking-wide animate-pulse'>
          {text}
        </p>
      )}
      <span className='sr-only'>{text}</span>
    </div>
  );
}

export { Loader as BrandLoader };

