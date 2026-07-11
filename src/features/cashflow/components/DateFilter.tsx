'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LuCalendar, LuX } from 'react-icons/lu';
import { 
  resolveFilterRange, 
  type DateFilterPreset, 
  type DateFilterState,
} from '../math';

const PRESETS: { value: DateFilterPreset; label: string }[] = [
  { value: 'all-time', label: 'All Time' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'custom', label: 'Custom' },
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface DateFilterProps {
  state: DateFilterState;
  onChange: (state: DateFilterState) => void;
  /** Entry count after filter is applied — shown as feedback. */
  filteredCount: number;
  totalCount: number;
}

export function DateFilter({
  state,
  onChange,
  filteredCount,
  totalCount,
}: DateFilterProps) {
  const isFiltered = state.preset !== 'all-time';

  const effectiveRange = useMemo(() => resolveFilterRange(state), [state]);

  function handlePreset(preset: DateFilterPreset) {
    onChange({ ...state, preset });
  }

  function handleCustomFrom(from: string) {
    onChange({ preset: 'custom', custom: { ...state.custom, from } });
  }

  function handleCustomTo(to: string) {
    onChange({ preset: 'custom', custom: { ...state.custom, to } });
  }

  function handleReset() {
    onChange({ preset: 'all-time', custom: { from: null, to: null } });
  }

  return (
    <div
      className='bg-card border rounded-xl p-4 space-y-3'
      role='group'
      aria-label='Date range filter'
    >
      {/* Row 1: Icon + label + active badge + reset */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <LuCalendar
            className='w-4 h-4 text-muted-foreground shrink-0'
            aria-hidden='true'
          />
          <span className='text-sm font-semibold'>Filter by Date</span>
          {isFiltered && (
            <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 leading-tight'>
              {filteredCount === totalCount
                ? `${filteredCount} entries`
                : `${filteredCount} of ${totalCount}`}
            </span>
          )}
        </div>
        {isFiltered && (
          <Button
            variant='ghost'
            size='sm'
            className='h-7 px-2 text-muted-foreground hover:text-foreground gap-1 text-xs'
            onClick={handleReset}
            aria-label='Clear date filter'
          >
            <LuX className='w-3 h-3' />
            Clear
          </Button>
        )}
      </div>

      {/* Row 2: Preset pills */}
      <div
        className='flex flex-wrap gap-1.5'
        role='radiogroup'
        aria-label='Date preset'
      >
        {PRESETS.map((p) => (
          <button
            key={p.value}
            role='radio'
            aria-checked={state.preset === p.value}
            onClick={() => handlePreset(p.value)}
            className={`
              px-3 py-1 rounded-full text-xs font-semibold border transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
              ${
                state.preset === p.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              }
            `}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Row 3: Custom date inputs (only visible when 'custom' is selected) */}
      {state.preset === 'custom' && (
        <div className='flex flex-wrap gap-2 pt-1'>
          <div className='flex flex-col gap-1 flex-1 min-w-[140px]'>
            <label
              htmlFor='date-filter-from'
              className='text-[10px] font-bold uppercase tracking-wide text-muted-foreground'
            >
              From
            </label>
            <Input
              id='date-filter-from'
              type='date'
              value={state.custom.from ?? ''}
              max={effectiveRange.to ?? undefined}
              onChange={(e) => handleCustomFrom(e.target.value)}
              className='h-8 text-sm'
              aria-label='Start date'
            />
          </div>
          <div className='flex flex-col gap-1 flex-1 min-w-[140px]'>
            <label
              htmlFor='date-filter-to'
              className='text-[10px] font-bold uppercase tracking-wide text-muted-foreground'
            >
              To
            </label>
            <Input
              id='date-filter-to'
              type='date'
              value={state.custom.to ?? ''}
              min={effectiveRange.from ?? undefined}
              onChange={(e) => handleCustomTo(e.target.value)}
              className='h-8 text-sm'
              aria-label='End date'
            />
          </div>
        </div>
      )}
    </div>
  );
}
