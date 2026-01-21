'use client';

import * as React from 'react';
import { LuMoon, LuSun } from 'react-icons/lu';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant='ghost' size='icon' disabled>
        <LuSun className='h-4 w-4' />
      </Button>
    );
  }

  return (
    <Button
      variant='outline'
      size='icon'
      className='rounded-full'
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <LuSun className='h-4 w-4' />
      ) : (
        <LuMoon className='h-4 w-4' />
      )}
      <span className='sr-only'>Toggle theme</span>
    </Button>
  );
}
