'use client'

import * as React from 'react'
import { LuChevronLeft, LuChevronRight, LuChevronDown } from 'react-icons/lu'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'

import { buttonVariants, type Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()
  const calendarClassNames = {
    root: cn('w-fit', defaultClassNames.root),
    months: cn('relative flex flex-col gap-4 md:flex-row', defaultClassNames.months),
    month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
    nav: cn(
      'pointer-events-none absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 z-10',
      defaultClassNames.nav,
    ),
    button_previous: cn(
      buttonVariants({ variant: buttonVariant }),
      'pointer-events-auto size-7 select-none p-0 aria-disabled:opacity-50',
      defaultClassNames.button_previous,
    ),
    button_next: cn(
      buttonVariants({ variant: buttonVariant }),
      'pointer-events-auto size-7 select-none p-0 aria-disabled:opacity-50',
      defaultClassNames.button_next,
    ),
    month_caption: cn(
      'flex h-7 w-full items-center justify-center px-8',
      defaultClassNames.month_caption,
    ),
    dropdowns: cn(
      'flex h-7 w-full items-center justify-center gap-1.5 text-sm font-medium',
      defaultClassNames.dropdowns,
    ),
    dropdown_root: cn(
      'relative rounded-md border border-input shadow-xs',
      defaultClassNames.dropdown_root,
    ),
    dropdown: cn(
      'absolute inset-0 bg-popover opacity-0',
      defaultClassNames.dropdown,
    ),
    caption_label: cn(
      'font-medium text-sm select-none',
      captionLayout === 'label'
        ? 'text-sm'
        : 'flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm',
      defaultClassNames.caption_label,
    ),
    table: 'w-full border-collapse space-y-1',
    weekdays: cn('flex', defaultClassNames.weekdays),
    weekday: cn(
      'w-8 rounded-md text-[0.8rem] font-normal text-muted-foreground select-none text-center',
      defaultClassNames.weekday,
    ),
    week: cn('mt-1 flex w-full', defaultClassNames.week),
    week_number_header: cn(
      'w-8 select-none',
      defaultClassNames.week_number_header,
    ),
    week_number: cn(
      'text-[0.8rem] text-muted-foreground select-none',
      defaultClassNames.week_number,
    ),
    day: cn(
      'group/day relative aspect-square h-8 w-8 p-0 text-center select-none text-sm',
      defaultClassNames.day,
    ),
    day_button: cn(
      buttonVariants({ variant: 'ghost' }),
      'size-8 p-0 font-normal aria-selected:opacity-100 hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground focus:outline-none',
      defaultClassNames.day_button,
    ),
    range_start: cn('rounded-l-md bg-accent', defaultClassNames.range_start),
    range_middle: cn('rounded-none bg-accent/50', defaultClassNames.range_middle),
    range_end: cn('rounded-r-md bg-accent', defaultClassNames.range_end),
    selected: cn(
      'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md',
      defaultClassNames.selected,
    ),
    today: cn(
      'bg-accent text-accent-foreground rounded-md font-semibold',
      defaultClassNames.today,
    ),
    outside: cn(
      'text-muted-foreground opacity-50 aria-selected:opacity-30',
      defaultClassNames.outside,
    ),
    disabled: cn(
      'text-muted-foreground opacity-50 pointer-events-none',
      defaultClassNames.disabled,
    ),
    hidden: cn('invisible', defaultClassNames.hidden),
    ...classNames,
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 bg-card rounded-md border shadow-sm', className)}
      captionLayout={captionLayout}
      classNames={calendarClassNames}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div
            data-slot='calendar'
            ref={rootRef}
            className={cn(rootClassName)}
            {...rootProps}
          />
        ),
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === 'left') {
            return (
              <LuChevronLeft className={cn('h-4 w-4', chevronClassName)} {...chevronProps} />
            )
          }
          if (orientation === 'right') {
            return (
              <LuChevronRight className={cn('h-4 w-4', chevronClassName)} {...chevronProps} />
            )
          }
          return (
            <LuChevronDown className={cn('h-4 w-4', chevronClassName)} {...chevronProps} />
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

export { Calendar }
