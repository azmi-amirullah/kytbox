'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  ModalHeader,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LuTag, LuTrash2, LuLoader } from 'react-icons/lu'
import { toast } from 'react-toastify'
import { cn } from '@/lib/utils'
import { resolveTagColor } from '../lib/tag-colors'
import type { CashflowTagDTO } from '@/types/dto'
import { renameCashflowTag, deleteCashflowTag } from '../actions'

interface ManageTagModalProps {
  cashflowId: string
  tag: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  bookTags?: CashflowTagDTO[]
}

export function ManageTagModal({
  cashflowId,
  tag,
  open,
  onOpenChange,
  onSuccess,
  bookTags = [],
}: ManageTagModalProps) {
  const [newTag, setNewTag] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (tag) {
      setNewTag(tag)
    }
  }, [tag])

  if (!tag) return null

  const cleanCurrentTag = tag.replace(/^#/, '')
  const cleanNewTag = newTag.trim().replace(/^#/, '')
  const activePreviewTag = cleanNewTag || cleanCurrentTag
  const previewColor = resolveTagColor(activePreviewTag, bookTags)
  const hasChanged = cleanNewTag.length > 0 && cleanNewTag !== cleanCurrentTag

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!tag) return
    if (!cleanNewTag) {
      toast.error('Tag name cannot be empty')
      return
    }
    if (cleanNewTag.length > 30) {
      toast.error('Tag name cannot exceed 30 characters')
      return
    }
    if (cleanNewTag === cleanCurrentTag) {
      onOpenChange(false)
      return
    }

    setIsRenaming(true)
    try {
      const formData = new FormData()
      formData.append('cashflowId', cashflowId)
      formData.append('oldTag', cleanCurrentTag)
      formData.append('newTag', cleanNewTag)

      const result = await renameCashflowTag(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Renamed #${cleanCurrentTag} to #${cleanNewTag} across all transactions`)
        onOpenChange(false)
        onSuccess()
      }
    } catch {
      toast.error('Failed to rename tag')
    } finally {
      setIsRenaming(false)
    }
  }

  async function handleConfirmDelete() {
    if (!tag) return

    setIsDeleting(true)
    try {
      const formData = new FormData()
      formData.append('cashflowId', cashflowId)
      formData.append('tag', cleanCurrentTag)

      const result = await deleteCashflowTag(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Removed #${cleanCurrentTag} from all transactions`)
        setShowDeleteConfirm(false)
        onOpenChange(false)
        onSuccess()
      }
    } catch {
      toast.error('Failed to delete tag')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-md'>
          <ModalHeader
            title={
              <span className='flex items-center gap-2'>
                <LuTag className='w-4 h-4 text-primary' /> Manage Tag
              </span>
            }
            description='Update or remove this tag across all transactions.'
            onClose={() => onOpenChange(false)}
          />

          <form onSubmit={handleRename} className='space-y-4 pt-1'>
            {/* Live Tag Preview Badge */}
            <div className='flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60'>
              <span className='text-xs text-muted-foreground font-medium'>Live Preview</span>
              <span
                className={cn(
                  'inline-flex items-center h-6 px-2.5 rounded-md text-xs font-semibold border leading-none transition-all shadow-xs',
                  previewColor.bg,
                  previewColor.text,
                  previewColor.border,
                )}
              >
                #{activePreviewTag}
              </span>
            </div>

            {/* Input with Hashtag adornment */}
            <div className='grid gap-1.5'>
              <Label htmlFor='tag-name' className='text-xs font-semibold text-foreground'>
                Tag Name
              </Label>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground font-mono select-none pointer-events-none'>
                  #
                </span>
                <Input
                  id='tag-name'
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value.replace(/^#/, ''))}
                  placeholder='e.g. ShopeeFood'
                  maxLength={30}
                  className='pl-7 font-medium'
                />
              </div>
              <p className='text-[11px] text-muted-foreground'>
                Renaming updates this tag across all transactions in this cashflow book.
              </p>
            </div>

            {/* Modal Footer with Clean Separation */}
            <DialogFooter className='flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-3 border-t border-border/60 sm:space-x-0'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isRenaming || isDeleting}
                className='text-destructive hover:bg-destructive/10 hover:text-destructive h-9 px-2.5 text-xs gap-1.5 cursor-pointer w-full sm:w-auto justify-center sm:justify-start'
              >
                <LuTrash2 className='w-3.5 h-3.5' />
                <span>Delete tag</span>
              </Button>

              <div className='flex w-full sm:w-auto items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  disabled={isRenaming || isDeleting}
                  className='h-9 px-3 text-xs flex-1 sm:flex-initial'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isRenaming || isDeleting || !hasChanged}
                  className='h-9 px-4 text-xs font-semibold flex-1 sm:flex-initial'
                >
                  {isRenaming && <LuLoader className='w-3.5 h-3.5 animate-spin mr-1.5' />}
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Shadcn Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag #{cleanCurrentTag}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the tag &quot;#{cleanCurrentTag}&quot; from all transactions in this cashflow book and free up its color slot. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              disabled={isDeleting}
              className='bg-destructive text-white hover:bg-destructive/90 min-w-20'
            >
              {isDeleting ? (
                <div className='flex items-center gap-2'>
                  <LuLoader className='w-3.5 h-3.5 animate-spin' />
                  <span>Deleting...</span>
                </div>
              ) : (
                'Delete Tag'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
