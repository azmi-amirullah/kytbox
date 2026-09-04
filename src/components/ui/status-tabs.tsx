'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface StatusTabItem<T extends string = string> {
  id: T
  label: string
  count?: number
  icon?: React.ComponentType<{ className?: string }>
}

interface StatusTabsProps<T extends string = string> {
  tabs: StatusTabItem<T>[]
  activeTab: T
  onChange: (tabId: T) => void
  className?: string
}

export function StatusTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className,
}: StatusTabsProps<T>) {
  return (
    <div
      role='tablist'
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-muted/60 border border-border/40 rounded-xl backdrop-blur-sm',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            role='tab'
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border',
              isActive
                ? 'bg-card text-foreground shadow-xs border-border/50 cursor-default'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer',
            )}
          >
            {Icon && <Icon className='w-3.5 h-3.5 shrink-0' />}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] tabular-nums font-bold transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-muted-foreground/15 text-muted-foreground',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
