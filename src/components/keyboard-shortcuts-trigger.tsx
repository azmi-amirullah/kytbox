'use client';

import { LuCircleHelp } from 'react-icons/lu';

export function KeyboardShortcutsTrigger() {
  return (
    <button
      id='keyboard-shortcuts-trigger'
      type='button'
      onClick={() => window.dispatchEvent(new CustomEvent('open-keyboard-shortcuts'))}
      className='flex items-center justify-center relative h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-secondary/40 border border-border/80 text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all cursor-pointer shrink-0 group'
      aria-label='Keyboard shortcuts (?)'
      title='Keyboard shortcuts (?)'
    >
      <LuCircleHelp className='size-4 text-muted-foreground group-hover:text-foreground transition-colors' />
    </button>
  );
}
