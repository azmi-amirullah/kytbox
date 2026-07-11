'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  LuLayoutGrid,
  LuWallet,
  LuPlus,
  LuSettings,
  LuLifeBuoy,
  LuSun,
  LuMoon,
  LuUser,
  LuActivity,
} from 'react-icons/lu';

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  React.useEffect(() => {
    const handleToggle = () => {
      setOpen((open) => !open);
    };
    window.addEventListener('toggle-command-palette', handleToggle);
    return () =>
      window.removeEventListener('toggle-command-palette', handleToggle);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Type a command or search...' />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading='Navigation'>
          <CommandItem onSelect={() => runCommand(() => router.push('/bio'))}>
            <LuUser className='mr-2 h-4 w-4' />
            <span>Bio Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/bio/analytics'))}
          >
            <LuActivity className='mr-2 h-4 w-4' />
            <span>Bio Analytics</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/cashflow'))}
          >
            <LuWallet className='mr-2 h-4 w-4' />
            <span>Cashflow</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/list'))}>
            <LuLayoutGrid className='mr-2 h-4 w-4' />
            <span>List Hub</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/settings'))}
          >
            <LuSettings className='mr-2 h-4 w-4' />
            <span>Settings</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/support'))}
          >
            <LuLifeBuoy className='mr-2 h-4 w-4' />
            <span>Support</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading='Quick Actions'>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/bio?action=add'))}
          >
            <LuPlus className='mr-2 h-4 w-4' />
            <span>Add Bio Link</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push('/cashflow?action=add'))
            }
          >
            <LuPlus className='mr-2 h-4 w-4' />
            <span>Add Cashflow Entry</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push('/list/todo?action=create'))
            }
          >
            <LuPlus className='mr-2 h-4 w-4' />
            <span>New Todo Board</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push('/list/wishlist?action=create'))
            }
          >
            <LuPlus className='mr-2 h-4 w-4' />
            <span>New Wishlist</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push('/list/ideas?action=create'))
            }
          >
            <LuPlus className='mr-2 h-4 w-4' />
            <span>New Idea List</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/support/new'))}
          >
            <LuPlus className='mr-2 h-4 w-4' />
            <span>New Support Ticket</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading='Theme'>
          {theme !== 'light' && (
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <LuSun className='mr-2 h-4 w-4' />
              <span>Toggle Light Mode</span>
            </CommandItem>
          )}
          {theme !== 'dark' && (
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <LuMoon className='mr-2 h-4 w-4' />
              <span>Toggle Dark Mode</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
