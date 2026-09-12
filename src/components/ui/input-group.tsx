import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputGroupProps
  extends Omit<React.ComponentProps<'div'>, 'prefix'> {
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

function InputGroup({
  className,
  prefix,
  suffix,
  children,
  ...props
}: InputGroupProps) {
  return (
    <div
      data-slot='input-group'
      className={cn(
        'group/input-group flex w-full items-center rounded-md border border-input bg-card shadow-xs transition-colors overflow-hidden',
        'focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40',
        'has-disabled:cursor-not-allowed has-disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        '[&_input]:rounded-none! [&_input]:border-0! [&_input]:bg-transparent! [&_input]:shadow-none! [&_input]:ring-0! [&_input]:focus-visible:ring-0! [&_input]:focus-visible:border-0! [&_input]:h-full [&_input]:w-full',
        className,
      )}
      {...props}
    >
      {prefix && (
        <span
          data-slot='input-prefix'
          className='flex shrink-0 self-stretch items-center justify-center border-r border-input bg-card px-3 font-mono text-xs font-semibold text-muted-foreground select-none'
        >
          {prefix}
        </span>
      )}
      <div className='relative flex-1 min-w-0 self-stretch flex items-center bg-card'>
        {children}
      </div>
      {suffix && (
        <span
          data-slot='input-suffix'
          className='flex shrink-0 self-stretch items-center justify-center border-l border-input bg-card px-3 font-mono text-xs font-semibold text-muted-foreground select-none'
        >
          {suffix}
        </span>
      )}
    </div>
  )
}

export { InputGroup }
