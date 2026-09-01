'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LuArrowUpDown,
  LuCheck,
  LuClock,
  LuCalendar,
  LuArrowDownAZ,
  LuCoins,
} from 'react-icons/lu'
import { cn } from '@/lib/utils'
import type { SortOption } from '@/lib/sorting'

export interface SortOptionItem {
  value: SortOption
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

export const DEFAULT_SORT_OPTIONS: SortOptionItem[] = [
  { value: 'last_activity', label: 'Last Activity', icon: LuClock },
  { value: 'created_desc', label: 'Newest Created', icon: LuCalendar },
  { value: 'created_asc', label: 'Oldest Created', icon: LuCalendar },
  { value: 'title_asc', label: 'Alphabetical (A - Z)', icon: LuArrowDownAZ },
  { value: 'metric_desc', label: 'Highest Balance', icon: LuCoins },
]

interface SortSelectorProps {
  value: SortOption
  onChange: (value: SortOption) => void
  options?: SortOptionItem[]
  label?: string
  className?: string
}

export function SortSelector({
  value,
  onChange,
  options = DEFAULT_SORT_OPTIONS,
  label = 'Sort by',
  className,
}: SortSelectorProps) {
  const activeOption = options.find((opt) => opt.value === value) || options[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className={cn(
            'h-9 gap-1.5 px-3 text-xs font-medium border-border/60 hover:bg-accent/60 bg-card/50 backdrop-blur-sm cursor-pointer',
            className,
          )}
          aria-label={`${label}: ${activeOption.label}`}
        >
          <LuArrowUpDown className='w-3.5 h-3.5 text-muted-foreground' />
          <span className='hidden sm:inline text-muted-foreground'>{label}:</span>
          <span className='font-semibold text-foreground truncate max-w-30 sm:max-w-none'>
            {activeOption.label}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuLabel className='text-xs font-semibold text-muted-foreground'>
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => {
          const Icon = option.icon
          const isSelected = option.value === value
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className='flex items-center justify-between text-xs cursor-pointer py-2'
            >
              <div className='flex items-center gap-2 truncate'>
                {Icon && <Icon className='w-3.5 h-3.5 text-muted-foreground shrink-0' />}
                <span className={cn(isSelected && 'font-semibold text-primary')}>
                  {option.label}
                </span>
              </div>
              {isSelected && <LuCheck className='w-3.5 h-3.5 text-primary shrink-0 ml-2' />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
