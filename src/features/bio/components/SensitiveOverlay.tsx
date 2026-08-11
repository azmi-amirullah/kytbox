'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ThemeConfig } from '@/lib/theme/theme.types'

interface SensitiveOverlayProps {
  children: React.ReactNode
  theme: ThemeConfig
  isInteractive?: boolean
}

export default function SensitiveOverlay({
  children,
  theme,
  isInteractive = true,
}: SensitiveOverlayProps) {
  const [revealed, setRevealed] = useState(false)
  const { colors } = theme

  if (revealed) return <>{children}</>

  return (
    <div className='relative w-full isolate'>
      {/* Blurred preview */}
      <div className='pointer-events-none select-none blur-sm opacity-60' aria-hidden>
        {children}
      </div>

      {/* Overlay */}
      <div className='absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-md z-10'>
        <button
          onClick={isInteractive ? () => setRevealed(true) : undefined}
          disabled={!isInteractive}
          className={cn(
            'flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl text-center transition-all',
            'shadow-lg border backdrop-blur-sm',
            isInteractive && 'hover:scale-105 active:scale-95 cursor-pointer',
            !isInteractive && 'cursor-default',
          )}
          style={{
            backgroundColor: colors.elementBg,
            borderColor: colors.elementBorder,
            color: colors.textPrimary,
          }}
          aria-label='Click to reveal sensitive content'
        >
          <span className='text-2xl'>🔞</span>
          <span className='text-xs font-bold uppercase tracking-wider'>
            Sensitive Content
          </span>
          <span className='text-[11px] opacity-60 font-medium'>
            Click to reveal
          </span>
        </button>
      </div>
    </div>
  )
}
