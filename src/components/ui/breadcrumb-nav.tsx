'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LuChevronLeft } from 'react-icons/lu'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbNavProps {
  items?: BreadcrumbItem[]
  title?: string
  className?: string
  backHref?: string
  backLabel?: string
  includeRoot?: boolean
  rootItem?: BreadcrumbItem
}

const KNOWN_SEGMENT_LABELS: Record<string, string> = {
  app: 'Homepage',
  cashflow: 'Cashflow',
  list: 'List',
  ideas: 'Ideas',
  wishlist: 'Wishlist',
  todo: 'Todo',
  invoice: 'Invoice',
  invoices: 'Invoices',
  goals: 'Goals',
  settings: 'Settings',
  bio: 'Bio',
}

const DEFAULT_ROOT_ITEM: BreadcrumbItem = {
  label: KNOWN_SEGMENT_LABELS.app ?? 'Homepage',
  href: '/app',
}

function formatSegmentLabel(segment: string): string {
  const normalized = segment.toLowerCase()
  if (KNOWN_SEGMENT_LABELS[normalized]) {
    return KNOWN_SEGMENT_LABELS[normalized]
  }
  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function BreadcrumbNav({
  items,
  title,
  className,
  backHref,
  backLabel,
  includeRoot = true,
  rootItem = DEFAULT_ROOT_ITEM,
}: BreadcrumbNavProps) {
  const pathname = usePathname()

  const resolvedItems = React.useMemo(() => {
    // 1. If explicit items are provided, use them
    if (items && items.length > 0) {
      if (includeRoot && rootItem && items[0]?.href !== rootItem.href) {
        return [rootItem, ...items]
      }
      return items
    }

    // 2. Auto-detect from URL pathname
    if (!pathname) {
      const fallback: BreadcrumbItem[] = []
      if (includeRoot && rootItem) fallback.push(rootItem)
      if (title) fallback.push({ label: title })
      return fallback
    }

    const segments = pathname.split('/').filter(Boolean)
    const trail: BreadcrumbItem[] = []

    if (includeRoot && rootItem) {
      trail.push(rootItem)
    }

    if (segments.length === 0) {
      if (title) trail.push({ label: title })
      return trail
    }

    if (title) {
      // All segments except the last (which is the dynamic ID) become ancestor links
      let currentPath = ''
      for (let i = 0; i < segments.length - 1; i++) {
        currentPath += `/${segments[i]}`
        trail.push({
          label: formatSegmentLabel(segments[i]),
          href: currentPath,
        })
      }
      trail.push({ label: title })
    } else {
      // Standard segment trail
      let currentPath = ''
      for (let i = 0; i < segments.length; i++) {
        currentPath += `/${segments[i]}`
        const isLast = i === segments.length - 1
        trail.push({
          label: formatSegmentLabel(segments[i]),
          href: isLast ? undefined : currentPath,
        })
      }
    }

    return trail
  }, [items, title, pathname, includeRoot, rootItem])

  if (resolvedItems.length === 0) return null

  // Auto-detect the immediate parent link (last item with an href before current)
  const parentItem = [...resolvedItems]
    .slice(0, -1)
    .reverse()
    .find((item) => Boolean(item.href))

  const resolvedBackHref = backHref ?? parentItem?.href
  const resolvedBackLabel =
    backLabel ?? (parentItem ? parentItem.label : 'Back')

  return (
    <div className={className}>
      {/* Mobile Back Link */}
      {resolvedBackHref && (
        <div className='flex sm:hidden items-center'>
          <Link
            href={resolvedBackHref}
            className='inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-0.5'
          >
            <LuChevronLeft className='w-4.5 h-4.5 shrink-0' />
            <span className='truncate max-w-60'>{resolvedBackLabel}</span>
          </Link>
        </div>
      )}

      {/* Desktop Breadcrumbs */}
      <nav
        aria-label='breadcrumb'
        className='hidden sm:flex items-center gap-1 text-sm text-muted-foreground'
      >
        {resolvedItems.map((item, index) => {
          const isLast = index === resolvedItems.length - 1

          return (
            <React.Fragment key={index}>
              {index > 0 && <span className='text-muted-foreground'>/</span>}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    'truncate max-w-60',
                    isLast
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className='hover:text-foreground transition-colors truncate max-w-50'
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          )
        })}
      </nav>
    </div>
  )
}
