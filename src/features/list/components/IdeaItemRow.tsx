'use client'

import { useState, useTransition } from 'react'
import { LuTrash2, LuCheck, LuX } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import type { ListItemDTO } from '@/types/dto'
import { toggleItem, deleteItem, updateItem } from '../actions'
import { toast } from 'react-toastify'

interface IdeaItemRowProps {
  item: ListItemDTO
  onUpdate: (item: ListItemDTO) => void
  onDelete: (itemId: string) => void
}

export default function IdeaItemRow({
  item,
  onUpdate,
  onDelete,
}: IdeaItemRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    if (isPending) return
    startTransition(async () => {
      const result = await toggleItem(item.id, !item.is_completed)
      if (result.error) {
        toast.error(result.error)
      } else {
        onUpdate({ ...item, is_completed: !item.is_completed })
      }
    })
  }

  const handleDelete = () => {
    if (isPending) return
    startTransition(async () => {
      const result = await deleteItem(item.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        onDelete(item.id)
      }
    })
  }

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return

    const formData = new FormData()
    formData.set('title', editTitle)

    startTransition(async () => {
      const result = await updateItem(item.id, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        onUpdate({ ...item, title: editTitle.trim() })
        setIsEditing(false)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit()
    if (e.key === 'Escape') {
      setEditTitle(item.title)
      setIsEditing(false)
    }
  }

  return (
    <div
      className={`group flex items-center gap-3 p-3 bg-card border rounded-xl transition-all duration-300 ${
        item.is_completed ? 'opacity-60' : ''
      }`}
      role='listitem'
    >
      <Checkbox
        checked={item.is_completed}
        onCheckedChange={handleToggle}
        className={`cursor-pointer ${isPending ? 'cursor-wait' : 'cursor-pointer'} border-muted-foreground/60 dark:border-muted-foreground/40 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:border-emerald-500`}
        aria-label={`Mark "${item.title}" as ${item.is_completed ? 'not noted' : 'noted'}`}
      />

      {isEditing ? (
        <div className='flex-1 flex items-center gap-1.5'>
          <Input
            ref={(input) => {
              if (input) input.focus()
            }}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className='flex-1 h-8'
            maxLength={300}
          />
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
            onClick={handleSaveEdit}
            aria-label='Save edit'
            disabled={isPending}
          >
            <LuCheck className='w-4 h-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 text-muted-foreground hover:text-foreground'
            onClick={() => {
              setEditTitle(item.title)
              setIsEditing(false)
            }}
            aria-label='Cancel edit'
            disabled={isPending}
          >
            <LuX className='w-4 h-4' />
          </Button>
        </div>
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`flex-1 text-base md:text-sm cursor-pointer transition-all duration-300 ${
            item.is_completed ? 'line-through text-muted-foreground' : ''
          }`}
          role='button'
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
        >
          {item.title}
        </span>
      )}

      {!isEditing && (
        <Button
          variant='ghost'
          size='icon'
          className={`h-7 w-7 text-destructive hover:text-destructive/80 hover:bg-destructive/10 ${isPending ? 'cursor-wait' : 'cursor-pointer'}`}
          onClick={handleDelete}
          aria-label={`Delete "${item.title}"`}
        >
          <LuTrash2 className='w-3.5 h-3.5' />
        </Button>
      )}
    </div>
  )
}
