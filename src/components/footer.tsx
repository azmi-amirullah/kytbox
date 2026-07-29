import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { CurrentYear } from '@/components/ui/current-year'

interface FooterProps {
  variant?: 'landing' | 'dashboard'
}

export function Footer({ variant = 'dashboard' }: FooterProps) {
  const isLanding = variant === 'landing'

  if (isLanding) {
    return (
      <footer className='border-t border-border bg-card/40 px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start'>
            <div>
              <BrandLogo className='w-fit' />
              <p className='mt-4 max-w-xs text-sm leading-6 text-muted-foreground'>
                Bio, Cashflow, and List — together in one workspace.
              </p>
            </div>
            <nav className='flex flex-wrap gap-x-2 gap-y-1 sm:justify-end' aria-label='Footer navigation'>
              <Link href='#platform' className='flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                Platform
              </Link>
              <Link href='#workflow' className='flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                Workflow
              </Link>
              <Link href='/terms' className='flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                Terms
              </Link>
              <Link href='/privacy' className='flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                Privacy
              </Link>
            </nav>
          </div>
          <div className='mt-10 flex flex-col gap-2 border-t border-border/80 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
            <p>© <CurrentYear /> Kytbox. All rights reserved.</p>
            <a
              href='https://azmi-dev.vercel.app'
              target='_blank'
              rel='noopener noreferrer'
              className='w-fit underline decoration-border underline-offset-4 transition-colors hover:text-foreground'
            >
              Built by Azmi
            </a>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className='relative z-10 border-t border-border bg-background/50 py-6 text-center text-xs text-muted-foreground backdrop-blur-sm'>
      <p>
        © <CurrentYear /> Kytbox. Built by{' '}
        <a
          href='https://azmi-dev.vercel.app'
          target='_blank'
          rel='noopener noreferrer'
          className='underline underline-offset-2 transition-colors hover:text-primary'
        >
          Azmi
        </a>
        .
      </p>
      <div className='mt-2 flex justify-center gap-2 text-xs text-muted-foreground/60'>
        <Link href='/terms' className='flex min-h-9 items-center rounded px-2 transition-colors hover:text-foreground'>
          Terms
        </Link>
        <Link href='/privacy' className='flex min-h-9 items-center rounded px-2 transition-colors hover:text-foreground'>
          Privacy
        </Link>
      </div>
    </footer>
  )
}
