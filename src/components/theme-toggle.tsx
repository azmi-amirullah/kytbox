'use client';

import * as React from 'react';
import { LuMoon, LuSun } from 'react-icons/lu';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Skeleton className='h-8 w-8 md:h-9 md:w-9 rounded-full' />;
  }

  return (
    <Button
      variant='outline'
      size='icon'
      className='h-8 w-8 md:h-9 md:w-9 rounded-full'
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <LuMoon className='h-4 w-4' />
      ) : (
        <LuSun className='h-4 w-4' />
      )}
      <span className='sr-only'>Toggle theme</span>
    </Button>
  );
}
