'use client'

import { useState, useTransition } from 'react'
import { LuTag, LuPlus, LuCheck, LuX, LuTrash2 } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { ListLabelDTO } from '@/types/dto'
import {
  LABEL_COLORS,
  getNextAvailableLabelColorIndex,
  getLabelColor,
} from '../lib/label-colors'

interface CardLabelPickerProps {
  selectedLabels: string[]
  boardLabels: ListLabelDTO[]
  onToggleLabel: (labelName: string) => void
  onCreateLabel?: (name: string, colorIndex?: number) => Promise<void>
  onDeleteLabel?: (labelId: string) => Promise<void>
  disabled?: boolean
}

export default function CardLabelPicker({
  selectedLabels,
  boardLabels,
  onToggleLabel,
  onCreateLabel,
  onDeleteLabel,
  disabled = false,
}: CardLabelPickerProps) {
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(
    null,
  )
  const [isPending, startTransition] = useTransition()

  const handleCreate = () => {
    if (!newLabelName.trim() || !onCreateLabel || isPending) return
    const colorIndex =
      selectedColorIndex !== null
        ? selectedColorIndex
        : getNextAvailableLabelColorIndex(boardLabels)

    startTransition(async () => {
      await onCreateLabel(newLabelName.trim(), colorIndex)
      // Automatically select the newly created label
      onToggleLabel(newLabelName.trim())
      setNewLabelName('')
      setSelectedColorIndex(null)
      setIsCreating(false)
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={disabled}
          className='h-8 text-xs font-medium border-border/80 hover:border-border transition-colors flex items-center gap-1.5'
          aria-label='Manage card labels'
        >
          <LuTag className='h-3.5 w-3.5 text-muted-foreground' />
          <span>Labels</span>
          {selectedLabels.length > 0 && (
            <span className='ml-1 rounded-full bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-semibold'>
              {selectedLabels.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align='start'
        className='w-72 p-3 space-y-3 bg-popover text-popover-foreground shadow-xl border-border rounded-xl'
      >
        <div className='flex items-center justify-between pb-1 border-b border-border/60'>
          <h4 className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
            <LuTag className='h-3.5 w-3.5 text-primary' />
            Card Labels
          </h4>
          <span className='text-[11px] text-muted-foreground'>
            {selectedLabels.length} selected
          </span>
        </div>

        {/* Existing Board Labels List */}
        <div className='max-h-48 overflow-y-auto space-y-1 pr-1'>
          {boardLabels.length === 0 ? (
            <div className='text-center py-4 text-xs text-muted-foreground'>
              No labels created yet.
            </div>
          ) : (
            boardLabels.map((lbl) => {
              const style = getLabelColor(lbl.color_index)
              const isSelected = selectedLabels.some(
                (s) => s.toLowerCase() === lbl.name.toLowerCase(),
              )

              return (
                <div
                  key={lbl.id}
                  className='group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/60 transition-colors text-xs'
                >
                  <button
                    type='button'
                    onClick={() => onToggleLabel(lbl.name)}
                    className='flex items-center gap-2 flex-1 text-left min-w-0'
                  >
                    <span
                      className={`inline-flex items-center justify-center w-4 h-4 rounded border text-[10px] transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-muted-foreground/30 bg-background'
                      }`}
                    >
                      {isSelected && <LuCheck className='h-3 w-3 stroke-3' />}
                    </span>
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${style.dot} shrink-0`}
                    />
                    <span className='truncate font-medium text-foreground'>
                      {lbl.name}
                    </span>
                  </button>

                  {onDeleteLabel && (
                    <button
                      type='button'
                      onClick={() => onDeleteLabel(lbl.id)}
                      className='opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded transition-all'
                      title='Delete label from board'
                      aria-label={`Delete label ${lbl.name}`}
                    >
                      <LuTrash2 className='h-3 w-3' />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Create New Label Section */}
        {onCreateLabel && (
          <div className='pt-2 border-t border-border/60'>
            {!isCreating ? (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => setIsCreating(true)}
                className='w-full h-8 text-xs justify-start text-muted-foreground hover:text-foreground gap-1.5'
              >
                <LuPlus className='h-3.5 w-3.5' />
                Create new label
              </Button>
            ) : (
              <div className='space-y-2 pt-1'>
                <div className='flex items-center gap-1.5'>
                  <Input
                    type='text'
                    placeholder='Label name (e.g. Urgent)'
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCreate()
                      }
                    }}
                    className='h-7 text-xs flex-1'
                    maxLength={30}
                  />
                  <Button
                    type='button'
                    size='sm'
                    disabled={!newLabelName.trim() || isPending}
                    onClick={handleCreate}
                    className='h-7 px-2.5 text-xs'
                  >
                    Add
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setIsCreating(false)
                      setNewLabelName('')
                    }}
                    className='h-7 w-7 p-0'
                  >
                    <LuX className='h-3.5 w-3.5' />
                  </Button>
                </div>

                {/* Color Palette Picker */}
                <div className='flex items-center gap-1 flex-wrap pt-1'>
                  {LABEL_COLORS.map((col, idx) => {
                    const isPicked =
                      selectedColorIndex === idx ||
                      (selectedColorIndex === null &&
                        idx === getNextAvailableLabelColorIndex(boardLabels))

                    return (
                      <button
                        key={idx}
                        type='button'
                        onClick={() => setSelectedColorIndex(idx)}
                        className={`w-4 h-4 rounded-full ${col.dot} transition-transform ${
                          isPicked
                            ? 'ring-2 ring-offset-1 ring-primary scale-110'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                        title={`Color slot ${idx + 1}`}
                        aria-label={`Select color ${idx + 1}`}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
