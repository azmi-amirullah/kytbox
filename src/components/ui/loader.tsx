import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  text?: string;
  variant?: 'brand' | 'minimal';
}

const sizeConfig = {
  sm: {
    container: 'size-4',
    strokeWidth: 2,
    text: 'text-[11px] mt-2',
  },
  md: {
    container: 'size-8',
    strokeWidth: 2.5,
    text: 'text-xs mt-3',
  },
  lg: {
    container: 'size-12',
    strokeWidth: 3,
    text: 'text-sm mt-4',
  },
  xl: {
    container: 'size-18',
    strokeWidth: 3.5,
    text: 'text-sm font-medium mt-5 tracking-wide',
  },
} as const;

export function Loader({
  size,
  fullScreen = false,
  text = 'Loading...',
  variant = 'brand',
  className,
  ...props
}: LoaderProps) {
  const gradientId = React.useId();
  const activeSize = size ?? (fullScreen ? 'xl' : 'lg');
  const config = sizeConfig[activeSize];

  return (
    <div
      role='status'
      aria-live='polite'
      className={cn(
        'flex flex-col items-center justify-center',
        fullScreen
          ? 'fixed inset-0 z-100 h-dvh w-dvw m-0 bg-background/80 backdrop-blur-md'
          : activeSize === 'lg' || activeSize === 'xl'
            ? 'flex-1 min-h-[calc(100dvh-12rem)] w-full py-12'
            : 'w-full py-4',
        className,
      )}
      {...props}
    >
      <div className={cn('relative flex items-center justify-center', config.container)}>
        {/* Precision tapered conic orbital spinner */}
        <svg
          className='size-full animate-spin duration-700 motion-reduce:animate-none'
          viewBox='0 0 32 32'
          aria-hidden='true'
        >
          <defs>
            <linearGradient id={gradientId} x1='0%' y1='0%' x2='100%' y2='100%'>
              <stop offset='0%' stopColor='currentColor' stopOpacity='1' />
              <stop offset='60%' stopColor='currentColor' stopOpacity='0.25' />
              <stop offset='100%' stopColor='currentColor' stopOpacity='0' />
            </linearGradient>
          </defs>
          {/* Subtle faint track */}
          {variant !== 'minimal' && (
            <circle
              cx='16'
              cy='16'
              r='13'
              fill='none'
              stroke='currentColor'
              strokeWidth={config.strokeWidth}
              className='text-muted/25'
            />
          )}
          {/* Tapered active gradient arc */}
          <circle
            cx='16'
            cy='16'
            r='13'
            fill='none'
            stroke={`url(#${gradientId})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap='round'
            className='text-primary'
          />
        </svg>
      </div>

      {text && (
        <p
          aria-hidden='true'
          className={cn(
            'font-sans font-medium text-muted-foreground select-none',
            config.text,
          )}
        >
          {text}
        </p>
      )}
      <span className='sr-only'>{text || 'Loading...'}</span>
    </div>
  );
}

export { Loader as BrandLoader };


