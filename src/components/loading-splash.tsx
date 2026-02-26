'use client';

import { LuSparkles } from 'react-icons/lu';

export function LoadingSplash() {
  return (
    <div
      role='status'
      aria-live='polite'
      className='fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden bg-background'
    >
      {/* Dynamic Background Accents */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] h-[40%] w-[40%] animate-pulse rounded-full bg-primary/5 blur-[120px]' />
        <div className='absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] animate-pulse rounded-full bg-primary/10 blur-[120px] [animation-delay:1s]' />
      </div>

      <div className='relative flex flex-col items-center'>
        {/* Animated Icon Container */}
        <div className='relative flex h-24 w-24 items-center justify-center'>
          {/* Rotating Rings */}
          <div className='absolute inset-0 rounded-full border border-primary/10' />
          <div className='absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-t-2 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]' />
          <div className='absolute inset-2 animate-[spin_2s_linear_infinite_reverse] rounded-full border-b border-primary/40' />

          {/* Center Icon */}
          <div className='relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-md shadow-inner'>
            <LuSparkles className='h-7 w-7 text-primary animate-pulse' />
          </div>
        </div>
      </div>

      <span className='sr-only'>Loading Kytbox...</span>
    </div>
  );
}
