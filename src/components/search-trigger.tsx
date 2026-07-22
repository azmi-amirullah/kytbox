'use client';

import { LuSearch } from 'react-icons/lu';

export function SearchTrigger() {
  return (
    <button
      id='tour-search-trigger'
      onClick={() => window.dispatchEvent(new CustomEvent('toggle-command-palette'))}
      className='flex items-center justify-center gap-2 h-8 w-8 sm:h-9 sm:w-auto px-0 sm:px-3 text-xs font-medium text-foreground bg-secondary/40 border border-border/80 rounded-full hover:bg-secondary/80 transition-all cursor-pointer shrink-0'
      aria-label='Search commands'
      title='Search commands (⌘K)'
    >
      <LuSearch className='w-4 h-4 shrink-0' />
      <span className='hidden sm:inline'>Search...</span>
      <kbd className='pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded-full bg-muted px-2 font-mono text-[10px] font-medium text-foreground opacity-100'>
        <span className='text-xs'>⌘</span>K
      </kbd>
    </button>
  );
}
