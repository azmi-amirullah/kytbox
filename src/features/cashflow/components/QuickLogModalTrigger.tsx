'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { LuZap } from 'react-icons/lu'
import { cn } from '@/lib/utils'
import type { CashflowWithSummaryDTO } from '@/types/dto'

const QuickLogModal = dynamic(() => import('./QuickLogModal'), {
  ssr: false,
})

interface QuickLogModalTriggerProps {
  cashflow: CashflowWithSummaryDTO
  allBooks?: CashflowWithSummaryDTO[]
  defaultCurrency: string | null
  className?: string
}

/**
 * QuickLogModalTrigger
 * Lightning icon trigger for pinned cashflow cards on the dashboard.
 * Dynamically loads the QuickLogModal on click to keep the dashboard initial payload minimal.
 */
export function QuickLogModalTrigger({
  cashflow,
  allBooks,
  defaultCurrency,
  className,
}: QuickLogModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type='button'
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(true)
        }}
        className={cn(
          'relative z-20 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-secondary/60 text-secondary-foreground transition-all duration-200 hover:scale-105 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
          className,
        )}
        title={`Quick log entry in ${cashflow.title}`}
        aria-label={`Quick log entry in ${cashflow.title}`}
      >
        <LuZap className='size-4' aria-hidden='true' />
      </button>

      {isOpen && (
        <QuickLogModal
          cashflow={cashflow}
          allBooks={allBooks}
          defaultCurrency={defaultCurrency}
          open={isOpen}
          onOpenChange={setIsOpen}
        />
      )}
    </>
  )
}
