import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground border-input h-9 w-full min-w-0 max-w-full rounded-md border bg-card px-3 py-1 text-sm font-medium text-foreground shadow-xs transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        type === 'number' && 'pr-1 [&::-webkit-inner-spin-button]:ml-0.5',
        type === 'date' &&
          '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-date-and-time-value]:text-left [&::-webkit-date-and-time-value]:min-h-5',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
