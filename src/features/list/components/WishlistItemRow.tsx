'use client'

import { useState, useTransition } from 'react'
import { LuTrash2, LuExternalLink, LuRotateCcw, LuMessageSquare } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import type { ListItemDTO } from '@/types/dto'
import { toggleItem, deleteItem, releaseWishlistItemClaimAction } from '../actions'
import { toast } from 'react-toastify'
import { wishlistMetadataClientSchema } from '../schemas.client'
import EditWishlistItemModal from './EditWishlistItemModal'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface WishlistItemRowProps {
  item: ListItemDTO
  onUpdate: (item: ListItemDTO) => void
  onDelete: (itemId: string) => void
  defaultCurrency?: string
}

export default function WishlistItemRow({
  item,
  onUpdate,
  onDelete,
  defaultCurrency,
}: WishlistItemRowProps) {
  const [isPending, startTransition] = useTransition()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: isPending,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    touchAction: 'none',
  }

  const { price: rawPrice, currency: rawCurrency, purchase_url: rawUrl, claim } = wishlistMetadataClientSchema.parse(item.metadata)
  const price = rawPrice ?? 0
  const currency = rawCurrency || defaultCurrency || ''
  const purchaseUrl = rawUrl ?? undefined

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
        setIsDeleteDialogOpen(false)
      }
    })
  }

  const handleReleaseClaim = () => {
    if (isPending) return
    if (!window.confirm(`Release claim on "${item.title}"? This will make the item available for anyone to claim again.`)) {
      return
    }
    startTransition(async () => {
      const result = await releaseWishlistItemClaimAction({
        itemId: item.id,
        listId: item.list_id,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Claim released')
        const rawMeta = typeof item.metadata === 'object' && item.metadata !== null ? item.metadata : {}
        const newMeta: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(rawMeta)) {
          if (k !== 'claim') newMeta[k] = v
        }
        onUpdate({ ...item, metadata: newMeta })
      }
    })
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`group flex items-center gap-3 p-4 bg-card border rounded-xl transition-all duration-300 hover:border-pink-500/30 ${
          item.is_completed ? 'opacity-60' : ''
        } ${isDragging ? 'shadow-md border-pink-500/30 opacity-50 z-50' : ''}`}
        role='listitem'
      >
        <Checkbox
          checked={item.is_completed}
          onCheckedChange={handleToggle}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={`cursor-pointer ${isPending ? 'cursor-wait' : 'cursor-pointer'} border-muted-foreground/60 dark:border-muted-foreground/40 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:border-emerald-500`}
          aria-label={`Mark "${item.title}" as ${item.is_completed ? 'not purchased' : 'purchased'}`}
        />

        <div
          role='button'
          tabIndex={0}
          onClick={() => setIsEditOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsEditOpen(true)
            }
          }}
          className='flex-1 min-w-0 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm'
          aria-label={`Edit wish "${item.title}"`}
        >
          <span
            className={`text-sm font-medium transition-all duration-300 ${
              item.is_completed ? 'line-through text-muted-foreground' : ''
            }`}
          >
            {item.title}
          </span>
          {item.description && (
            <p className='text-xs text-muted-foreground truncate mt-0.5'>
              {item.description}
            </p>
          )}
          {claim?.note && (
            <p className='text-xs text-muted-foreground mt-1 flex items-center gap-1.5'>
              <LuMessageSquare className='w-3.5 h-3.5 text-primary shrink-0' />
              <span className='italic truncate'>&ldquo;{claim.note}&rdquo;</span>
            </p>
          )}
        </div>

        <div className='flex items-center gap-2 shrink-0' onPointerDown={(e) => e.stopPropagation()}>
          {claim?.claimed_at && (
            <span className='text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'>
              Claimed{claim.claimed_by_name ? ` by ${claim.claimed_by_name}` : ''}
            </span>
          )}

          {price > 0 && (
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                item.is_completed
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
              }`}
            >
              {currency} {price.toLocaleString()}
            </span>
          )}

          {claim?.claimed_at && (
            <Button
              variant='ghost'
              size='icon'
              disabled={isPending}
              onClick={handleReleaseClaim}
              className='h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/10'
              title='Release claim and make gift available again'
              aria-label={`Release claim on "${item.title}"`}
            >
              <LuRotateCcw className='w-4 h-4' />
            </Button>
          )}

          {purchaseUrl && (
            <Button
              variant='ghost'
              size='icon'
              asChild
              className='h-7 w-7 text-muted-foreground hover:text-primary'
            >
              <a
                href={purchaseUrl}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={`Open purchase link for "${item.title}"`}
                onClick={(e) => e.stopPropagation()}
              >
                <LuExternalLink className='w-4 h-4' />
              </a>
            </Button>
          )}

          <Button
            variant='ghost'
            size='icon'
            className={`h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 ${isPending ? 'cursor-wait' : 'cursor-pointer'}`}
            onClick={(e) => {
              e.stopPropagation()
              setIsDeleteDialogOpen(true)
            }}
            aria-label={`Delete "${item.title}"`}
          >
            <LuTrash2 className='w-4 h-4' />
          </Button>
        </div>
      </div>

      <EditWishlistItemModal
        item={item}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onItemUpdated={onUpdate}
        defaultCurrency={defaultCurrency}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete wish item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{item.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              disabled={isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
