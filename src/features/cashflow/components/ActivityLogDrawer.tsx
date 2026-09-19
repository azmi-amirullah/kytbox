'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LuHistory,
  LuRefreshCw,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuUser,
  LuClock,
} from 'react-icons/lu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { formatAppDate } from '@/lib/date-only'
import { cn } from '@/lib/utils'
import type { CashflowAuditLogDTO } from '@/types/dto'
import { getCashflowAuditLogs } from '../audit'

interface ActivityLogDrawerProps {
  cashflowId: string
  isOpen: boolean
  onClose: () => void
}

function getActionBadge(action: string) {
  switch (action) {
    case 'create_entry':
    case 'create_budget':
      return {
        label: 'Added',
        icon: LuPlus,
        className:
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      }
    case 'update_entry':
    case 'update_budget':
      return {
        label: 'Updated',
        icon: LuPencil,
        className:
          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      }
    case 'delete_entry':
    case 'delete_budget':
    case 'bulk_delete':
      return {
        label: 'Deleted',
        icon: LuTrash2,
        className:
          'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      }
    default:
      return {
        label: 'Activity',
        icon: LuClock,
        className: 'bg-muted text-muted-foreground border-border',
      }
  }
}

function getInitials(nameOrEmail: string | null): string {
  if (!nameOrEmail) return '?'
  const clean = nameOrEmail.trim()
  if (clean.includes('@')) {
    return clean.slice(0, 2).toUpperCase()
  }
  const parts = clean.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return clean.slice(0, 2).toUpperCase()
}

export function ActivityLogDrawer({
  cashflowId,
  isOpen,
  onClose,
}: ActivityLogDrawerProps) {
  const [logs, setLogs] = useState<CashflowAuditLogDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getCashflowAuditLogs(cashflowId)
      if (res.error) {
        setError(res.error)
      } else {
        setLogs(res.data ?? [])
      }
    } catch {
      setError('Failed to load activity logs')
    } finally {
      setIsLoading(false)
    }
  }, [cashflowId])

  useEffect(() => {
    if (isOpen) {
      void fetchLogs()
    }
  }, [isOpen, fetchLogs])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden'>
        <DialogHeader className='p-4 sm:p-6 pb-3 border-b border-border/60 flex flex-row items-center justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <div className='p-2 rounded-lg bg-primary/10 text-primary'>
                <LuHistory className='w-4 h-4' />
              </div>
              <DialogTitle className='text-lg font-bold'>
                Activity & Audit Trail
              </DialogTitle>
            </div>
            <DialogDescription className='text-xs text-muted-foreground mt-1'>
              Recent mutations and collaborative edits in this book.
            </DialogDescription>
          </div>

          <Button
            variant='ghost'
            size='icon'
            onClick={() => void fetchLogs()}
            disabled={isLoading}
            className='h-8 w-8 text-muted-foreground hover:text-foreground shrink-0'
            title='Refresh activity'
          >
            <LuRefreshCw
              className={cn('w-4 h-4', isLoading && 'animate-spin')}
            />
          </Button>
        </DialogHeader>

        {/* Content Body */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-6 space-y-3'>
          {isLoading && logs.length === 0 ? (
            <div className='py-12 flex items-center justify-center'>
              <Loader text='Loading activity history...' />
            </div>
          ) : error ? (
            <div className='py-8 text-center text-xs text-rose-500 bg-rose-500/10 rounded-xl p-4 border border-rose-500/20'>
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className='py-12 text-center text-muted-foreground space-y-2'>
              <div className='inline-flex p-3 rounded-full bg-muted/60 text-muted-foreground'>
                <LuClock className='w-6 h-6' />
              </div>
              <p className='text-sm font-medium'>No activity recorded yet</p>
              <p className='text-xs text-muted-foreground/80 max-w-xs mx-auto'>
                New transactions, edits, and deletions will be automatically
                logged here.
              </p>
            </div>
          ) : (
            <div className='relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-border/60'>
              {logs.map((log) => {
                const badge = getActionBadge(log.action)
                const BadgeIcon = badge.icon
                const actorLabel =
                  log.actor_name || log.actor_email || 'Collaborator'
                const initials = getInitials(actorLabel)

                return (
                  <div key={log.id} className='relative group'>
                    {/* Timeline dot */}
                    <div className='absolute -left-6 top-1 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-2xs'>
                      {initials}
                    </div>

                    <div className='bg-muted/30 border border-border/50 rounded-xl p-3 text-xs space-y-1.5 transition-colors group-hover:border-border'>
                      <div className='flex items-center justify-between gap-2 flex-wrap'>
                        <span className='font-semibold text-foreground flex items-center gap-1.5 truncate'>
                          <LuUser className='w-3 h-3 text-muted-foreground shrink-0' />
                          <span className='truncate'>{actorLabel}</span>
                        </span>

                        <div className='flex items-center gap-1.5 shrink-0'>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border',
                              badge.className,
                            )}
                          >
                            <BadgeIcon className='w-2.5 h-2.5' />
                            <span>{badge.label}</span>
                          </span>

                          <span className='text-[10px] text-muted-foreground'>
                            {formatAppDate(log.created_at)}
                          </span>
                        </div>
                      </div>

                      <p className='text-foreground/90 font-medium text-[13px] leading-relaxed wrap-break-word'>
                        {log.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
