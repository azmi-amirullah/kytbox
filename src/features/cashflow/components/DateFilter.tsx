'use client'

import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  type DateFilterPreset, 
  type DateFilterState,
} from '../math'
import { cn } from '@/lib/utils'

const PRESETS: { value: DateFilterPreset; label: string }[] = [
  { value: 'all-time', label: 'All Time' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'custom', label: 'Custom' },
]

function isDateFilterPreset(val: string): val is DateFilterPreset {
  return PRESETS.some((p) => p.value === val)
}

interface DateFilterProps {
  state: DateFilterState
  onChange: (state: DateFilterState) => void
  filteredCount?: number
  totalCount?: number
}

export function DateFilter({
  state,
  onChange,
}: DateFilterProps) {
  function handlePreset(preset: DateFilterPreset) {
    onChange({ ...state, preset })
  }

  return (
    <Select
      value={state.preset}
      onValueChange={(val) => {
        if (isDateFilterPreset(val)) {
          handlePreset(val)
        }
      }}
    >
      <SelectTrigger
        className={cn(
          'bg-card w-full lg:w-36 xl:w-40 h-9 text-xs sm:text-sm whitespace-nowrap transition-colors rounded-lg',
          state.preset !== 'all-time' &&
            'border-primary/60 bg-primary/5 text-primary [&>svg]:text-primary font-medium shadow-xs',
        )}
        aria-label='Filter by date period'
      >
        <SelectValue placeholder='Period' />
      </SelectTrigger>
      <SelectContent>
        {PRESETS.map((p) => (
          <SelectItem key={p.value} value={p.value} className='text-sm'>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function DateFilterCustomRange({
  state,
  onChange,
}: DateFilterProps) {
  if (state.preset !== 'custom') return null

  function handleCustomFrom(from: string) {
    onChange({ preset: 'custom', custom: { ...state.custom, from } })
  }

  function handleCustomTo(to: string) {
    onChange({ preset: 'custom', custom: { ...state.custom, to } })
  }

  return (
    <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 bg-card border border-primary/25 rounded-lg shadow-xs w-full sm:w-fit animate-in fade-in slide-in-from-top-1 duration-150'>
      <div className='flex items-center gap-2 flex-1 sm:flex-initial'>
        <label
          htmlFor='date-filter-from'
          className='text-xs font-medium text-muted-foreground whitespace-nowrap min-w-10 sm:min-w-0'
        >
          From:
        </label>
        <DatePicker
          id='date-filter-from'
          value={state.custom.from ?? ''}
          onChange={handleCustomFrom}
          placeholder='Start date'
          className='flex-1 sm:w-36 h-9 text-xs sm:text-sm'
        />
      </div>
      <div className='flex items-center gap-2 flex-1 sm:flex-initial'>
        <label
          htmlFor='date-filter-to'
          className='text-xs font-medium text-muted-foreground whitespace-nowrap min-w-10 sm:min-w-0'
        >
          To:
        </label>
        <DatePicker
          id='date-filter-to'
          value={state.custom.to ?? ''}
          onChange={handleCustomTo}
          placeholder='End date'
          className='flex-1 sm:w-36 h-9 text-xs sm:text-sm'
        />
      </div>
    </div>
  )
}
