'use client'

import { useState, useMemo, useTransition } from 'react'
import {
  LuChevronLeft,
  LuChevronRight,
  LuCalendar,
  LuPlus,
  LuFilter,
  LuX,
  LuRepeat,
  LuListChecks,
  LuInbox,
  LuArrowRight,
} from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { ListDTO, ListColumnDTO, ListItemDTO } from '@/types/dto'
import { toggleItem, addItem, updateItem } from '../actions'
import {
  getCalendarGrid,
  groupItemsByDate,
  filterCalendarItems,
  formatCalendarHeader,
  navigateCalendarDate,
  type CalendarViewMode,
} from '../lib/calendar'
import { PRIORITY_CONFIG, type PriorityFilterOption } from '../lib/priority'
import EditTodoModal from './EditTodoModal'
import { toast } from 'react-toastify'
import { format, addDays } from 'date-fns'

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CalendarViewProps {
  list: ListDTO
  columns: ListColumnDTO[]
  items: ListItemDTO[]
  onItemUpdated: (item: ListItemDTO) => void
  onItemAdded: (item: ListItemDTO) => void
}

export default function CalendarView({
  list,
  columns,
  items,
  onItemUpdated,
  onItemAdded,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [filterPriority, setFilterPriority] =
    useState<PriorityFilterOption>('all')
  const [isUnscheduledOpen, setIsUnscheduledOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ListItemDTO | null>(null)
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null)
  const [quickAddTitle, setQuickAddTitle] = useState('')
  const [dayDetailsDate, setDayDetailsDate] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Index items by date and separate unscheduled items
  const { byDate, unscheduled } = useMemo(() => {
    return groupItemsByDate(items)
  }, [items])

  // Filter items by priority
  const filteredByDate = useMemo(() => {
    const result: Record<string, ListItemDTO[]> = {}
    for (const [dateKey, dayItems] of Object.entries(byDate)) {
      result[dateKey] = filterCalendarItems(dayItems, filterPriority)
    }
    return result
  }, [byDate, filterPriority])

  const filteredUnscheduled = useMemo(() => {
    return filterCalendarItems(unscheduled, filterPriority)
  }, [unscheduled, filterPriority])

  // Calendar grid computation
  const calendarDays = useMemo(() => {
    return getCalendarGrid(currentDate, viewMode, 0)
  }, [currentDate, viewMode])

  // Live priority counts
  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: items.length,
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    }
    for (const item of items) {
      if (item.priority && counts[item.priority] !== undefined) {
        counts[item.priority]++
      }
    }
    return counts
  }, [items])

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => navigateCalendarDate(prev, 'prev', viewMode))
  }

  const handleNext = () => {
    setCurrentDate((prev) => navigateCalendarDate(prev, 'next', viewMode))
  }

  const handleToday = () => {
    setCurrentDate(navigateCalendarDate(new Date(), 'today', viewMode))
  }

  // Toggle item completion
  const handleToggleCompleted = (item: ListItemDTO, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const nextStatus = !item.is_completed

    // Optimistic update
    onItemUpdated({ ...item, is_completed: nextStatus })

    startTransition(async () => {
      const result = await toggleItem(item.id, nextStatus)
      if (result.error) {
        toast.error(result.error)
        // Rollback
        onItemUpdated(item)
      }
    })
  }

  // Quick add item on specific date
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAddTitle.trim() || !quickAddDate) return

    const defaultColumnId = columns[0]?.id
    if (!defaultColumnId) {
      toast.error('Please create at least one column first')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('listId', list.id)
      formData.set('columnId', defaultColumnId)
      formData.set('title', quickAddTitle.trim())
      formData.set('dueDate', quickAddDate)

      const result = await addItem(formData)
      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        onItemAdded(result.data)
        toast.success(
          `Task scheduled for ${format(new Date(quickAddDate), 'dd MMM yyyy')}`,
        )
        setQuickAddTitle('')
        setQuickAddDate(null)
      }
    })
  }

  // Quick schedule unscheduled item
  const handleQuickSchedule = (item: ListItemDTO, daysToAdd: number) => {
    const targetDate = format(addDays(new Date(), daysToAdd), 'yyyy-MM-dd')
    const updated = { ...item, due_date: targetDate }
    onItemUpdated(updated)

    startTransition(async () => {
      const formData = new FormData()
      formData.set('title', item.title)
      formData.set('dueDate', targetDate)
      if (item.description) formData.set('description', item.description)
      if (item.priority) formData.set('priority', item.priority)
      if (item.recurrence_rule)
        formData.set('recurrenceRule', item.recurrence_rule)

      const result = await updateItem(item.id, formData)
      if (result.error) {
        toast.error(result.error)
        onItemUpdated(item) // rollback
      } else {
        toast.success(
          `Scheduled for ${format(new Date(targetDate), 'dd MMM yyyy')}`,
        )
      }
    })
  }

  const dayDetailsItems = dayDetailsDate
    ? filteredByDate[dayDetailsDate] || []
    : []

  return (
    <div className='space-y-4'>
      {/* Calendar Header Controls */}
      <div className='flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs'>
        {/* Navigation & Period */}
        <div className='flex items-center gap-2'>
          <div className='flex items-center rounded-lg border border-border/80 p-0.5 bg-muted/40 shadow-2xs'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
              onClick={handlePrev}
              aria-label='Previous period'
            >
              <LuChevronLeft className='w-4 h-4' />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-8 px-2.5 text-xs font-semibold text-foreground hover:bg-background'
              onClick={handleToday}
            >
              Today
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
              onClick={handleNext}
              aria-label='Next period'
            >
              <LuChevronRight className='w-4 h-4' />
            </Button>
          </div>

          <h2 className='text-lg font-bold tracking-tight text-foreground ml-1'>
            {formatCalendarHeader(currentDate, viewMode, 0)}
          </h2>
        </div>

        {/* View Mode & Unscheduled Drawer Toggles */}
        <div className='flex items-center gap-2'>
          {/* Month / Week Segmented Switcher */}
          <div className='flex items-center rounded-lg border border-border/80 p-0.5 bg-muted/40 shadow-2xs'>
            <Button
              type='button'
              variant={viewMode === 'month' ? 'secondary' : 'ghost'}
              size='sm'
              className={`h-8 px-3 text-xs font-medium rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              type='button'
              variant={viewMode === 'week' ? 'secondary' : 'ghost'}
              size='sm'
              className={`h-8 px-3 text-xs font-medium rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
          </div>

          {/* Unscheduled Drawer Toggle */}
          <Button
            type='button'
            variant={isUnscheduledOpen ? 'secondary' : 'outline'}
            size='sm'
            className={`h-9 text-xs px-3 gap-1.5 ${
              isUnscheduledOpen
                ? 'bg-secondary font-semibold border-primary/30'
                : ''
            }`}
            onClick={() => setIsUnscheduledOpen(!isUnscheduledOpen)}
          >
            <LuInbox className='w-3.5 h-3.5' />
            <span>Unscheduled</span>
            {unscheduled.length > 0 && (
              <span className='ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/15 text-primary'>
                {unscheduled.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Priority Filters Strip */}
      <div className='flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-border/50'>
        <div className='flex flex-wrap items-center gap-1.5'>
          <span className='text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1'>
            <LuFilter className='w-3.5 h-3.5' />
            Filter:
          </span>
          <Button
            type='button'
            variant={filterPriority === 'all' ? 'secondary' : 'ghost'}
            size='sm'
            className={`h-7 text-xs px-2.5 rounded-full ${
              filterPriority === 'all'
                ? 'bg-secondary font-semibold text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setFilterPriority('all')}
          >
            All
            <span className='ml-1 text-xs opacity-75'>
              ({priorityCounts.all})
            </span>
          </Button>
          {(['urgent', 'high', 'medium', 'low'] as const).map((p) => {
            const cfg = PRIORITY_CONFIG[p]
            const isSelected = filterPriority === p
            const count = priorityCounts[p] || 0
            return (
              <Button
                key={p}
                type='button'
                variant='ghost'
                size='sm'
                className={`h-7 text-xs px-2.5 rounded-full border transition-all ${
                  isSelected
                    ? `${cfg.activeClassName} font-semibold shadow-xs`
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                onClick={() => setFilterPriority(isSelected ? 'all' : p)}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.dotClassName}`} />
                {cfg.label}
                <span className='text-xs opacity-75'>({count})</span>
              </Button>
            )
          })}
          {filterPriority !== 'all' && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-7 text-xs px-2 text-muted-foreground hover:text-destructive gap-1'
              onClick={() => setFilterPriority('all')}
            >
              <LuX className='w-3 h-3' />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main Calendar Body Layout */}
      <div className='flex gap-4 items-start'>
        {/* Calendar Matrix Grid */}
        <div className='flex-1 bg-card rounded-xl border border-border shadow-xs overflow-hidden'>
          {/* Weekday Header */}
          <div className='grid grid-cols-7 border-b border-border bg-muted/30 text-center'>
            {WEEK_DAYS.map((day, idx) => (
              <div
                key={day}
                className={`py-2 text-xs font-semibold tracking-wide uppercase ${
                  idx === 0 || idx === 6
                    ? 'text-muted-foreground/70'
                    : 'text-muted-foreground'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            className={`grid grid-cols-7 divide-x divide-y divide-border/60 ${
              viewMode === 'week'
                ? 'auto-rows-[minmax(240px,auto)]'
                : 'auto-rows-[minmax(115px,auto)]'
            }`}
          >
            {calendarDays.map((calDay) => {
              const dayItems = filteredByDate[calDay.dateKey] || []
              const maxDisplay = viewMode === 'week' ? 8 : 3
              const displayedItems = dayItems.slice(0, maxDisplay)
              const remainingCount = dayItems.length - maxDisplay

              return (
                <div
                  key={calDay.dateKey}
                  className={`group relative p-1.5 transition-colors flex flex-col justify-between ${
                    calDay.isCurrentMonth
                      ? 'bg-card hover:bg-muted/15'
                      : 'bg-muted/25 text-muted-foreground/40'
                  } ${calDay.isWeekend ? 'bg-muted/10' : ''}`}
                >
                  {/* Day Header */}
                  <div>
                    <div className='flex items-center justify-between mb-1'>
                      <span
                        className={`inline-flex items-center justify-center text-xs font-semibold h-6 w-6 rounded-full transition-all ${
                          calDay.isToday
                            ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                            : calDay.isCurrentMonth
                              ? 'text-foreground'
                              : 'text-muted-foreground/40'
                        }`}
                      >
                        {calDay.dayNumber}
                      </span>

                      {/* Quick Add Button */}
                      <button
                        type='button'
                        className='opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-muted-foreground hover:text-primary hover:bg-muted/60 rounded-sm transition-all cursor-pointer'
                        onClick={() => {
                          setQuickAddDate(calDay.dateKey)
                          setQuickAddTitle('')
                        }}
                        title={`Add task for ${calDay.dateKey}`}
                        aria-label={`Add task for ${calDay.dateKey}`}
                      >
                        <LuPlus className='w-3.5 h-3.5' />
                      </button>
                    </div>

                    {/* Task Chips List */}
                    <div className='space-y-1'>
                      {displayedItems.map((item) => {
                        const priorityCfg = item.priority
                          ? PRIORITY_CONFIG[item.priority]
                          : null
                        const subtasksCount = item.subtasks?.length || 0
                        const completedSubtasks =
                          item.subtasks?.filter((s) => s.is_completed).length ||
                          0

                        return (
                          <div
                            key={item.id}
                            role='button'
                            tabIndex={0}
                            className={`group/chip flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border transition-all cursor-pointer select-none text-left shadow-2xs ${
                              item.is_completed
                                ? 'bg-muted/40 border-border/40 text-muted-foreground line-through opacity-75'
                                : 'bg-background hover:bg-muted/50 border-border/80 hover:border-border text-foreground'
                            }`}
                            onClick={() => setEditingItem(item)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setEditingItem(item)
                              }
                            }}
                          >
                            {/* Checkbox */}
                            <Checkbox
                              checked={item.is_completed}
                              onCheckedChange={() =>
                                handleToggleCompleted(item)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className='h-3.5 w-3.5 shrink-0 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500'
                              aria-label={`Mark task "${item.title}" complete`}
                            />

                            {/* Priority Dot */}
                            {priorityCfg && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityCfg.dotClassName}`}
                                title={`Priority: ${priorityCfg.label}`}
                              />
                            )}

                            {/* Title */}
                            <span className='truncate flex-1 font-medium'>
                              {item.title}
                            </span>

                            {/* Subtasks Progress Pill */}
                            {subtasksCount > 0 && (
                              <span className='text-[10px] px-1 py-0.2 rounded bg-muted text-muted-foreground flex items-center gap-0.5 shrink-0'>
                                <LuListChecks className='w-2.5 h-2.5' />
                                {completedSubtasks}/{subtasksCount}
                              </span>
                            )}

                            {/* Recurrence Icon */}
                            {item.recurrence_rule && (
                              <LuRepeat
                                className='w-2.5 h-2.5 text-primary shrink-0'
                                title='Recurring task'
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* "+N more" Expander Pill */}
                  {remainingCount > 0 && (
                    <button
                      type='button'
                      className='mt-1 text-left w-full text-[11px] font-semibold text-primary hover:underline px-1 py-0.5 rounded transition-colors cursor-pointer'
                      onClick={() => setDayDetailsDate(calDay.dateKey)}
                    >
                      +{remainingCount} more
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Unscheduled Tasks Slide-Over / Sidebar */}
        {isUnscheduledOpen && (
          <div className='w-80 shrink-0 bg-card rounded-xl border border-border shadow-xs p-4 space-y-4'>
            <div className='flex items-center justify-between pb-2 border-b border-border'>
              <div className='flex items-center gap-2'>
                <LuInbox className='w-4 h-4 text-primary' />
                <h3 className='font-semibold text-sm'>Unscheduled Tasks</h3>
                <span className='px-1.5 py-0.2 rounded-full text-xs font-bold bg-muted text-muted-foreground'>
                  {filteredUnscheduled.length}
                </span>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-7 w-7 p-0 text-muted-foreground hover:text-foreground'
                onClick={() => setIsUnscheduledOpen(false)}
              >
                <LuX className='w-4 h-4' />
              </Button>
            </div>

            {filteredUnscheduled.length === 0 ? (
              <div className='py-8 text-center text-xs text-muted-foreground'>
                No unscheduled tasks found. All clear! 🎉
              </div>
            ) : (
              <div className='space-y-2 max-h-150 overflow-y-auto pr-1 custom-scrollbar'>
                {filteredUnscheduled.map((item) => {
                  const priorityCfg = item.priority
                    ? PRIORITY_CONFIG[item.priority]
                    : null

                  return (
                    <div
                      key={item.id}
                      className='p-2.5 rounded-lg border border-border/80 bg-background hover:border-border transition-all space-y-2 group shadow-2xs'
                    >
                      <div className='flex items-start gap-2'>
                        <Checkbox
                          checked={item.is_completed}
                          onCheckedChange={() => handleToggleCompleted(item)}
                          className='mt-0.5 h-3.5 w-3.5 shrink-0 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500'
                          aria-label={`Mark task "${item.title}" complete`}
                        />
                        <button
                          type='button'
                          className='flex-1 text-left cursor-pointer'
                          onClick={() => setEditingItem(item)}
                        >
                          <div className='flex items-center gap-1.5'>
                            {priorityCfg && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityCfg.dotClassName}`}
                              />
                            )}
                            <span
                              className={`text-xs font-medium line-clamp-2 ${
                                item.is_completed
                                  ? 'line-through text-muted-foreground'
                                  : 'text-foreground'
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>
                        </button>
                      </div>

                      {/* Quick Schedule Actions */}
                      <div className='flex items-center gap-1 pl-5 pt-1 border-t border-border/40'>
                        <span className='text-[10px] text-muted-foreground mr-1'>
                          Due:
                        </span>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='h-6 text-[10px] px-1.5'
                          onClick={() => handleQuickSchedule(item, 0)}
                        >
                          Today
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='h-6 text-[10px] px-1.5'
                          onClick={() => handleQuickSchedule(item, 1)}
                        >
                          Tomorrow
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='h-6 text-[10px] px-1.5'
                          onClick={() => handleQuickSchedule(item, 7)}
                        >
                          +1 Wk
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Add Task on Specific Date Dialog */}
      <Dialog
        open={Boolean(quickAddDate)}
        onOpenChange={(open) => {
          if (!open) {
            setQuickAddDate(null)
            setQuickAddTitle('')
          }
        }}
      >
        <DialogContent className='p-4 sm:max-w-md gap-4'>
          <form onSubmit={handleQuickAddSubmit} className='space-y-3'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-base font-bold'>
                <LuCalendar className='w-4 h-4 text-primary' />
                Schedule Task for{' '}
                {quickAddDate
                  ? format(new Date(quickAddDate), 'dd MMM yyyy')
                  : ''}
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                Add a new task with its due date preset to this calendar day.
              </DialogDescription>
            </DialogHeader>

            <div>
              <Input
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                placeholder='What needs to be done?'
                className='h-10 text-sm'
                required
              />
            </div>

            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setQuickAddDate(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isPending || !quickAddTitle.trim()}
                className='gap-1.5'
              >
                <LuPlus className='w-4 h-4' />
                {isPending ? 'Adding...' : 'Add Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Day Details Popover Dialog (for days with >3 tasks) */}
      <Dialog
        open={Boolean(dayDetailsDate)}
        onOpenChange={(open) => {
          if (!open) setDayDetailsDate(null)
        }}
      >
        <DialogContent className='p-4 sm:max-w-lg gap-4'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-base font-bold'>
              <LuCalendar className='w-4 h-4 text-primary' />
              Tasks for{' '}
              {dayDetailsDate
                ? format(new Date(dayDetailsDate), 'EEEE, dd MMMM yyyy')
                : ''}
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              {dayDetailsItems.length} tasks scheduled for this date.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-2 max-h-100 overflow-y-auto pr-1 custom-scrollbar'>
            {dayDetailsItems.map((item) => {
              const priorityCfg = item.priority
                ? PRIORITY_CONFIG[item.priority]
                : null

              return (
                <button
                  key={item.id}
                  type='button'
                  className='w-full flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-background hover:bg-muted/30 transition-all cursor-pointer text-left'
                  onClick={() => {
                    setDayDetailsDate(null)
                    setEditingItem(item)
                  }}
                >
                  <div className='flex items-center gap-2.5 flex-1 mr-2'>
                    <Checkbox
                      checked={item.is_completed}
                      onCheckedChange={() => handleToggleCompleted(item)}
                      onClick={(e) => e.stopPropagation()}
                      className='h-4 w-4 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500'
                    />
                    {priorityCfg && (
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${priorityCfg.dotClassName}`}
                      />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        item.is_completed
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>

                  <LuArrowRight className='w-4 h-4 text-muted-foreground shrink-0' />
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Deep Edit Todo Modal */}
      {editingItem && (
        <EditTodoModal
          item={editingItem}
          open={Boolean(editingItem)}
          onOpenChange={(open) => {
            if (!open) setEditingItem(null)
          }}
          onUpdated={(updated) => {
            onItemUpdated(updated)
            setEditingItem(null)
          }}
        />
      )}
    </div>
  )
}
