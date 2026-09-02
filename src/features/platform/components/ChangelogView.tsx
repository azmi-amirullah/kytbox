'use client'

import * as React from 'react'
import {
  LuSearch,
  LuX,
  LuSparkles,
  LuZap,
  LuShieldCheck,
  LuWrench,
  LuLink,
  LuWallet,
  LuSquareCheck,
  LuLayers,
  LuCalendar,
  LuCheck,
  LuHistory,
  LuTag,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'
import type {
  ChangelogRelease,
  ChangelogCategory,
  ChangelogItemType,
  ChangelogItem,
} from '../types'
import { filterChangelog } from '../data/changelog'
import { cn } from '@/lib/utils'

const CATEGORY_TABS: { id: ChangelogCategory; label: string; icon: IconType }[] = [
  { id: 'all', label: 'All Updates', icon: LuHistory },
  { id: 'bio', label: 'Bio', icon: LuLink },
  { id: 'cashflow', label: 'Cashflow', icon: LuWallet },
  { id: 'list', label: 'List', icon: LuSquareCheck },
  { id: 'platform', label: 'Platform', icon: LuLayers },
]

const CATEGORY_CONFIG: Record<
  Exclude<ChangelogCategory, 'all'>,
  { label: string; icon: IconType; colorClass: string; bgClass: string }
> = {
  bio: {
    label: 'Bio',
    icon: LuLink,
    colorClass: 'text-teal-600 dark:text-teal-400 border-teal-500/30',
    bgClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
  },
  cashflow: {
    label: 'Cashflow',
    icon: LuWallet,
    colorClass: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    bgClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  list: {
    label: 'List',
    icon: LuSquareCheck,
    colorClass: 'text-blue-600 dark:text-blue-400 border-blue-500/30',
    bgClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  platform: {
    label: 'Platform',
    icon: LuLayers,
    colorClass: 'text-violet-600 dark:text-violet-400 border-violet-500/30',
    bgClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
  security: {
    label: 'Security',
    icon: LuShieldCheck,
    colorClass: 'text-amber-600 dark:text-amber-400 border-amber-500/30',
    bgClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
}

const TYPE_CONFIG: Record<
  ChangelogItemType,
  { label: string; icon: IconType; badgeClass: string }
> = {
  feature: {
    label: 'Feature',
    icon: LuSparkles,
    badgeClass:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  },
  improvement: {
    label: 'Improvement',
    icon: LuZap,
    badgeClass:
      'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
  },
  fix: {
    label: 'Fix',
    icon: LuWrench,
    badgeClass:
      'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  security: {
    label: 'Security',
    icon: LuShieldCheck,
    badgeClass:
      'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20',
  },
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateString
  }
}

interface ChangelogViewProps {
  initialReleases: ChangelogRelease[]
}

export function ChangelogView({ initialReleases }: ChangelogViewProps) {
  const [selectedCategory, setSelectedCategory] =
    React.useState<ChangelogCategory>('all')
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredReleases = React.useMemo(() => {
    return filterChangelog(initialReleases, {
      category: selectedCategory,
      query: searchQuery,
    })
  }, [initialReleases, selectedCategory, searchQuery])

  // Count items per category across all releases
  const categoryCounts = React.useMemo(() => {
    const counts: Record<ChangelogCategory, number> = {
      all: 0,
      bio: 0,
      cashflow: 0,
      list: 0,
      platform: 0,
      security: 0,
    }

    initialReleases.forEach((rel) => {
      rel.items.forEach((item) => {
        counts.all += 1
        if (counts[item.category] !== undefined) {
          counts[item.category] += 1
        }
      })
    })

    return counts
  }, [initialReleases])

  const handleClearFilters = () => {
    setSelectedCategory('all')
    setSearchQuery('')
  }

  return (
    <div className='w-full space-y-8'>
      {/* Controls Bar: Segmented Tab Bar & Search */}
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        {/* Unified Segmented Tab Bar */}
        <div
          role='tablist'
          aria-label='Filter updates by category'
          className='flex flex-wrap items-center gap-1 rounded-xl bg-muted/80 p-1 border border-border/80 text-muted-foreground shadow-2xs w-fit max-w-full'
        >
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon
            const isSelected = selectedCategory === tab.id
            const count = categoryCounts[tab.id] ?? 0

            return (
              <button
                key={tab.id}
                role='tab'
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(tab.id)}
                className={cn(
                  'relative inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none',
                  isSelected
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                )}
              >
                <Icon
                  className={cn(
                    'size-3.5 shrink-0 transition-colors',
                    isSelected ? 'text-primary' : 'text-muted-foreground',
                  )}
                  aria-hidden='true'
                />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold transition-colors',
                    isSelected
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted-foreground/15 text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Live Search Input */}
        <div className='relative w-full lg:w-68 shrink-0'>
          <LuSearch
            className='pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
            aria-hidden='true'
          />
          <input
            type='search'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search release notes...'
            aria-label='Search release notes'
            className='h-10 w-full rounded-xl border border-border bg-card/80 py-2 pl-9 pr-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all shadow-2xs [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden'
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label='Clear search'
              className='absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer'
            >
              <LuX className='size-3.5' />
            </button>
          )}
        </div>
      </div>

      {/* Release Timeline List */}
      {filteredReleases.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center backdrop-blur-sm'>
          <div className='mb-4 rounded-full border border-border bg-muted/50 p-3.5 text-muted-foreground'>
            <LuSearch className='size-6' />
          </div>
          <h3 className='text-base font-bold text-foreground'>
            No matching updates found
          </h3>
          <p className='mt-1 max-w-md text-xs sm:text-sm text-muted-foreground'>
            We couldn&apos;t find any releases matching your criteria
            {searchQuery && (
              <span className='font-semibold text-foreground'>
                {' '}
                &ldquo;{searchQuery}&rdquo;
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span> in the {selectedCategory} category</span>
            )}
            .
          </p>
          <button
            onClick={handleClearFilters}
            className='mt-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/80 px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-all cursor-pointer'
          >
            <LuHistory className='size-3.5' />
            Reset all filters
          </button>
        </div>
      ) : (
        <div className='relative border-l border-border/80 pl-6 sm:pl-8 ml-3 sm:ml-4 space-y-12'>
          {filteredReleases.map((release) => (
            <article
              key={release.version}
              id={`v${release.version}`}
              className='relative group scroll-mt-28'
            >
              {/* Timeline Marker Dot */}
              <div
                className={cn(
                  'absolute -left-7.75 sm:-left-9.75 top-1.5 flex size-4 sm:size-5 items-center justify-center rounded-full border-2 bg-background transition-transform duration-200 group-hover:scale-110',
                  release.isLatest
                    ? 'border-primary shadow-xs shadow-primary/40'
                    : 'border-border group-hover:border-primary/60',
                )}
                aria-hidden='true'
              >
                <div
                  className={cn(
                    'size-1.5 sm:size-2 rounded-full',
                    release.isLatest ? 'bg-primary animate-pulse' : 'bg-muted-foreground/60',
                  )}
                />
              </div>

              {/* Release Header */}
              <div className='flex flex-wrap items-center gap-2 sm:gap-3 mb-3'>
                <span className='inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-3 py-1 font-mono text-xs font-bold text-foreground shadow-2xs'>
                  <LuTag className='size-3 text-primary' />
                  v{release.version}
                </span>

                {release.isLatest && (
                  <span className='inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400'>
                    <LuSparkles className='size-3' />
                    Latest Release
                  </span>
                )}

                <span className='flex items-center gap-1 text-xs text-muted-foreground ml-auto'>
                  <LuCalendar className='size-3.5' aria-hidden='true' />
                  <time dateTime={release.date}>{formatDate(release.date)}</time>
                </span>
              </div>

              {/* Release Title & Summary */}
              <h2 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
                {release.title}
              </h2>
              <p className='mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                {release.summary}
              </p>

              {/* Release Highlights (if present) */}
              {release.highlights && release.highlights.length > 0 && (
                <div className='mt-4 rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-xs shadow-2xs'>
                  <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5'>
                    <LuSparkles className='size-3.5 text-primary' />
                    Key Highlights
                  </h4>
                  <ul className='grid gap-2 sm:grid-cols-2 text-xs sm:text-sm text-foreground/90'>
                    {release.highlights.map((highlight, idx) => (
                      <li key={idx} className='flex items-start gap-2'>
                        <LuCheck className='size-4 text-emerald-500 shrink-0 mt-0.5' />
                        <span className='leading-snug'>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Itemized Feature Cards */}
              <div className='mt-5 grid gap-3'>
                {release.items.map((item: ChangelogItem) => {
                  const catConfig = CATEGORY_CONFIG[item.category]
                  const typeConfig = TYPE_CONFIG[item.type]
                  const CatIcon = catConfig.icon
                  const TypeIcon = typeConfig.icon

                  return (
                    <div
                      key={item.id}
                      className='rounded-xl border border-border/70 bg-card/40 p-4 transition-all hover:border-border hover:bg-card/70 hover:shadow-sm'
                    >
                      <div className='flex flex-wrap items-center gap-2 mb-2'>
                        {/* Category Badge */}
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border',
                            catConfig.bgClass,
                            catConfig.colorClass,
                          )}
                        >
                          <CatIcon className='size-3' />
                          {catConfig.label}
                        </span>

                        {/* Type Badge */}
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium',
                            typeConfig.badgeClass,
                          )}
                        >
                          <TypeIcon className='size-3' />
                          {typeConfig.label}
                        </span>

                        {item.badge && (
                          <span className='rounded-md bg-secondary/80 px-1.5 py-0.5 text-[10px] font-bold text-secondary-foreground'>
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <h3 className='text-sm sm:text-base font-semibold text-foreground tracking-tight'>
                        {item.title}
                      </h3>
                      <p className='mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                        {item.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
