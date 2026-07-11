'use client';

import { LuSearch } from 'react-icons/lu';

export function SearchTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('toggle-command-palette'))}
      className='flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-secondary/40 border border-border/80 rounded-lg hover:bg-secondary/80 hover:text-foreground transition-all cursor-pointer'
      aria-label='Search commands'
    >
      <LuSearch className='w-4 h-4' />
      <span className='hidden sm:inline'>Search...</span>
      <kbd className='pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100'>
        <span className='text-xs'>⌘</span>K
      </kbd>
    </button>
  );
}
