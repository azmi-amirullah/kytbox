import type { Metadata } from 'next'
import { LuSparkles } from 'react-icons/lu'
import { getChangelogReleases } from '@/features/platform/data/changelog'
import { ChangelogView } from '@/features/platform/components/ChangelogView'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: 'Changelog & Product Updates',
  description:
    'Discover the latest features, enhancements, and fixes across the Kytbox ecosystem including Bio, Cashflow, List, and Invoices.',
  openGraph: {
    title: 'Changelog & Product Updates | Kytbox',
    description:
      'Discover the latest features, enhancements, and fixes across the Kytbox ecosystem.',
    url: `${siteConfig.url}/changelog`,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og.png`,
        width: 1200,
        height: 630,
        alt: 'Kytbox Product Changelog',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Changelog & Product Updates | Kytbox',
    description:
      'Discover the latest features, enhancements, and fixes across the Kytbox ecosystem.',
    images: [`${siteConfig.url}/og.png`],
  },
}

export default function ChangelogPage() {
  const releases = getChangelogReleases()

  return (
    <div className='space-y-10 sm:space-y-12'>
      {/* Hero Header */}
      <header className='text-center space-y-4 max-w-2xl mx-auto'>
        <div className='inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary'>
          <LuSparkles className='size-3.5' />
          <span>Product Updates & Releases</span>
        </div>

        <h1 className='text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground'>
          What&apos;s New in Kytbox
        </h1>

        <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
          Stay up to date with new features, performance upgrades, security
          enhancements, and continuous improvements across all Kytbox apps.
        </p>
      </header>

      {/* Interactive Changelog Timeline Component */}
      <ChangelogView initialReleases={releases} />
    </div>
  )
}
