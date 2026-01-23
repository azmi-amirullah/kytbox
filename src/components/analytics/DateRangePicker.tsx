'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LuChevronDown } from 'react-icons/lu';
import { format, subDays } from 'date-fns';
import type { DateRange } from '@/types/analytics';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  disabled?: boolean;
}

const options: { label: string; value: DateRange }[] = [
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Lifetime', value: 'lifetime' },
];

export function DateRangePicker({
  value,
  onChange,
  disabled,
}: DateRangePickerProps) {
  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || 'Select range';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          disabled={disabled}
          className='w-[180px] justify-between bg-background dark:bg-background disabled:opacity-100 disabled:text-muted-foreground'
        >
          {selectedLabel}
          <LuChevronDown className='ml-2 h-4 w-4 opacity-50' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-[180px]' align='end'>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className='cursor-pointer'
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper to get display text for date range
export function getDateRangeLabel(range: DateRange): string {
  const now = new Date();

  switch (range) {
    case '24h':
      return 'Last 24 Hours';
    case '7d':
      return `${format(subDays(now, 7), 'MMM d')} - ${format(now, 'MMM d')}`;
    case '30d':
      return `${format(subDays(now, 30), 'MMM d')} - ${format(now, 'MMM d')}`;
    case 'lifetime':
      // For lifetime, since we don't have the start date here,
      // we'll return a generic "All time" or could be improved if start date is passed
      return 'All time';
    default:
      return '';
  }
}
