'use client'

import React, { useState } from 'react'
import {
  LuTrash2,
  LuTag,
  LuFolder,
  LuX,
  LuLoader,
  LuCheck,
  LuPlus,
} from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
import { Input } from '@/components/ui/input'
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../constants'
import { resolveTagColor } from '../lib/tag-colors'
import type { CashflowTagDTO } from '@/types/dto'
import { cn } from '@/lib/utils'

interface BulkActionsToolbarProps {
  selectedCount: number
  selectionType?: 'income' | 'expense' | 'mixed'
  onClearSelection: () => void
  onDeleteSelected: () => Promise<void>
  onUpdateCategory: (category: string | null) => Promise<void>
  onAddTags: (tags: string[]) => Promise<void>
  availableTags?: string[]
  bookTags?: CashflowTagDTO[]
  activeAction?: 'category' | 'tag' | 'delete' | null
  isPending?: boolean
}

export function BulkActionsToolbar({
  selectedCount,
  selectionType,
  onClearSelection,
  onDeleteSelected,
  onUpdateCategory,
  onAddTags,
  availableTags = [],
  bookTags = [],
  activeAction: externalActiveAction,
  isPending = false,
}: BulkActionsToolbarProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false)
  const [selectedTagsToAdd, setSelectedTagsToAdd] = useState<string[]>([])
  const [customTagInput, setCustomTagInput] = useState('')
  const [localActiveAction, setLocalActiveAction] = useState<
    'category' | 'tag' | 'delete' | null
  >(null)

  const activeAction = externalActiveAction ?? localActiveAction
  const isBusy = isPending || activeAction !== null

  if (selectedCount === 0) return null

  function handleAddCustomTag() {
    const clean = customTagInput.trim().replace(/^#/, '')
    if (!clean) return
    if (!selectedTagsToAdd.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setSelectedTagsToAdd((prev) => [...prev, clean])
    }
    setCustomTagInput('')
  }

  function toggleTagSelection(tag: string) {
    setSelectedTagsToAdd((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  async function handleCategorySelect(cat: string | null) {
    setLocalActiveAction('category')
    try {
      await onUpdateCategory(cat)
    } finally {
      setLocalActiveAction(null)
    }
  }

  async function handleApplyTags() {
    if (selectedTagsToAdd.length === 0) return
    setLocalActiveAction('tag')
    setIsTagPopoverOpen(false)
    try {
      await onAddTags(selectedTagsToAdd)
      setSelectedTagsToAdd([])
    } finally {
      setLocalActiveAction(null)
    }
  }

  async function handleDeleteConfirm() {
    setLocalActiveAction('delete')
    try {
      await onDeleteSelected()
      setIsDeleteDialogOpen(false)
    } finally {
      setLocalActiveAction(null)
    }
  }

  return (
    <>
      <div
        role='toolbar'
        aria-label='Bulk actions toolbar'
        className='fixed bottom-5 inset-x-0 z-40 flex justify-center px-3 sm:px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-6 duration-200'
      >
        <div className='pointer-events-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3.5 sm:px-5 py-2.5 bg-background/95 dark:bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl max-w-2xl w-full ring-1 ring-black/5 dark:ring-white/10'>
          {/* Left: Selection Counter & Clear Button */}
          <div className='flex items-center gap-2'>
            <span className='inline-flex items-center justify-center text-xs font-semibold px-2.5 py-1 bg-primary text-primary-foreground rounded-full shadow-2xs'>
              {selectedCount} selected
            </span>
            <Button
              variant='ghost'
              size='sm'
              disabled={isBusy}
              onClick={onClearSelection}
              className='h-7 sm:h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer rounded-lg'
              title='Clear selection'
            >
              <LuX className='w-3.5 h-3.5 mr-1' />
              <span>Clear</span>
            </Button>
          </div>

          {/* Right: Batch Action Buttons */}
          <div className='flex items-center gap-1.5 sm:gap-2 flex-wrap'>
            {/* Category Reassignment Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={isBusy}
                  className='h-7 sm:h-8 px-2.5 text-xs font-medium gap-1.5 rounded-lg cursor-pointer'
                >
                  {activeAction === 'category' ? (
                    <LuLoader className='w-3.5 h-3.5 text-muted-foreground animate-spin' />
                  ) : (
                    <LuFolder className='w-3.5 h-3.5 text-muted-foreground' />
                  )}
                  <span>Category</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='w-60 max-h-80 overflow-y-auto p-1.5'
              >
                {/* Mixed selection warning notice */}
                {selectionType === 'mixed' && (
                  <div className='p-2 mb-1 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-md font-medium'>
                    Mixed Expense & Income selected. Deselect one type to assign specific categories.
                  </div>
                )}

                {/* Show Expense Categories ONLY when all selected are expenses */}
                {selectionType === 'expense' && (
                  <>
                    <DropdownMenuLabel className='text-xs font-semibold text-muted-foreground'>
                      Expense Categories
                    </DropdownMenuLabel>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <DropdownMenuItem
                        key={cat.value}
                        onClick={() => handleCategorySelect(cat.value)}
                        className='text-xs cursor-pointer'
                      >
                        {cat.label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                {/* Show Income Categories ONLY when all selected are income */}
                {selectionType === 'income' && (
                  <>
                    <DropdownMenuLabel className='text-xs font-semibold text-muted-foreground'>
                      Income Categories
                    </DropdownMenuLabel>
                    {INCOME_CATEGORIES.map((cat) => (
                      <DropdownMenuItem
                        key={cat.value}
                        onClick={() => handleCategorySelect(cat.value)}
                        className='text-xs cursor-pointer'
                      >
                        {cat.label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                {selectionType !== 'mixed' && <DropdownMenuSeparator />}

                <DropdownMenuItem
                  onClick={() => handleCategorySelect(null)}
                  className='text-xs text-muted-foreground hover:text-foreground cursor-pointer font-medium'
                >
                  Clear Category (Uncategorized)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bulk Tag Picker Popover */}
            <Popover open={isTagPopoverOpen} onOpenChange={setIsTagPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={isBusy}
                  className='h-7 sm:h-8 px-2.5 text-xs font-medium gap-1.5 rounded-lg cursor-pointer'
                >
                  {activeAction === 'tag' ? (
                    <LuLoader className='w-3.5 h-3.5 text-muted-foreground animate-spin' />
                  ) : (
                    <LuTag className='w-3.5 h-3.5 text-muted-foreground' />
                  )}
                  <span>Add Tags</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align='end' className='w-72 p-3 space-y-3'>
                <div className='space-y-1.5'>
                  <h4 className='text-xs font-semibold text-foreground'>
                    Apply Tags to {selectedCount} items
                  </h4>
                  <p className='text-[11px] text-muted-foreground'>
                    Selected tags will be merged into all chosen entries.
                  </p>
                </div>

                {/* Input for new tag */}
                <div className='flex items-center gap-1.5'>
                  <Input
                    placeholder='New tag...'
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddCustomTag()
                      }
                    }}
                    className='h-8 text-xs'
                  />
                  <Button
                    type='button'
                    variant='secondary'
                    size='sm'
                    onClick={handleAddCustomTag}
                    disabled={!customTagInput.trim()}
                    className='h-8 px-2.5 text-xs cursor-pointer'
                  >
                    <LuPlus className='w-3.5 h-3.5' />
                  </Button>
                </div>

                {/* Available existing book tags */}
                {availableTags.length > 0 && (
                  <div className='space-y-1'>
                    <span className='text-[11px] font-medium text-muted-foreground'>
                      Existing tags:
                    </span>
                    <div className='flex flex-wrap gap-1 max-h-32 overflow-y-auto p-0.5'>
                      {availableTags.map((tag) => {
                        const isSelected = selectedTagsToAdd.includes(tag)
                        const tagColor = resolveTagColor(tag, bookTags)
                        return (
                          <button
                            key={tag}
                            type='button'
                            onClick={() => toggleTagSelection(tag)}
                            className={cn(
                              'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border transition-all cursor-pointer select-none',
                              isSelected
                                ? cn(
                                    tagColor.activeBg,
                                    tagColor.activeText,
                                    tagColor.activeBorder,
                                    'ring-1 ring-primary/40 font-semibold',
                                  )
                                : cn(
                                    tagColor.bg,
                                    tagColor.text,
                                    tagColor.border,
                                    'opacity-70 hover:opacity-100',
                                  ),
                            )}
                          >
                            {isSelected && <LuCheck className='w-3 h-3' />}
                            <span>#{tag}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Selected tags preview */}
                {selectedTagsToAdd.length > 0 && (
                  <div className='flex flex-wrap gap-1 pt-1 border-t border-border/40'>
                    {selectedTagsToAdd.map((tag) => (
                      <span
                        key={tag}
                        className='inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20'
                      >
                        #{tag}
                        <button
                          type='button'
                          onClick={() => toggleTagSelection(tag)}
                          className='hover:text-destructive cursor-pointer'
                        >
                          <LuX className='w-3 h-3' />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Apply Button */}
                <Button
                  size='sm'
                  onClick={handleApplyTags}
                  disabled={selectedTagsToAdd.length === 0 || isBusy}
                  className='w-full h-8 text-xs font-medium cursor-pointer'
                >
                  {activeAction === 'tag' ? (
                    <LuLoader className='w-3.5 h-3.5 animate-spin mr-1.5' />
                  ) : (
                    <LuCheck className='w-3.5 h-3.5 mr-1.5' />
                  )}
                  Apply {selectedTagsToAdd.length} {selectedTagsToAdd.length === 1 ? 'Tag' : 'Tags'}
                </Button>
              </PopoverContent>
            </Popover>

            {/* Delete Selected Button */}
            <Button
              variant='destructive'
              size='sm'
              disabled={isBusy}
              onClick={() => setIsDeleteDialogOpen(true)}
              className='h-7 sm:h-8 px-2.5 text-xs font-medium gap-1.5 rounded-lg cursor-pointer'
            >
              {activeAction === 'delete' ? (
                <LuLoader className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <LuTrash2 className='w-3.5 h-3.5' />
              )}
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedCount} {selectedCount === 1 ? 'Transaction' : 'Transactions'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {selectedCount}{' '}
              {selectedCount === 1 ? 'selected transaction' : 'selected transactions'}? This will also remove any attached receipt photos and split breakdowns. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBusy}
              onClick={async (e) => {
                e.preventDefault()
                await handleDeleteConfirm()
              }}
              className='bg-destructive hover:bg-destructive/90 text-destructive-foreground'
            >
              {activeAction === 'delete' ? (
                <LuLoader className='w-4 h-4 animate-spin mr-2' />
              ) : (
                <LuTrash2 className='w-4 h-4 mr-2' />
              )}
              Delete {selectedCount} {selectedCount === 1 ? 'Item' : 'Items'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

