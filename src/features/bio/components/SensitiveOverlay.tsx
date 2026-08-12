'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ThemeConfig } from '@/lib/theme/theme.types'

interface SensitiveOverlayProps {
  children: React.ReactNode
  theme: ThemeConfig
  isInteractive?: boolean
  className?: string
}

export default function SensitiveOverlay({
  children,
  theme,
  isInteractive = true,
  className,
}: SensitiveOverlayProps) {
  const [revealed, setRevealed] = useState(false)
  const { colors } = theme

  if (revealed) return <>{children}</>

  return (
    <div
      className={cn(
        'relative w-full isolate overflow-hidden rounded-xl',
        className,
      )}
    >
      {/* Blurred preview */}
      <div
        className='pointer-events-none select-none blur-sm opacity-40'
        aria-hidden
      >
        {children}
      </div>

      {/* Full-card overlay button */}
      <button
        onClick={isInteractive ? () => setRevealed(true) : undefined}
        disabled={!isInteractive}
        className={cn(
          'absolute inset-0 z-10 w-full h-full flex items-center justify-center gap-2 px-4 py-2 text-center transition-all',
          'backdrop-blur-md border rounded-[inherit]',
          isInteractive &&
            'hover:opacity-90 active:scale-[0.99] cursor-pointer',
          !isInteractive && 'cursor-default',
        )}
        style={{
          backgroundColor: colors.elementBg,
          borderColor: colors.elementBorder,
          color: colors.textPrimary,
        }}
        aria-label='Click to reveal sensitive content'
      >
        <span className='text-base sm:text-lg shrink-0'>🔞</span>
        <div className='flex items-center gap-1.5 min-w-0'>
          <span className='text-xs font-bold uppercase tracking-wider truncate'>
            Sensitive Content
          </span>
          <span className='text-[11px] opacity-70 font-medium whitespace-nowrap hidden xs:inline sm:inline'>
            • Click to reveal
          </span>
        </div>
      </button>
    </div>
  )
}

