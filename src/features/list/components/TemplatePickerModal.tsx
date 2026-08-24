'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  LuZap,
  LuCalendarDays,
  LuCalendarCheck,
  LuBug,
  LuUsers,
  LuMap,
  LuLoader,
} from 'react-icons/lu'
import { BOARD_TEMPLATES } from '../templates'
import type { TemplateId } from '../templates'
import { createBoardFromTemplate } from '../actions'
import { toast } from 'react-toastify'

interface TemplatePickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBlankBoard: () => void
}

const ICON_MAP: Record<string, React.ElementType> = {
  LuZap,
  LuCalendarDays,
  LuCalendarCheck,
  LuBug,
  LuUsers,
  LuMap,
}

export default function TemplatePickerModal({
  open,
  onOpenChange,
  onBlankBoard,
}: TemplatePickerModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<TemplateId | null>(null)

  // Bug fix: reset pendingId whenever the modal closes so reopening
  // doesn't show a stale loading state on the previously selected card.
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setPendingId(null)
      onOpenChange(open)
    },
    [onOpenChange],
  )

  const handleUseTemplate = useCallback(
    (templateId: TemplateId) => {
      if (isPending) return
      setPendingId(templateId)
      startTransition(async () => {
        const result = await createBoardFromTemplate(templateId)
        if (result.error) {
          toast.error(result.error)
          setPendingId(null)
          return
        }
        handleOpenChange(false)
        router.push(`/list/todo/${result.data!.listId}`)
      })
    },
    [isPending, handleOpenChange, router],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, templateId: TemplateId) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleUseTemplate(templateId)
      }
    },
    [handleUseTemplate],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-3xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader className='pb-2'>
          <DialogTitle className='text-xl font-semibold tracking-tight'>
            Choose a Template
          </DialogTitle>
          <DialogDescription>
            Get started instantly with a pre-built workflow.
          </DialogDescription>
        </DialogHeader>

        {/* Template grid */}
        <div
          className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-2'
          aria-label='Board templates'
        >
          {BOARD_TEMPLATES.map((template) => {
            const Icon = ICON_MAP[template.iconName] ?? LuZap
            const isThisPending = pendingId === template.id
            const isDisabled = isPending

            return (
              <div
                key={template.id}
                role='button'
                tabIndex={isDisabled ? -1 : 0}
                aria-busy={isThisPending}
                aria-label={`${template.name}: ${template.description}`}
                aria-disabled={isDisabled}
                onClick={() => !isDisabled && handleUseTemplate(template.id)}
                onKeyDown={(e) => !isDisabled && handleKeyDown(e, template.id)}
                className={[
                  'group relative flex flex-col gap-3 bg-card border rounded-xl p-4',
                  'cursor-pointer select-none outline-none',
                  'transition-all duration-150',
                  'hover:border-primary/30 hover:shadow-md hover:bg-accent/5',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/30',
                  isThisPending ? 'opacity-75 pointer-events-none' : '',
                  isDisabled && !isThisPending ? 'opacity-50 pointer-events-none' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {/* Icon + "Use Template" label */}
                <div className='flex items-start justify-between'>
                  <div
                    className={`w-9 h-9 rounded-lg ${template.bgClass} flex items-center justify-center shrink-0`}
                  >
                    {isThisPending ? (
                      <LuLoader
                        className={`w-4 h-4 ${template.colorClass} animate-spin`}
                        aria-hidden='true'
                      />
                    ) : (
                      <Icon
                        className={`w-4 h-4 ${template.colorClass}`}
                        aria-hidden='true'
                      />
                    )}
                  </div>

                  {/* Decorative pill — aria-hidden, not a real button to avoid button-in-button */}
                  <span
                    aria-hidden='true'
                    className={[
                      'inline-flex items-center h-7 text-xs px-2.5 rounded-md shrink-0',
                      'bg-primary text-primary-foreground font-medium',
                      'transition-all duration-150',
                      'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
                      '-translate-y-0.5 group-hover:translate-y-0',
                    ].join(' ')}
                  >
                    {isThisPending ? (
                      <LuLoader className='w-3 h-3 animate-spin' />
                    ) : (
                      'Use Template'
                    )}
                  </span>
                </div>

                {/* Name + description */}
                <div className='space-y-0.5'>
                  <p className='font-semibold text-sm leading-tight'>{template.name}</p>
                  <p className='text-xs text-muted-foreground line-clamp-2 leading-relaxed'>
                    {template.description}
                  </p>
                </div>

                {/* Column preview pills */}
                <div className='flex flex-wrap gap-1 mt-auto pt-1'>
                  {template.columns.slice(0, 5).map((col) => (
                    <span
                      key={col.title}
                      className='inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground leading-tight'
                    >
                      {col.title}
                    </span>
                  ))}
                  {template.columns.length > 5 && (
                    <span className='inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground leading-tight'>
                      +{template.columns.length - 5}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Blank board fallback */}
        <div className='flex justify-center pt-1 pb-1'>
          <Button
            variant='outline'
            onClick={() => {
              handleOpenChange(false)
              onBlankBoard()
            }}
            id='template-picker-blank-board'
          >
            Or start with a blank board
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
