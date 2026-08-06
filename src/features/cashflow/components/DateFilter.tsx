'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  resolveFilterRange, 
  type DateFilterPreset, 
  type DateFilterState,
} from '../math'

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
  const effectiveRange = useMemo(() => resolveFilterRange(state), [state])

  function handlePreset(preset: DateFilterPreset) {
    onChange({ ...state, preset })
  }

  function handleCustomFrom(from: string) {
    onChange({ preset: 'custom', custom: { ...state.custom, from } })
  }

  function handleCustomTo(to: string) {
    onChange({ preset: 'custom', custom: { ...state.custom, to } })
  }

  return (
    <>
      <Select
        value={state.preset}
        onValueChange={(val) => {
          if (isDateFilterPreset(val)) {
            handlePreset(val)
          }
        }}
      >
        <SelectTrigger className='bg-card w-full lg:w-40' aria-label='Filter by date period'>
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

      {/* Custom Date Range Inputs (visible when 'custom' is selected) */}
      {state.preset === 'custom' && (
        <div className='flex flex-col sm:flex-row gap-3 p-3 bg-card border rounded-xl shadow-xs w-full sm:min-w-72 col-span-full'>
          <div className='flex flex-col gap-1.5 flex-1 min-w-35'>
            <label
              htmlFor='date-filter-from'
              className='text-xs font-semibold text-muted-foreground'
            >
              From Date
            </label>
            <Input
              id='date-filter-from'
              type='date'
              value={state.custom.from ?? ''}
              max={effectiveRange.to ?? undefined}
              onChange={(e) => handleCustomFrom(e.target.value)}
              className='h-9 text-sm'
              aria-label='Start date'
            />
          </div>
          <div className='flex flex-col gap-1.5 flex-1 min-w-35'>
            <label
              htmlFor='date-filter-to'
              className='text-xs font-semibold text-muted-foreground'
            >
              To Date
            </label>
            <Input
              id='date-filter-to'
              type='date'
              value={state.custom.to ?? ''}
              min={effectiveRange.from ?? undefined}
              onChange={(e) => handleCustomTo(e.target.value)}
              className='h-9 text-sm'
              aria-label='End date'
            />
          </div>
        </div>
      )}
    </>
  )
}
