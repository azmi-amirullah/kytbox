'use client'

import * as React from 'react'
import { format, parseISO } from 'date-fns'
import { LuCalendar } from 'react-icons/lu'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface DatePickerProps {
  id?: string
  name?: string
  value?: string | Date | null
  onChange?: (dateString: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  align?: 'center' | 'start' | 'end'
}

function parseDateValue(value?: string | Date | null): Date | undefined {
  if (!value) return undefined
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value
  }
  if (typeof value === 'string') {
    // If format is YYYY-MM-DD, parse as local calendar date to avoid timezone shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number)
      return new Date(y, m - 1, d)
    }
    try {
      const parsed = parseISO(value)
      return isNaN(parsed.getTime()) ? undefined : parsed
    } catch {
      return undefined
    }
  }
  return undefined
}

export function DatePicker({
  id,
  name,
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  disabled = false,
  align = 'start',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDate = React.useMemo(() => parseDateValue(value), [value])

  function handleSelect(date: Date | undefined) {
    if (!date) {
      onChange?.('')
    } else {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      onChange?.(`${year}-${month}-${day}`)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          name={name}
          type='button'
          variant='outline'
          disabled={disabled}
          className={cn(
            'w-full h-9 justify-start text-left font-normal bg-card px-3 text-sm text-foreground shadow-xs border-input transition-colors hover:bg-accent/40',
            !selectedDate && 'text-muted-foreground',
            className,
          )}
        >
          <LuCalendar className='mr-2.5 h-4 w-4 text-muted-foreground shrink-0' />
          {selectedDate ? (
            <span className='truncate font-medium text-foreground'>
              {format(selectedDate, 'dd MMM yyyy')}
            </span>
          ) : (
            <span className='text-muted-foreground'>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className='w-auto p-0 border-border bg-card shadow-lg z-50'
        sideOffset={6}
      >
        <Calendar
          mode='single'
          selected={selectedDate}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}
