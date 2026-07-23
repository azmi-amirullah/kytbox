'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  LuBell,
  LuMessageSquare,
  LuTriangleAlert,
  LuCircleAlert,
  LuSparkles,
  LuInfo,
  LuCheckCheck,
} from 'react-icons/lu'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { NotificationDTO, NotificationType } from '../types'
import { getNotifications, markAsRead, markAllAsRead } from '../actions'

interface NotificationCenterProps {
  user?: {
    id?: string
    role?: string | null
  } | null
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

function isToday(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'support_reply':
      return <LuMessageSquare className='h-4 w-4 text-blue-500 shrink-0' />
    case 'budget_warning':
      return <LuTriangleAlert className='h-4 w-4 text-amber-500 shrink-0' />
    case 'budget_exceeded':
      return <LuCircleAlert className='h-4 w-4 text-destructive shrink-0' />
    case 'click_milestone':
      return <LuSparkles className='h-4 w-4 text-emerald-500 shrink-0' />
    case 'system':
    default:
      return <LuInfo className='h-4 w-4 text-sky-500 shrink-0' />
  }
}

export function NotificationCenter({ user }: NotificationCenterProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationDTO[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const userId = user?.id

  const loadNotifications = useCallback(async (isMountedRef: { current: boolean }) => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return
    }
    const res = await getNotifications()
    if (isMountedRef.current && !res.error) {
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    const isMountedRef = { current: true }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications(isMountedRef)

    const interval = setInterval(() => loadNotifications(isMountedRef), 60000)

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadNotifications(isMountedRef)
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    return () => {
      isMountedRef.current = false
      clearInterval(interval)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [userId, loadNotifications])

  const handleNotificationClick = async (item: NotificationDTO) => {
    if (!item.read_at) {
      const prevNotifications = [...notifications]
      const prevUnreadCount = unreadCount

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))

      const res = await markAsRead(item.id)
      if (res && !res.success) {
        setNotifications(prevNotifications)
        setUnreadCount(prevUnreadCount)
      }
    }

    setOpen(false)

    if (
      item.link_url &&
      item.link_url.startsWith('/') &&
      !item.link_url.startsWith('//')
    ) {
      router.push(item.link_url)
    }
  }

  const handleMarkAllRead = async () => {
    setLoading(true)
    const prevNotifications = [...notifications]
    const prevUnreadCount = unreadCount

    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: n.read_at || new Date().toISOString(),
      })),
    )
    setUnreadCount(0)

    const res = await markAllAsRead()
    if (res && !res.success) {
      setNotifications(prevNotifications)
      setUnreadCount(prevUnreadCount)
    }
    setLoading(false)
  }

  if (!user) {
    return (
      <div className='flex items-center justify-center relative h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-secondary/40 border border-border/80 text-foreground shrink-0 opacity-50'>
        <LuBell className='h-4 w-4' />
      </div>
    )
  }

  const todayNotifications = notifications.filter((n) => isToday(n.created_at))
  const earlierNotifications = notifications.filter(
    (n) => !isToday(n.created_at),
  )
  const hasUnread = unreadCount > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center justify-center relative h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-secondary/40 border border-border/80 text-foreground hover:bg-secondary/80 transition-all shrink-0 group cursor-pointer',
            hasUnread &&
              'border-destructive/40 bg-destructive/5 text-destructive shadow-sm shadow-destructive/15',
          )}
          aria-label={
            hasUnread ? `${unreadCount} unread notifications` : 'Notifications'
          }
          title={
            hasUnread
              ? `${unreadCount} unread notifications`
              : 'No new notifications'
          }
        >
          <LuBell
            className={cn(
              'h-4 w-4 transition-transform duration-200 group-hover:rotate-12',
              hasUnread && 'text-destructive',
            )}
          />
          {hasUnread && (
            <span className='absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center'>
              <span
                className='absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75'
                aria-hidden='true'
              />
              <span
                className='relative inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground shadow-sm animate-in fade-in-0 zoom-in-50'
                aria-hidden='true'
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align='end'
        className='w-80 sm:w-96 p-0 border border-border bg-background shadow-xl rounded-xl overflow-hidden'
      >
        {/* Header */}
        <div className='flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30'>
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-sm'>Notifications</span>
            {hasUnread && (
              <span className='text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full'>
                {unreadCount} new
              </span>
            )}
          </div>
          {hasUnread && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleMarkAllRead}
              disabled={loading}
              className='h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2'
            >
              <LuCheckCheck className='h-3.5 w-3.5' />
              Mark all read
            </Button>
          )}
        </div>

        {/* List Content */}
        <div className='max-h-80 overflow-y-auto divide-y divide-border/40'>
          {notifications.length === 0 ? (
            <div className='p-8 text-center text-muted-foreground flex flex-col items-center gap-2'>
              <LuBell className='h-8 w-8 stroke-1 opacity-40' />
              <p className='text-sm font-medium'>All caught up! 🎉</p>
              <p className='text-xs text-muted-foreground/80'>
                No notifications right now.
              </p>
            </div>
          ) : (
            <>
              {todayNotifications.length > 0 && (
                <div>
                  <div className='px-4 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase bg-muted/20'>
                    Today
                  </div>
                  {todayNotifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={cn(
                        'w-full text-left p-3 flex items-start gap-3 hover:bg-accent/50 transition-colors relative',
                        !item.read_at && 'bg-accent/20 font-medium',
                      )}
                    >
                      <NotificationIcon type={item.type} />
                      <div className='flex-1 min-w-0 pr-4'>
                        <div className='flex items-center justify-between gap-2'>
                          <p className='text-xs font-semibold truncate text-foreground'>
                            {item.title}
                          </p>
                          <span className='text-[10px] text-muted-foreground shrink-0'>
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </div>
                        {item.body && (
                          <p className='text-xs text-muted-foreground line-clamp-2 mt-0.5 font-normal'>
                            {item.body}
                          </p>
                        )}
                      </div>
                      {!item.read_at && (
                        <span className='absolute right-3 top-4 h-2 w-2 rounded-full bg-primary' />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {earlierNotifications.length > 0 && (
                <div>
                  <div className='px-4 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase bg-muted/20'>
                    Earlier
                  </div>
                  {earlierNotifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={cn(
                        'w-full text-left p-3 flex items-start gap-3 hover:bg-accent/50 transition-colors relative',
                        !item.read_at && 'bg-accent/20 font-medium',
                      )}
                    >
                      <NotificationIcon type={item.type} />
                      <div className='flex-1 min-w-0 pr-4'>
                        <div className='flex items-center justify-between gap-2'>
                          <p className='text-xs font-semibold truncate text-foreground'>
                            {item.title}
                          </p>
                          <span className='text-[10px] text-muted-foreground shrink-0'>
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </div>
                        {item.body && (
                          <p className='text-xs text-muted-foreground line-clamp-2 mt-0.5 font-normal'>
                            {item.body}
                          </p>
                        )}
                      </div>
                      {!item.read_at && (
                        <span className='absolute right-3 top-4 h-2 w-2 rounded-full bg-primary' />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
