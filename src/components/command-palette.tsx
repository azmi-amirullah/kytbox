'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
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
  LuLink,
  LuSquareCheck,
  LuLoader,
  LuFileText,
  LuTarget,
  LuBookmark,
  LuLightbulb,
} from 'react-icons/lu'

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { globalSearch } from '@/features/search'
import type { GlobalSearchResult, SearchResultItem } from '@/features/search'
import type { IconType } from 'react-icons'

const CATEGORY_CONFIG: Record<keyof GlobalSearchResult, { label: string; icon: IconType }> = {
  bio: { label: 'Bio Links', icon: LuLink },
  cashflow: { label: 'Cashflow', icon: LuWallet },
  list: { label: 'List', icon: LuSquareCheck },
  support: { label: 'Support', icon: LuLifeBuoy },
  invoice: { label: 'Invoices', icon: LuFileText },
}

const ITEM_ICONS: Record<NonNullable<SearchResultItem['icon']>, IconType> = {
  wallet: LuWallet,
  target: LuTarget,
  link: LuLink,
  list: LuSquareCheck,
  ticket: LuLifeBuoy,
  invoice: LuFileText,
  idea: LuLightbulb,
  wishlist: LuBookmark,
  todo: LuSquareCheck,
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<GlobalSearchResult | null>(null)
  const [isSearching, startTransition] = React.useTransition()
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  React.useEffect(() => {
    const handleToggle = () => {
      setOpen((open) => !open)
    }
    window.addEventListener('toggle-command-palette', handleToggle)
    return () =>
      window.removeEventListener('toggle-command-palette', handleToggle)
  }, [])

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setQuery('')
      setResults(null)
    }
  }, [open])

  // Scroll to top when query or results change
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0
    }
  }, [query, results])

  // Debounced search
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setResults(null)
      return
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await globalSearch(query)
        setResults(data)
      })
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  const hasResults = results &&
    (results.bio.length > 0 ||
      results.cashflow.length > 0 ||
      results.list.length > 0 ||
      results.support.length > 0 ||
      results.invoice.length > 0)

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder='Search across workspace...'
        value={query}
        onValueChange={setQuery}
      />
      <CommandList ref={listRef}>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Loading indicator */}
        {isSearching && (
          <div className='flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground'>
            <LuLoader className='size-3.5 animate-spin' />
            <span>Searching workspace...</span>
          </div>
        )}

        {/* Dynamic search results from API */}
        {(['bio', 'cashflow', 'list', 'support', 'invoice'] satisfies Array<keyof typeof CATEGORY_CONFIG>).map(
          (category) => {
            const items = results?.[category] ?? []
            const config = CATEGORY_CONFIG[category]
            const Icon = config.icon
            return (
              <CommandGroup
                key={category}
                heading={items.length > 0 ? config.label : undefined}
                className={items.length === 0 ? 'hidden' : undefined}
              >
                {items.map((item: SearchResultItem) => {
                  const ItemIcon = (item.icon && ITEM_ICONS[item.icon]) ? ITEM_ICONS[item.icon] : Icon
                  return (
                    <CommandItem
                      key={item.id}
                      value={`${item.title} ${item.subtitle ?? ''} ${item.id}`}
                      onSelect={() =>
                        runCommand(() => router.push(item.href))
                      }
                    >
                      <ItemIcon className='mr-2 h-4 w-4 shrink-0' />
                      <div className='flex min-w-0 flex-1 flex-col'>
                        <span className='truncate'>{item.title}</span>
                        {item.subtitle && (
                          <span className='truncate text-xs text-muted-foreground'>
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )
          },
        )}
        <CommandSeparator className={hasResults ? undefined : 'hidden'} />

        {/* Static navigation */}
        <CommandGroup heading='Navigation'>
          <CommandItem
            value='Bio Dashboard navigation bio profile'
            onSelect={() => runCommand(() => router.push('/bio'))}
          >
            <LuUser className='mr-2 h-4 w-4' />
            <span>Bio Dashboard</span>
          </CommandItem>
          <CommandItem
            value='Bio Analytics analytics stats bio profile metrics'
            onSelect={() => runCommand(() => router.push('/bio/analytics'))}
          >
            <LuActivity className='mr-2 h-4 w-4' />
            <span>Bio Analytics</span>
          </CommandItem>
          <CommandItem
            value='Cashflow wallet finances money budget expenses income'
            onSelect={() => runCommand(() => router.push('/cashflow'))}
          >
            <LuWallet className='mr-2 h-4 w-4' />
            <span>Cashflow</span>
          </CommandItem>
          <CommandItem
            value='List Hub tasks todo wishlist ideas list board'
            onSelect={() => runCommand(() => router.push('/list'))}
          >
            <LuLayoutGrid className='mr-2 h-4 w-4' />
            <span>List Hub</span>
          </CommandItem>
          <CommandItem
            value='Invoice Hub billing invoices client payments estimates'
            onSelect={() => runCommand(() => router.push('/invoice'))}
          >
            <LuFileText className='mr-2 h-4 w-4' />
            <span>Invoices</span>
          </CommandItem>
          <CommandItem
            value='Settings preferences config account security'
            onSelect={() => runCommand(() => router.push('/settings'))}
          >
            <LuSettings className='mr-2 h-4 w-4' />
            <span>Settings</span>
          </CommandItem>
          <CommandItem
            value='Support help tickets contact customer service'
            onSelect={() => runCommand(() => router.push('/support'))}
          >
            <LuLifeBuoy className='mr-2 h-4 w-4' />
            <span>Support</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading='Quick Actions'>
          <CommandItem
            value='Add Bio Link create new link bio url'
            onSelect={() => runCommand(() => router.push('/bio?action=add'))}
          >
            <LuPlus className='mr-2 h-4 w-4' />
            <span>Add Bio Link</span>
          </CommandItem>
          <CommandItem
            value='Add Cashflow Entry transaction expense income cashflow money'
            onSelect={() =>
              runCommand(() => router.push('/cashflow?action=add'))
            }
          >
            <LuPlus className='mr-2 h-4 w-4' />
            <span>Add Cashflow Entry</span>
          </CommandItem>
          <CommandItem
            value='New Todo Board task create list kanban'
            onSelect={() =>
              runCommand(() => router.push('/list/todo?action=create'))
            }
          >
            <LuPlus className='mr-2 h-4 w-4' />
            <span>New Todo Board</span>
          </CommandItem>
          <CommandItem
            value='New Wishlist create list items buy'
            onSelect={() =>
              runCommand(() => router.push('/list/wishlist?action=create'))
            }
          >
            <LuPlus className='mr-2 h-4 w-4' />
            <span>New Wishlist</span>
          </CommandItem>
          <CommandItem
            value='New Idea List create list brain brainstorm'
            onSelect={() =>
              runCommand(() => router.push('/list/ideas?action=create'))
            }
          >
            <LuPlus className='mr-2 h-4 w-4' />
            <span>New Idea List</span>
          </CommandItem>
          <CommandItem
            value='New Invoice create invoice bill client billing'
            onSelect={() =>
              runCommand(() => router.push('/invoice?action=create'))
            }
          >
            <LuPlus className='mr-2 h-4 w-4' />
            <span>New Invoice</span>
          </CommandItem>
          <CommandItem
            value='New Support Ticket help create support bug report issue'
            onSelect={() => runCommand(() => router.push('/support/new'))}
          >
            <LuPlus className='mr-2 h-4 w-4' />
            <span>New Support Ticket</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading='Theme'>
          {theme !== 'light' && (
            <CommandItem
              value='Toggle Light Mode theme light mode white'
              onSelect={() => runCommand(() => setTheme('light'))}
            >
              <LuSun className='mr-2 h-4 w-4' />
              <span>Toggle Light Mode</span>
            </CommandItem>
          )}
          {theme !== 'dark' && (
            <CommandItem
              value='Toggle Dark Mode theme dark mode black night'
              onSelect={() => runCommand(() => setTheme('dark'))}
            >
              <LuMoon className='mr-2 h-4 w-4' />
              <span>Toggle Dark Mode</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

