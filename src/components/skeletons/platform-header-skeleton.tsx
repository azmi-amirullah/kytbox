import { BrandLogo } from '@/components/brand-logo';

export function PlatformHeaderSkeleton() {
  return (
    <header className='sticky top-0 z-50 w-full border-b border-border bg-background/60 backdrop-blur-md transition-all duration-200'>
      <div className='max-w-7xl mx-auto px-4 h-16 flex items-center justify-between'>
        <div className='opacity-80'>
          <BrandLogo />
        </div>

        <div className='flex items-center gap-3 md:gap-4'>
          {/* Theme Toggle placeholder */}
          <div className='w-9 h-9 rounded-md bg-muted/50 animate-pulse' />
          {/* User Nav placeholder */}
          <div className='w-8 h-8 rounded-full bg-muted/50 animate-pulse' />
        </div>
      </div>
    </header>
  );
}
