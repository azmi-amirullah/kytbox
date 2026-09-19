'use client';

import * as React from 'react';
import {
  LuSearch,
  LuKeyboard,
  LuCar,
  LuWallet,
  LuLayoutGrid,
  LuGlobe,
} from 'react-icons/lu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCommandShortcut } from '@/lib/keyboard-shortcut';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Global' | 'Garage' | 'Cashflow' | 'List Kanban';
}

const CATEGORY_ICONS = {
  Global: LuGlobe,
  Garage: LuCar,
  Cashflow: LuWallet,
  'List Kanban': LuLayoutGrid,
};

export function KeyboardShortcutsModal() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const shortcut = useCommandShortcut();
  const isMac = shortcut === '⌘K';
  const modKey = isMac ? '⌘' : 'Ctrl';
  const shiftKey = isMac ? '⇧' : 'Shift';

  const shortcuts: ShortcutItem[] = React.useMemo(() => [
    // Global
    { keys: [modKey, 'K'], description: 'Global Command Palette & Quick Navigation', category: 'Global' },
    { keys: ['?'], description: 'Keyboard Shortcuts Cheatsheet (Shift + / anywhere outside text inputs)', category: 'Global' },
    { keys: ['Esc'], description: 'Close active modal, palette, or drawer', category: 'Global' },

    // Garage
    { keys: ['G'], description: 'Navigate to Garage Dashboard', category: 'Garage' },
    { keys: [modKey, shiftKey, 'F'], description: 'Quick Fuel Log Modal', category: 'Garage' },
    { keys: [modKey, shiftKey, 'S'], description: 'Log Vehicle Service Record', category: 'Garage' },

    // Cashflow
    { keys: ['C'], description: 'Navigate to Cashflow Books', category: 'Cashflow' },
    { keys: [modKey, shiftKey, 'E'], description: 'Quick New Cashflow Entry', category: 'Cashflow' },
    { keys: [modKey, shiftKey, 'X'], description: 'Export Cashflow to CSV/PDF', category: 'Cashflow' },

    // List Kanban
    { keys: ['L'], description: 'Navigate to List Hub', category: 'List Kanban' },
    { keys: ['N'], description: 'Add new card to default column', category: 'List Kanban' },
    { keys: ['/'], description: 'Focus board filter search bar', category: 'List Kanban' },
  ], [modKey, shiftKey]);

  // Global listener with input/editable guard
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      const target = e.target;

      const isInput =
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if (isInput) return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-keyboard-shortcuts', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-keyboard-shortcuts', handleCustomOpen);
    };
  }, []);

  const filteredShortcuts = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return shortcuts;
    return shortcuts.filter(
      (s) =>
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.keys.some((k) => k.toLowerCase().includes(q)),
    );
  }, [search, shortcuts]);

  const categories = ['Global', 'Garage', 'Cashflow', 'List Kanban'] as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-xl p-0 overflow-hidden bg-background border-border/80 shadow-2xl'>
        <DialogHeader className='p-6 pb-3 border-b border-border/60 bg-muted/20'>
          <div className='flex items-center gap-2.5'>
            <div className='p-2 rounded-xl bg-primary/10 text-primary'>
              <LuKeyboard className='w-5 h-5' />
            </div>
            <div>
              <DialogTitle className='text-lg font-semibold tracking-tight'>
                Keyboard Shortcuts Reference
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground mt-0.5'>
                Fast navigation and utility shortcuts across Kytbox.
              </DialogDescription>
            </div>
          </div>

          <div className='relative mt-3'>
            <LuSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Filter shortcuts by name or key...'
              className='pl-9 h-9 text-xs bg-background/80'
            />
          </div>
        </DialogHeader>

        <div className='p-6 pt-3 max-h-[60vh] overflow-y-auto space-y-6'>
          {categories.map((category) => {
            const items = filteredShortcuts.filter((s) => s.category === category);
            if (items.length === 0) return null;
            const CategoryIcon = CATEGORY_ICONS[category];

            return (
              <div key={category} className='space-y-2.5'>
                <div className='flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  <CategoryIcon className='w-3.5 h-3.5 text-primary' />
                  <span>{category}</span>
                </div>
                <div className='space-y-1.5'>
                  {items.map((shortcut) => (
                    <div
                      key={shortcut.description}
                      className='flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors text-sm'
                    >
                      <span className='text-foreground text-xs sm:text-sm'>
                        {shortcut.description}
                      </span>
                      <div className='flex items-center gap-1 shrink-0'>
                        {shortcut.keys.map((k) => (
                          <kbd
                            key={k}
                            className='min-w-6 h-6 px-1.5 flex items-center justify-center font-mono text-[11px] font-semibold text-foreground bg-secondary/80 border border-border/80 rounded shadow-xs'
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredShortcuts.length === 0 && (
            <div className='py-8 text-center text-xs text-muted-foreground'>
              No keyboard shortcuts matching &quot;{search}&quot;
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
