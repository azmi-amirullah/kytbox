'use client'

import { useState, useTransition } from 'react'
import { LuPlus, LuLightbulb, LuArrowRight } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ListDTO, ListItemDTO } from '@/types/dto'
import { addItem, moveItemToList } from '../actions'
import IdeaItemRow from './IdeaItemRow'
import { toast } from 'react-toastify'

interface NewIdeasProps {
  newIdeaList: ListDTO
  initialItems: ListItemDTO[]
  ideaLists: ListDTO[]
}

interface PendingMove {
  itemId: string
  itemTitle: string
  targetListId: string
  targetListTitle: string
}

export default function NewIdeas({
  newIdeaList,
  initialItems,
  ideaLists,
}: NewIdeasProps) {
  const [items, setItems] = useState(initialItems)
  const [newTitle, setNewTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const formData = new FormData()
    formData.set('listId', newIdeaList.id)
    formData.set('title', newTitle)

    startTransition(async () => {
      const result = await addItem(formData)
      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        setItems((prev) => [...prev, result.data!])
        setNewTitle('')
      }
    })
  }

  const handleItemUpdate = (updatedItem: ListItemDTO) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    )
  }

  const handleItemDelete = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const handleConfirmMove = () => {
    if (!pendingMove) return
    const { itemId, targetListId } = pendingMove

    startTransition(async () => {
      const result = await moveItemToList(itemId, targetListId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setItems((prev) => prev.filter((item) => item.id !== itemId))
        toast.success('Idea moved to list')
      }
      setPendingMove(null)
    })
  }

  return (
    <div className='space-y-4'>
      <div>
        <h2 className='text-lg font-semibold tracking-tight'>Quick Capture</h2>
        <p className='text-sm text-muted-foreground'>
          Capture ideas instantly, organize them into lists later.
        </p>
      </div>

      {/* Quick-add form */}
      <form onSubmit={handleAddItem} className='flex gap-2'>
        <Input
          placeholder='Capture an idea...'
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          maxLength={300}
          className='flex-1'
          aria-label='New idea title'
        />
        <Button
          type='submit'
          disabled={isPending || !newTitle.trim()}
          size='icon'
          aria-label='Add idea'
        >
          <LuPlus className='w-4 h-4' />
        </Button>
      </form>

      {/* Items */}
      {items.length === 0 ? (
        <div className='flex flex-col items-center justify-center min-h-[120px] bg-card border border-dashed rounded-2xl p-6 text-center'>
          <LuLightbulb className='w-8 h-8 text-muted-foreground/40 mb-2' />
          <p className='text-muted-foreground text-sm'>
            No new ideas yet. Type above to capture one.
          </p>
        </div>
      ) : (
        <div className='space-y-2'>
          {items.map((item) => (
            <div key={item.id} className='flex items-center gap-2'>
              <div className='flex-1 min-w-0'>
                <IdeaItemRow
                  item={item}
                  onUpdate={handleItemUpdate}
                  onDelete={handleItemDelete}
                />
              </div>

              {ideaLists.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground'
                      aria-label={`Move "${item.title}" to a list`}
                      disabled={isPending}
                    >
                      <LuArrowRight className='w-4 h-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    {ideaLists.map((list) => (
                      <DropdownMenuItem
                        key={list.id}
                        onClick={() =>
                          setPendingMove({
                            itemId: item.id,
                            itemTitle: item.title,
                            targetListId: list.id,
                            targetListTitle: list.title,
                          })
                        }
                      >
                        {list.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Move confirmation dialog */}
      <AlertDialog
        open={!!pendingMove}
        onOpenChange={(open) => !open && setPendingMove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move idea?</AlertDialogTitle>
            <AlertDialogDescription>
              Move &quot;{pendingMove?.itemTitle}&quot; to{' '}
              <strong>{pendingMove?.targetListTitle}</strong>. It will be
              removed from Quick Capture.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMove} disabled={isPending}>
              {isPending ? 'Moving...' : 'Move'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
