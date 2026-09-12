'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'react-toastify'
import {
  LuListTodo,
  LuCalendar,
  LuFileText,
} from 'react-icons/lu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { VehicleDTO } from '@/types/dto'
import { getUserLists, syncMaintenanceRuleToList } from '../actions'

interface AddToListModalProps {
  vehicle: VehicleDTO
  ruleName: string
  predictedDueDate?: string | null
  isOverdue?: boolean
  isOpen: boolean
  onClose: () => void
  onSuccess?: (item: { itemId: string; listId: string }) => void
}

export function AddToListModal({
  vehicle,
  ruleName,
  predictedDueDate,
  isOverdue = false,
  isOpen,
  onClose,
  onSuccess,
}: AddToListModalProps) {
  const [isPending, startTransition] = useTransition()
  const [lists, setLists] = useState<Array<{ id: string; title: string; type: string }>>([])
  const [isLoadingLists, setIsLoadingLists] = useState(isOpen)

  const defaultTitle = `[${vehicle.name}] Service: ${ruleName}`
  const defaultDueDate = predictedDueDate || new Date().toISOString().slice(0, 10)
  const defaultPriority = isOverdue ? 'high' : 'medium'

  const [selectedListId, setSelectedListId] = useState<string>('')
  const [taskTitle, setTaskTitle] = useState(defaultTitle)
  const [dueDate, setDueDate] = useState<string>(defaultDueDate)
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(defaultPriority)
  const [notes, setNotes] = useState('')

  // Synchronize form state during render phase when modal opens or rule changes
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen)
  const [prevRuleName, setPrevRuleName] = useState<string>(ruleName)

  if (isOpen !== prevIsOpen || ruleName !== prevRuleName) {
    setPrevIsOpen(isOpen)
    setPrevRuleName(ruleName)
    if (isOpen) {
      setTaskTitle(defaultTitle)
      setDueDate(defaultDueDate)
      setPriority(defaultPriority)
      setNotes('')
      setIsLoadingLists(true)
    }
  }

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    getUserLists().then((res) => {
      if (!isMounted) return
      setIsLoadingLists(false)
      if (res.success && res.data && res.data.length > 0) {
        const fetchedLists = res.data
        const firstId = fetchedLists[0].id
        setLists(fetchedLists)
        setSelectedListId((prev) => prev || firstId)
      }
    })

    return () => {
      isMounted = false
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedListId) {
      toast.error('Please select a destination List board')
      return
    }

    if (!taskTitle.trim()) {
      toast.error('Task title is required')
      return
    }

    startTransition(async () => {
      const res = await syncMaintenanceRuleToList({
        listId: selectedListId,
        vehicleId: vehicle.id,
        ruleName: taskTitle.trim(),
        dueDate: dueDate || null,
        priority,
        notes: notes.trim() || null,
      })

      if (res.success && res.data) {
        const targetList = lists.find((l) => l.id === selectedListId)
        toast.success(`Task added to "${targetList?.title || 'List'}"!`)
        onSuccess?.(res.data)
        onClose()
      } else {
        toast.error(res.error || 'Failed to add task to list')
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-base font-semibold text-foreground'>
            <LuListTodo className='size-5 text-primary' aria-hidden='true' />
            <span>Add Maintenance Task to List</span>
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Create an actionable reminder card on your List Kanban board for{' '}
            <strong className='text-foreground'>{vehicle.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-1'>
          {/* Destination List Board */}
          <div>
            <Label className='text-xs font-medium mb-1 block'>Destination List Board</Label>
            {isLoadingLists ? (
              <div className='h-9 w-full animate-pulse rounded-md bg-muted' />
            ) : lists.length === 0 ? (
              <div className='rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400'>
                No lists found. Please create a list in the List app first.
              </div>
            ) : (
              <Select value={selectedListId} onValueChange={setSelectedListId}>
                <SelectTrigger className='text-xs min-h-9'>
                  <SelectValue placeholder='Select a list board' />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((l) => (
                    <SelectItem key={l.id} value={l.id} className='text-xs'>
                      {l.title} ({l.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Task Title */}
          <div>
            <Label htmlFor='task-title' className='text-xs font-medium mb-1 block'>
              Card Title
            </Label>
            <Input
              id='task-title'
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
              className='text-xs'
            />
          </div>

          {/* Due Date & Priority */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <Label className='text-xs font-medium flex items-center gap-1.5 mb-1'>
                <LuCalendar className='size-3.5 text-muted-foreground' aria-hidden='true' />
                Due Date
              </Label>
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                className='w-full'
              />
            </div>

            <div>
              <Label className='text-xs font-medium mb-1 block'>Priority</Label>
              <Select
                value={priority}
                onValueChange={(val: 'low' | 'medium' | 'high' | 'urgent') => setPriority(val)}
              >
                <SelectTrigger className='text-xs min-h-9'>
                  <SelectValue placeholder='Priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low' className='text-xs'>Low</SelectItem>
                  <SelectItem value='medium' className='text-xs'>Medium</SelectItem>
                  <SelectItem value='high' className='text-xs'>High</SelectItem>
                  <SelectItem value='urgent' className='text-xs'>Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor='task-notes' className='text-xs font-medium flex items-center gap-1.5 mb-1'>
              <LuFileText className='size-3.5 text-muted-foreground' aria-hidden='true' />
              Description (Optional)
            </Label>
            <Textarea
              id='task-notes'
              rows={2}
              placeholder='e.g. Call Honda workshop or purchase oil filter online'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className='text-xs resize-none'
            />
          </div>

          <DialogFooter className='gap-2 pt-2 sm:space-x-0'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isPending}
              className='text-xs min-h-10'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isPending || lists.length === 0}
              className='text-xs min-h-10'
            >
              {isPending ? 'Adding to List...' : 'Add to List Board'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
