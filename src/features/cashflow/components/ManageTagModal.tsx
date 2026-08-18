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
import { renameCashflowTag, deleteCashflowTag } from '../actions'

interface ManageTagModalProps {
  cashflowId: string
  tag: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ManageTagModal({
  cashflowId,
  tag,
  open,
  onOpenChange,
  onSuccess,
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

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!tag) return
    const trimmed = newTag.trim().replace(/^#/, '')
    if (!trimmed) {
      toast.error('Tag name cannot be empty')
      return
    }
    if (trimmed.length > 30) {
      toast.error('Tag name cannot exceed 30 characters')
      return
    }
    if (trimmed === tag) {
      onOpenChange(false)
      return
    }

    setIsRenaming(true)
    try {
      const formData = new FormData()
      formData.append('cashflowId', cashflowId)
      formData.append('oldTag', tag)
      formData.append('newTag', trimmed)

      const result = await renameCashflowTag(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Renamed #${tag} to #${trimmed} across all transactions`)
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
      formData.append('tag', tag)

      const result = await deleteCashflowTag(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Removed #${tag} from all transactions`)
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
                <LuTag className='w-4 h-4 text-primary' /> Manage Tag: #{tag}
              </span>
            }
            description='Rename or remove this tag across all transactions in this cashflow book.'
            onClose={() => onOpenChange(false)}
          />

          <form onSubmit={handleRename} className='space-y-4 py-2'>
            <div className='grid gap-2'>
              <Label htmlFor='tag-name' className='font-medium text-foreground/80'>
                Tag Name
              </Label>
              <Input
                id='tag-name'
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder='e.g. Keamanan'
                maxLength={30}
              />
            </div>

            <DialogFooter className='flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isRenaming || isDeleting}
                className='text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5'
              >
                <LuTrash2 className='w-3.5 h-3.5' />
                Delete from all entries
              </Button>

              <div className='flex gap-2 justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  disabled={isRenaming || isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isRenaming || isDeleting || !newTag.trim() || newTag.trim() === tag}
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
            <AlertDialogTitle>Delete Tag #{tag}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the tag &quot;#{tag}&quot; from all transactions in this cashflow book and free up its color slot. This action cannot be undone.
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
