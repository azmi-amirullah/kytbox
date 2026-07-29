'use client'

import Link from 'next/link'
import type { MouseEvent, ReactNode } from 'react'

interface HomeBrandLinkProps {
  children: ReactNode
  className?: string
}

export function HomeBrandLink({ children, className }: HomeBrandLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const isModifiedClick =
      event.metaKey || event.altKey || event.ctrlKey || event.shiftKey

    if (
      !isModifiedClick &&
      window.location.pathname === '/' &&
      window.location.hash === ''
    ) {
      event.preventDefault()
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      })
    }
  }

  return (
    <Link
      href='/'
      aria-label='Home'
      className={className}
      onClick={handleClick}
    >
      {children}
    </Link>
  )
}
