'use client'

import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  duration?: number
}

const EASE_CUBIC = [0.16, 1, 0.3, 1] as const

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
  distance = 20,
  duration = 0.5,
}: ScrollRevealProps) {
  const reducedMotion = useReducedMotion()
  const offsets = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, ...offsets[direction] }}
      whileInView={reducedMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : {
              duration,
              delay,
              ease: EASE_CUBIC,
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  )
}
