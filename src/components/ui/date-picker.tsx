'use client'

import * as React from 'react'
import { format, parseISO } from 'date-fns'
import { LuCalendar } from 'react-icons/lu'
import type { Matcher } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { toLocalDateOnlyString } from '@/lib/date-only'
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
  dateFormat?: string
  maxDate?: string | Date
  minDate?: string | Date
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years'
  startYear?: number
  endYear?: number
  showToday?: boolean
  showClear?: boolean
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
  required = false,
  align = 'start',
  dateFormat = 'dd/MM/yyyy',
  maxDate,
  minDate,
  captionLayout = 'dropdown',
  startYear,
  endYear,
  showToday = true,
  showClear = !required,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDate = React.useMemo(() => parseDateValue(value), [value])

  const currentYear = new Date().getFullYear()

  const computedStartMonth = React.useMemo(() => {
    if (minDate) {
      const parsed = parseDateValue(minDate)
      if (parsed) return new Date(parsed.getFullYear(), 0)
    }
    return new Date(startYear ?? currentYear - 30, 0)
  }, [minDate, startYear, currentYear])

  const computedEndMonth = React.useMemo(() => {
    if (maxDate) {
      const parsed = parseDateValue(maxDate)
      if (parsed) return new Date(parsed.getFullYear(), 11)
    }
    return new Date(endYear ?? currentYear + 30, 11)
  }, [maxDate, endYear, currentYear])

  const disabledMatcher = React.useMemo<Matcher[] | undefined>(() => {
    const matchers: Matcher[] = []
    if (maxDate) {
      const parsedMax = parseDateValue(maxDate)
      if (parsedMax) matchers.push({ after: parsedMax })
    }
    if (minDate) {
      const parsedMin = parseDateValue(minDate)
      if (parsedMin) matchers.push({ before: parsedMin })
    }
    return matchers.length > 0 ? matchers : undefined
  }, [maxDate, minDate])

  const isTodayDisabled = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (maxDate) {
      const parsedMax = parseDateValue(maxDate)
      if (parsedMax) {
        parsedMax.setHours(0, 0, 0, 0)
        if (today > parsedMax) return true
      }
    }
    if (minDate) {
      const parsedMin = parseDateValue(minDate)
      if (parsedMin) {
        parsedMin.setHours(0, 0, 0, 0)
        if (today < parsedMin) return true
      }
    }
    return false
  }, [maxDate, minDate])

  function handleSelect(date: Date | undefined) {
    if (!date) {
      onChange?.('')
    } else {
      onChange?.(toLocalDateOnlyString(date))
    }
    setOpen(false)
  }

  function handleSelectToday() {
    handleSelect(new Date())
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
          <LuCalendar className='h-4 w-4 text-muted-foreground shrink-0' />
          {selectedDate ? (
            <span className='truncate font-medium text-foreground'>
              {format(selectedDate, dateFormat)}
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
          defaultMonth={selectedDate}
          onSelect={handleSelect}
          disabled={disabledMatcher}
          captionLayout={captionLayout}
          startMonth={computedStartMonth}
          endMonth={computedEndMonth}
        />
        {(showToday || (showClear && Boolean(selectedDate))) && (
          <div className='flex items-center justify-between border-t border-border/60 px-3 py-2 bg-muted/15'>
            {showToday ? (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                disabled={disabled || isTodayDisabled}
                onClick={handleSelectToday}
                aria-label='Select today'
                className='h-7 px-2.5 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 transition-colors'
              >
                Today
              </Button>
            ) : (
              <div />
            )}
            {showClear && Boolean(selectedDate) && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                disabled={disabled}
                onClick={() => handleSelect(undefined)}
                aria-label='Clear date'
                className='h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
