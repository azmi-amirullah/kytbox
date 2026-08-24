'use client'

import { useState, useTransition } from 'react'
import { format, addDays } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { LuX, LuAlignLeft, LuCalendar } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { ListItemDTO, ListSubtaskDTO } from '@/types/dto'
import { updateItem, toggleItem } from '../actions'
import { getDueDateInfo } from '../lib/due-date'
import { toast } from 'react-toastify'
import { Checkbox } from '@/components/ui/checkbox'
import CardChecklist from './CardChecklist'

interface EditTodoModalProps {
  item: ListItemDTO
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (item: ListItemDTO) => void
}

export default function EditTodoModal({
  item,
  open,
  onOpenChange,
  onUpdated,
}: EditTodoModalProps) {
  const [isPending, startTransition] = useTransition()
  const [prevItemId, setPrevItemId] = useState(item.id)
  const [prevOpen, setPrevOpen] = useState(open)
  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description || '')
  const [isCompleted, setIsCompleted] = useState(item.is_completed)
  const [dueDate, setDueDate] = useState<string | null>(item.due_date ?? null)
  const [subtasks, setSubtasks] = useState(item.subtasks ?? [])

  // Reset local state synchronously when props change (avoids useEffect cascading renders)
  if (item.id !== prevItemId || open !== prevOpen) {
    setPrevItemId(item.id)
    setPrevOpen(open)
    setTitle(item.title)
    setDescription(item.description || '')
    setIsCompleted(item.is_completed)
    setDueDate(item.due_date ?? null)
    setSubtasks(item.subtasks ?? [])
  }

  const dueDateInfo = getDueDateInfo(dueDate, isCompleted)

  const handleSubtasksChange = (newSubtasks: ListSubtaskDTO[]) => {
    setSubtasks(newSubtasks)
    onUpdated({
      ...item,
      title: title.trim(),
      description: description.trim() || null,
      is_completed: isCompleted,
      due_date: dueDate || null,
      subtasks: newSubtasks,
    })
  }

  const handleToggleCompleted = () => {
    if (isPending) return
    startTransition(async () => {
      const result = await toggleItem(item.id, !isCompleted)
      if (result.error) {
        toast.error(result.error)
      } else {
        setIsCompleted(!isCompleted)
        onUpdated({
          ...item,
          title: title.trim(),
          description: description.trim() || null,
          is_completed: !isCompleted,
          due_date: dueDate,
          subtasks,
        })
      }
    })
  }

  const handleQuickDate = (daysToAdd: number | null) => {
    if (daysToAdd === null) {
      setDueDate(null)
    } else {
      const target = addDays(new Date(), daysToAdd)
      setDueDate(format(target, 'yyyy-MM-dd'))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('title', title.trim())
      if (description.trim()) {
        formData.append('description', description.trim())
      }
      formData.append('dueDate', dueDate || '')

      const result = await updateItem(item.id, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        onUpdated({
          ...item,
          title: title.trim(),
          description: description.trim() || null,
          is_completed: isCompleted,
          due_date: dueDate || null,
          subtasks,
        })
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className='p-4 sm:max-w-xl gap-3'>
        <form onSubmit={handleSubmit} className='space-y-3'>
          <DialogHeader className='flex flex-row items-center gap-3 space-y-0 pb-1.5'>
            <Checkbox
              id='edit-completed'
              checked={isCompleted}
              onCheckedChange={handleToggleCompleted}
              className={`shrink-0 mt-0.5 ${isPending ? 'cursor-wait' : 'cursor-pointer'} border-muted-foreground/60 dark:border-muted-foreground/40 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:border-emerald-500`}
              aria-label='Toggle task completion status'
            />
            <DialogTitle className='flex-1'>
              <Input
                id='edit-title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Task title'
                maxLength={300}
                className='w-full text-xl! font-bold border-transparent bg-transparent shadow-none hover:border-input/40 focus:border-input focus:bg-background focus:ring-1 focus:ring-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-input transition-all py-0 px-0 focus:px-1 h-11'
                required
              />
            </DialogTitle>
            <DialogDescription className='sr-only'>
              Edit details for this todo task.
            </DialogDescription>
            <DialogClose className='text-muted-foreground/75 hover:text-foreground hover:bg-accent rounded-xs p-1 transition-colors cursor-pointer shrink-0'>
              <LuX className='w-5 h-5' />
              <span className='sr-only'>Close</span>
            </DialogClose>
          </DialogHeader>

          <div className='space-y-3'>
            {/* Due Date Row */}
            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3 text-muted-foreground/45'>
                  <LuCalendar className='w-4 h-4 text-foreground/70' />
                  <Label htmlFor='edit-due-date' className='text-foreground text-sm font-semibold'>
                    Due Date
                  </Label>
                </div>
                {dueDateInfo.status !== 'none' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${dueDateInfo.badgeClassName}`}>
                    {dueDateInfo.label}
                  </span>
                )}
              </div>
              <div className='pl-7 space-y-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Input
                    id='edit-due-date'
                    type='date'
                    value={dueDate || ''}
                    onChange={(e) => setDueDate(e.target.value || null)}
                    className='w-auto h-8 text-xs'
                  />
                  <div className='flex items-center gap-1'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='h-8 text-xs px-2'
                      onClick={() => handleQuickDate(0)}
                    >
                      Today
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='h-8 text-xs px-2'
                      onClick={() => handleQuickDate(1)}
                    >
                      Tomorrow
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='h-8 text-xs px-2'
                      onClick={() => handleQuickDate(7)}
                    >
                      +1 Week
                    </Button>
                    {dueDate && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='h-8 text-xs px-2 text-muted-foreground hover:text-destructive'
                        onClick={() => handleQuickDate(null)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Subtasks Checklist */}
            <CardChecklist
              itemId={item.id}
              subtasks={subtasks}
              onSubtasksChange={handleSubtasksChange}
            />

            {/* Description Row */}
            <div className='space-y-1.5'>
              <div className='flex items-center gap-3 text-muted-foreground/45'>
                <LuAlignLeft className='w-4 h-4' />
                <Label htmlFor='edit-desc' className='text-foreground text-base font-semibold'>
                  Description
                </Label>
              </div>
              <div className='pl-7'>
                <Textarea
                  id='edit-desc'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Add details to this task...'
                  className='min-h-25'
                  maxLength={1000}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='ghost'
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isPending || !title.trim()}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
