'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface RelativeTimeProps {
  dateString: string
  className?: string
}

function compute(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  return formatDistanceToNow(date > now ? now : date, { addSuffix: true })
}

/**
 * Renders a relative timestamp (e.g. "3 minutes ago") without hydration errors
 * and without layout shift.
 *
 * Pattern: render the value on both SSR and client so the space is always
 * reserved (no layout shift), then use suppressHydrationWarning to silence the
 * inevitable sub-second clock drift between server render and client hydration.
 * After mount, useEffect corrects to the accurate client-side value.
 *
 * Source: Next.js docs — preventing-flash-before-hydration (LocalDate pattern).
 */
export function RelativeTime({ dateString, className }: RelativeTimeProps) {
  const [label, setLabel] = useState(() => compute(dateString))

  useEffect(() => {
    setLabel(compute(dateString))
  }, [dateString])

  return (
    <time
      dateTime={dateString}
      className={className}
      suppressHydrationWarning
    >
      {label}
    </time>
  )
}
