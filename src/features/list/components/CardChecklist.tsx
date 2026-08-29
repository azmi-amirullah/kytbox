'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { LuListTodo, LuPlus, LuTrash2, LuPencil, LuCheck, LuX } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import type { ListSubtaskDTO } from '@/types/dto'
import {
  createSubtask,
  toggleSubtask,
  updateSubtaskTitle,
  deleteSubtask,
} from '../actions'
import { toast } from 'react-toastify'

interface CardChecklistProps {
  itemId: string
  subtasks: ListSubtaskDTO[]
  onSubtasksChange: (subtasks: ListSubtaskDTO[]) => void
}

export default function CardChecklist({
  itemId,
  subtasks,
  onSubtasksChange,
}: CardChecklistProps) {
  const [newTitle, setNewTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus()
    }
  }, [isAdding])

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editingId])

  const total = subtasks.length
  const completed = subtasks.filter((s) => s.is_completed).length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  const handleAddSubtask = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const trimmed = newTitle.trim()
    if (!trimmed || isPending) return

    const tempId = `temp-${Date.now()}`
    const optimisticSubtask: ListSubtaskDTO = {
      id: tempId,
      item_id: itemId,
      title: trimmed,
      is_completed: false,
      position: subtasks.length,
      created_at: new Date().toISOString(),
    }

    const previousSubtasks = [...subtasks]
    const updated = [...subtasks, optimisticSubtask]
    onSubtasksChange(updated)
    setNewTitle('')

    startTransition(async () => {
      const result = await createSubtask(itemId, trimmed)
      if (result.error || !result.data) {
        toast.error(result.error || 'Failed to add subtask')
        onSubtasksChange(previousSubtasks)
      } else {
        // Replace optimistic subtask with real one from DB
        onSubtasksChange(
          updated.map((s) => (s.id === tempId ? result.data! : s)),
        )
      }
    })
  }

  const handleToggle = (subtask: ListSubtaskDTO) => {
    const nextCompleted = !subtask.is_completed
    const previousSubtasks = [...subtasks]
    const updated = subtasks.map((s) =>
      s.id === subtask.id ? { ...s, is_completed: nextCompleted } : s,
    )
    onSubtasksChange(updated)

    startTransition(async () => {
      const result = await toggleSubtask(subtask.id, nextCompleted)
      if (result.error) {
        toast.error(result.error)
        onSubtasksChange(previousSubtasks)
      }
    })
  }

  const handleDelete = (subtaskId: string) => {
    const previousSubtasks = [...subtasks]
    const updated = subtasks.filter((s) => s.id !== subtaskId)
    onSubtasksChange(updated)

    startTransition(async () => {
      const result = await deleteSubtask(subtaskId)
      if (result.error) {
        toast.error(result.error)
        onSubtasksChange(previousSubtasks)
      }
    })
  }

  const handleStartEdit = (subtask: ListSubtaskDTO) => {
    setEditingId(subtask.id)
    setEditTitle(subtask.title)
  }

  const handleSaveEdit = (subtaskId: string) => {
    const trimmed = editTitle.trim()
    if (!trimmed) {
      setEditingId(null)
      return
    }

    const previousSubtasks = [...subtasks]
    const updated = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, title: trimmed } : s,
    )
    onSubtasksChange(updated)
    setEditingId(null)

    startTransition(async () => {
      const result = await updateSubtaskTitle(subtaskId, trimmed)
      if (result.error) {
        toast.error(result.error)
        onSubtasksChange(previousSubtasks)
      }
    })
  }

  return (
    <div className='space-y-2.5'>
      {/* Header & Progress Stats */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3 text-muted-foreground/45'>
          <LuListTodo className='w-4 h-4 text-foreground/70' />
          <span className='text-foreground text-base font-semibold'>
            Subtasks
          </span>
        </div>
        {total > 0 && (
          <div className='flex items-center gap-2'>
            <span className='text-xs text-muted-foreground font-medium'>
              {completed} of {total} ({percent}%)
            </span>
          </div>
        )}
      </div>

      <div className='pl-7 space-y-2'>
        {/* Progress Bar */}
        {total > 0 && (
          <div className='w-full bg-muted/60 dark:bg-muted/40 rounded-full h-1.5 overflow-hidden'>
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                percent === 100
                  ? 'bg-emerald-500'
                  : 'bg-primary'
              }`}
              style={{ width: `${percent}%` }}
              role='progressbar'
              aria-label='Subtasks completion progress'
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}

        {/* Subtask Items List */}
        {subtasks.length > 0 && (
          <ul className='space-y-1.5' aria-label='Subtasks checklist'>
            {subtasks.map((subtask) => (
              <li
                key={subtask.id}
                className='group flex items-center justify-between gap-2.5 p-1.5 -mx-1.5 rounded-md hover:bg-muted/40 transition-colors'
              >
                <div className='flex items-center gap-2.5 flex-1 min-w-0'>
                  <Checkbox
                    id={`subtask-${subtask.id}`}
                    checked={subtask.is_completed}
                    onCheckedChange={() => handleToggle(subtask)}
                    className='shrink-0 border-muted-foreground/60 dark:border-muted-foreground/40 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:border-emerald-500'
                    aria-label={`Mark subtask "${subtask.title}" as ${subtask.is_completed ? 'incomplete' : 'complete'}`}
                  />
                  {editingId === subtask.id ? (
                    <div className='flex items-center gap-1.5 flex-1 min-w-0'>
                      <Input
                        ref={editInputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSaveEdit(subtask.id)
                          } else if (e.key === 'Escape') {
                            setEditingId(null)
                          }
                        }}
                        className='h-7 text-xs py-0 px-1.5 flex-1'
                        maxLength={300}
                        aria-label='Edit subtask title'
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shrink-0'
                        onClick={() => handleSaveEdit(subtask.id)}
                        aria-label='Save subtask title'
                      >
                        <LuCheck className='w-3.5 h-3.5' />
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6 text-muted-foreground hover:text-foreground shrink-0'
                        onClick={() => setEditingId(null)}
                        aria-label='Cancel editing'
                      >
                        <LuX className='w-3.5 h-3.5' />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type='button'
                      onClick={() => handleStartEdit(subtask)}
                      className={`text-xs flex-1 text-left truncate cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs py-0.5 ${
                        subtask.is_completed
                          ? 'line-through text-muted-foreground/80'
                          : 'text-foreground hover:text-primary transition-colors'
                      }`}
                      title='Click to edit'
                      aria-label={`Edit subtask title: ${subtask.title}`}
                    >
                      {subtask.title}
                    </button>
                  )}
                </div>

                {editingId !== subtask.id && (
                  <div className='flex items-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity gap-0.5'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-6 w-6 text-muted-foreground/70 hover:text-foreground'
                      onClick={() => handleStartEdit(subtask)}
                      aria-label={`Edit subtask "${subtask.title}"`}
                    >
                      <LuPencil className='w-3 h-3' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-6 w-6 text-muted-foreground/70 hover:text-destructive'
                      onClick={() => handleDelete(subtask.id)}
                      aria-label={`Delete subtask "${subtask.title}"`}
                    >
                      <LuTrash2 className='w-3 h-3' />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Add Subtask Form / Button */}
        {isAdding ? (
          <div className='flex items-center gap-2 pt-1'>
            <Input
              ref={inputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder='What needs to be done?'
              maxLength={300}
              className='h-8 text-xs'
              aria-label='New subtask title'
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  handleAddSubtask()
                } else if (e.key === 'Escape') {
                  setIsAdding(false)
                  setNewTitle('')
                }
              }}
            />
            <Button
              type='button'
              size='sm'
              className='h-8 text-xs px-3'
              disabled={isPending || !newTitle.trim()}
              onClick={handleAddSubtask}
            >
              Add
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-8 text-xs px-2 text-muted-foreground'
              onClick={() => {
                setIsAdding(false)
                setNewTitle('')
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground'
            onClick={() => setIsAdding(true)}
          >
            <LuPlus className='w-3.5 h-3.5 mr-1.5' />
            Add a subtask
          </Button>
        )}
      </div>
    </div>
  )
}
