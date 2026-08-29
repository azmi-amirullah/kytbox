'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  LuMousePointerClick,
  LuWallet,
  LuListTodo,
  LuArrowUpRight,
} from 'react-icons/lu'
import { formatCurrency } from '@/lib/currency'

interface QuickStatsProps {
  clicksCount: number
  cashflowBalance: number
  openItemsCount: number
  defaultCurrency: string | null
}

export function QuickStats({
  clicksCount,
  cashflowBalance,
  openItemsCount,
  defaultCurrency,
}: QuickStatsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const stats = [
    {
      name: 'Bio clicks',
      value: `${clicksCount.toLocaleString()} clicks`,
      description: 'Clicks in last 7 days',
      href: '/bio',
      icon: LuMousePointerClick,
      color: 'bg-primary/10 text-primary',
      borderHover: 'hover:border-primary/40',
    },
    {
      name: 'Cashflow',
      value: formatCurrency(cashflowBalance, defaultCurrency),
      description: 'Current combined balance',
      href: '/cashflow',
      icon: LuWallet,
      color: 'bg-accent text-accent-foreground',
      borderHover: 'hover:border-accent-foreground/40',
    },
    {
      name: 'Open items',
      value: `${openItemsCount.toLocaleString()} items`,
      description: 'Uncompleted items',
      href: '/list',
      icon: LuListTodo,
      color: 'bg-secondary text-secondary-foreground',
      borderHover: 'hover:border-secondary-foreground/40',
    },
  ]

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const scrollLeft = el.scrollLeft
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 0) return
    const fraction = scrollLeft / maxScroll
    const index = Math.min(
      Math.max(Math.round(fraction * (stats.length - 1)), 0),
      stats.length - 1,
    )
    setActiveIndex(index)
  }

  const scrollToCard = (index: number) => {
    const el = scrollRef.current
    if (!el) return
    const cards = el.querySelectorAll('a')
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      })
    }
  }

  return (
    <div className='w-full'>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className='-mx-4 flex gap-3 overflow-x-auto px-4 py-1 scroll-px-4 scrollbar-hide snap-x snap-mandatory sm:mx-0 sm:grid sm:w-full sm:grid-cols-3 sm:gap-3.5 sm:overflow-visible sm:px-0 sm:py-0 sm:scroll-px-0'
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className={`group relative flex w-[52vw] min-w-42.5 max-w-50 shrink-0 snap-start flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:min-w-0 sm:max-w-none sm:shrink ${stat.borderHover}`}
            >
              <div className='flex items-center justify-between gap-2'>
                <div className='flex min-w-0 items-center gap-2'>
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${stat.color}`}
                  >
                    <Icon className='size-4' aria-hidden='true' />
                  </span>
                  <p className='truncate text-xs font-medium text-muted-foreground'>
                    {stat.name}
                  </p>
                </div>
                <LuArrowUpRight
                  className='size-4 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary'
                  aria-hidden='true'
                />
              </div>
              <div className='mt-4'>
                <p className='truncate text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl'>
                  {stat.value}
                </p>
                <p className='mt-1 truncate text-[0.72rem] text-muted-foreground/80 sm:text-xs'>
                  {stat.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Mobile Slide Pagination Dots */}
      <div
        className='mt-3 flex items-center justify-center gap-1.5 sm:hidden'
        aria-hidden='true'
      >
        {stats.map((_, i) => (
          <button
            key={i}
            type='button'
            onClick={() => scrollToCard(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeIndex === i
                ? 'w-5 bg-primary'
                : 'w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
