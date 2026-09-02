'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LuSparkles,
  LuArrowRight,
  LuCheck,
  LuTag,
  LuLink,
  LuWallet,
  LuSquareCheck,
  LuLayers,
  LuShieldCheck,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getLatestRelease } from '../data/changelog'
import type { ChangelogCategory } from '../types'

const STORAGE_KEY = 'kytbox_whats_new_last_seen'

const CATEGORY_ICONS: Record<Exclude<ChangelogCategory, 'all'>, IconType> = {
  bio: LuLink,
  cashflow: LuWallet,
  list: LuSquareCheck,
  platform: LuLayers,
  security: LuShieldCheck,
}

interface WhatsNewModalProps {
  hasCompletedOnboarding?: boolean
}

export function WhatsNewModal({
  hasCompletedOnboarding = true,
}: WhatsNewModalProps) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const latestRelease = React.useMemo(() => getLatestRelease(), [])

  // Check localStorage and show if new release version is available
  React.useEffect(() => {
    // Only auto-trigger on platform home /app for users who finished onboarding
    if (pathname === '/app' && hasCompletedOnboarding) {
      try {
        const lastSeenVersion = localStorage.getItem(STORAGE_KEY)
        if (lastSeenVersion !== latestRelease.version) {
          // Small delay to let dashboard UI render smoothly
          const timer = setTimeout(() => {
            setOpen(true)
          }, 1000)
          return () => clearTimeout(timer)
        }
      } catch {
        // Fallback if localStorage is inaccessible
      }
    }
  }, [pathname, hasCompletedOnboarding, latestRelease.version])

  // Support manual trigger from window event
  React.useEffect(() => {
    const handleManualOpen = () => {
      setOpen(true)
    }
    window.addEventListener('open-whats-new', handleManualOpen)
    return () => window.removeEventListener('open-whats-new', handleManualOpen)
  }, [])

  const handleAcknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, latestRelease.version)
    } catch {
      // Ignore localStorage errors
    }
    setOpen(false)
  }

  const handleOpenChangelog = () => {
    handleAcknowledge()
    router.push('/changelog')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleAcknowledge()
        } else {
          setOpen(true)
        }
      }}
    >
      <DialogContent
        showCloseButton
        className='max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-border bg-card'
      >
        {/* Header with decorative badge */}
        <div className='relative bg-linear-to-b from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b border-border/60'>
          <div className='flex items-center gap-2 mb-2'>
            <span className='inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary'>
              <LuSparkles className='size-3.5' />
              What&apos;s New in Kytbox
            </span>
            <span className='inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground'>
              <LuTag className='size-2.5 text-primary' />
              v{latestRelease.version}
            </span>
          </div>

          <DialogHeader className='text-left space-y-1'>
            <DialogTitle className='text-xl sm:text-2xl font-bold tracking-tight text-card-foreground'>
              {latestRelease.title}
            </DialogTitle>
            <DialogDescription className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
              {latestRelease.summary}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Feature Highlights Body */}
        <div className='max-h-[50vh] overflow-y-auto p-6 space-y-3'>
          <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
            <LuSparkles className='size-3.5 text-primary' />
            Highlights in this Release
          </h4>

          <div className='space-y-2.5'>
            {latestRelease.items.slice(0, 4).map((item) => {
              const Icon = CATEGORY_ICONS[item.category] || LuCheck

              return (
                <div
                  key={item.id}
                  className='flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-left transition-colors hover:bg-muted/50'
                >
                  <div className='flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary mt-0.5'>
                    <Icon className='size-3.5' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-1.5'>
                      <span className='text-xs sm:text-sm font-semibold text-card-foreground'>
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className='rounded px-1.5 py-0.2 text-[9px] font-bold bg-primary/15 text-primary'>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className='mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed'>
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <DialogFooter className='border-t border-border/60 bg-muted/20 p-4 sm:p-5 flex-col-reverse sm:flex-row gap-2 sm:justify-between sm:items-center'>
          <Link
            href='/changelog'
            onClick={handleOpenChangelog}
            className='inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-2'
          >
            <span>View Full Changelog</span>
            <LuArrowRight className='size-3.5' />
          </Link>

          <Button
            type='button'
            onClick={handleAcknowledge}
            className='rounded-xl px-5 font-bold shadow-sm shadow-primary/20 cursor-pointer'
          >
            Got It
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
