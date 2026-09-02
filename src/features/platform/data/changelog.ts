import type {
  ChangelogRelease,
  ChangelogFilterOptions,
} from '../types'

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: '2.0.0',
    title: 'Platform Power, Bulk Actions & Global Search',
    date: '2026-08-30',
    summary:
      'Major milestone release introducing high-productivity workspace tools including Bulk Actions, Global Search (Cmd+K), GDPR Data Export, Financial PDF Reports, Book Pinning/Archiving, and Calendar View.',
    isLatest: true,
    highlights: [
      'Cashflow Bulk Actions: Multi-select transactions to batch delete, reassign categories, or apply tags.',
      'Workspace Global Search (Cmd+K): Instant search across Bio, Cashflow, List, Support, and Invoices.',
      'Public Changelog & What\'s New System: Track product evolution with transparent release history.',
      'One-Click GDPR Data Export: Download an encrypted ZIP archive containing all your workspace data.',
      'Cashflow Financial PDF Statement Generator: One-click exportable monthly financial reports.',
      'List Interactive Calendar: Visualize task horizons on responsive Month/Week calendar grids.',
    ],
    items: [
      {
        id: 'feat-bulk-actions',
        title: 'Cashflow Bulk Actions Engine',
        description:
          'Multi-select transactions across your cashflow ledger to batch delete entries, mass-reassign categories, or apply tags simultaneously in seconds.',
        category: 'cashflow',
        type: 'feature',
        badge: 'New',
      },
      {
        id: 'feat-public-changelog',
        title: 'Public Changelog & What\'s New Modal',
        description:
          'Dedicated public /changelog route with category filters, keyword search, and an in-app highlight modal to keep users informed of latest releases.',
        category: 'platform',
        type: 'feature',
        badge: 'New',
      },
      {
        id: 'feat-global-search',
        title: 'Workspace Global Search (Cmd+K / Ctrl+K)',
        description:
          'High-speed command palette providing instant fuzzy search across Bio profile links, Cashflow transactions, List boards, and Support tickets with sub-50ms latency.',
        category: 'platform',
        type: 'feature',
        badge: 'Search',
      },
      {
        id: 'feat-gdpr-export',
        title: 'One-Click GDPR Data Export',
        description:
          'Complete data portability: export all your Bio links, financial books, todo boards, and user preferences into a single formatted ZIP package.',
        category: 'platform',
        type: 'security',
        badge: 'Privacy',
      },
      {
        id: 'feat-book-lifecycle',
        title: 'Cashflow Book Pinning, Archiving & Sort Controls',
        description:
          'Pin your primary everyday budgets to the top, archive past event books to declutter your workspace, and sort books by activity, balance, or alphabetical order.',
        category: 'cashflow',
        type: 'feature',
        badge: 'Organization',
      },
      {
        id: 'feat-financial-pdf',
        title: 'Financial PDF Statement & Monthly Report Generator',
        description:
          'Export formatted financial PDF statements featuring monthly KPI summaries, category variance charts, and itemized transaction ledgers.',
        category: 'cashflow',
        type: 'feature',
        badge: 'Export',
      },
      {
        id: 'feat-calendar-view',
        title: 'List Interactive Calendar View',
        description:
          'Map todo cards with due dates directly onto a responsive Month/Week grid with quick status toggles and deadline management.',
        category: 'list',
        type: 'feature',
        badge: 'Calendar',
      },
    ],
  },
  {
    version: '1.9.0',
    title: 'List App Power Features & Task Workflows',
    date: '2026-08-27',
    summary:
      'Comprehensive productivity upgrade for the List app introducing recurring tasks, subtasks & checklists, priority levels, board templates, and due dates.',
    isLatest: false,
    highlights: [
      'Subtasks & Checklist Engine with live progress calculation on cards.',
      'Recurring Tasks Engine supporting Daily, Weekly, and Monthly cycles.',
      'Card Priority Levels (Urgent, High, Medium, Low) with custom badge styling.',
      'Pre-built Board Templates for quick 1-click starter kanban boards.',
      'Due Dates & Reminders with relative time indicators and urgency states.',
    ],
    items: [
      {
        id: 'feat-card-subtasks',
        title: 'Card Subtasks & Checklist Engine',
        description:
          'Break complex cards into actionable subtask items with drag-and-drop reordering, interactive check states, and real-time completion progress indicators.',
        category: 'list',
        type: 'feature',
      },
      {
        id: 'feat-recurring-tasks',
        title: 'Recurring Tasks Engine',
        description:
          'Automate routine tasks with flexible recurrence schedules. Completing a recurring task automatically schedules the next cycle.',
        category: 'list',
        type: 'feature',
      },
      {
        id: 'feat-priority-levels',
        title: 'Card Priority Levels & Column Filtering',
        description:
          'Assign Urgent, High, Medium, or Low priority badges to highlight critical items and filter cards across board columns.',
        category: 'list',
        type: 'improvement',
      },
      {
        id: 'feat-board-templates',
        title: 'Pre-built Board Templates',
        description:
          'Kickstart new boards in seconds with pre-configured templates for Sprint Boards, Content Calendars, Weekly Planners, and Bug Trackers.',
        category: 'list',
        type: 'feature',
      },
      {
        id: 'feat-due-dates',
        title: 'Card Due Dates & Urgency Badges',
        description:
          'Set deadlines on cards with color-coded relative status indicators (Overdue, Due Today, Upcoming) to prevent missed tasks.',
        category: 'list',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.8.0',
    title: 'Cashflow Power Engine & Receipt Attachments',
    date: '2026-08-18',
    summary:
      'Powerful financial tracking upgrades including split transactions, bank CSV statements import, monthly comparisons, custom tags, and receipt photo uploads.',
    isLatest: false,
    highlights: [
      'Split Transactions Engine for multi-category transaction breakdowns.',
      'Bank CSV Import with interactive column mapping & auto-categorization.',
      'Monthly Comparison View with delta percentages & category diff charts.',
      'Custom Tags Engine with 12 distinct high-contrast color tokens.',
      'Receipt & Photo Attachment Upload with WebP client optimization pipeline.',
    ],
    items: [
      {
        id: 'feat-split-transactions',
        title: 'Split Transactions Engine',
        description:
          'Allocate a single expenditure across multiple budget categories with line-item accuracy and real-time balance validation.',
        category: 'cashflow',
        type: 'feature',
      },
      {
        id: 'feat-csv-import',
        title: 'Bank CSV Statement Import & Auto-Parser',
        description:
          'Import CSV bank exports effortlessly with intelligent column mapping and rule-based category suggestions.',
        category: 'cashflow',
        type: 'feature',
      },
      {
        id: 'feat-monthly-comparison',
        title: 'Monthly Financial Comparison View',
        description:
          'Compare any two months side-by-side to track savings trends, spending anomalies, and category variances over time.',
        category: 'cashflow',
        type: 'improvement',
      },
      {
        id: 'feat-custom-tags',
        title: 'Custom Tags & Multi-Tag Filtering',
        description:
          'Add multi-tag labels across cashflow entries with automatic color allocation and comprehensive tag management.',
        category: 'cashflow',
        type: 'feature',
      },
      {
        id: 'feat-receipt-upload',
        title: 'Receipt & Invoice Attachment Upload',
        description:
          'Attach high-resolution receipt photos directly to transactions with automatic client-side WebP compression and lightbox zoom viewer.',
        category: 'cashflow',
        type: 'feature',
      },
    ],
  },
  {
    version: '1.7.0',
    title: 'Bio Creator Suite & Custom Domains',
    date: '2026-08-12',
    summary:
      'Creator-centric bio profile enhancements featuring custom domain routing, SEO metadata editor, lead capture email forms, custom thumbnails, and pinned links.',
    isLatest: false,
    highlights: [
      'Custom Domain Mapping Engine for hosting profiles on personal domains.',
      'SEO Metadata Editor with dynamic OpenGraph previews.',
      'Lead Capture Form Widget for email subscriber list building.',
      'Custom Link Thumbnails & Automatic Favicon Resolver.',
      'Pinned Links & Sensitive Content Warnings (18+ gate).',
    ],
    items: [
      {
        id: 'feat-custom-domains',
        title: 'Custom Domain Mapping Engine',
        description:
          'Connect your custom domain (e.g. links.yourdomain.com) to your Kytbox Bio profile with automatic DNS verification and proxy rewrites.',
        category: 'bio',
        type: 'feature',
      },
      {
        id: 'feat-bio-seo',
        title: 'SEO Metadata Editor',
        description:
          'Customize page titles, meta descriptions, and social preview cards (OpenGraph) per bio profile for optimized search and social sharing.',
        category: 'bio',
        type: 'feature',
      },
      {
        id: 'feat-lead-capture',
        title: 'Lead Capture Form Widget',
        description:
          'Embed opt-in email newsletter subscription forms directly on bio pages with rate limiting and CSV export.',
        category: 'bio',
        type: 'feature',
      },
      {
        id: 'feat-link-thumbnails',
        title: 'Custom Link Thumbnails & Favicons',
        description:
          'Auto-fetch site favicons or upload branded custom icons to give your link list a clean, professional aesthetic.',
        category: 'bio',
        type: 'improvement',
      },
      {
        id: 'feat-pinned-sensitive',
        title: 'Pinned Links & Content Warnings',
        description:
          'Anchor high-priority announcements to the top of your bio and protect mature links with blur overlays and consent gates.',
        category: 'bio',
        type: 'feature',
      },
    ],
  },
  {
    version: '1.6.0',
    title: 'Media Embeds, Book Duplication & Invoicing Engine',
    date: '2026-08-07',
    summary:
      'Integrated rich multimedia embedding for creators, one-click Cashflow book duplication, link click sparklines, and a complete Client Invoicing module with PDF exports.',
    isLatest: false,
    highlights: [
      'YouTube & Spotify Inline Media Embeds: Playable tracks and videos right on bio profiles.',
      'Cashflow Book Duplication: 1-click cloning of budgets, goals, and categories.',
      'Link Quick-Stats & Sparklines: Real-time trend visualizers on link cards.',
      'Client Invoicing & PDF Export: Professional invoice generator with printable PDF downloads.',
    ],
    items: [
      {
        id: 'feat-media-embeds',
        title: 'YouTube & Spotify Inline Media Embeds',
        description:
          'Embed playable music tracks, podcasts, and video players directly onto bio pages with CSP-hardened iframe sandboxing.',
        category: 'bio',
        type: 'feature',
      },
      {
        id: 'feat-book-duplication',
        title: 'Cashflow Book Duplication',
        description:
          'Clone existing budgets, goals, and category structures into new monthly books with a single click.',
        category: 'cashflow',
        type: 'feature',
      },
      {
        id: 'feat-link-sparklines',
        title: 'Link Quick-Stats & Click Trend Sparklines',
        description:
          'View 7-day sparkline click velocity trends directly inside the bio link management dashboard.',
        category: 'bio',
        type: 'improvement',
      },
      {
        id: 'feat-invoice-engine',
        title: 'Client Invoicing & PDF Generation Engine',
        description:
          'Create professional client invoices with itemized line items, tax calculations, and printable client-side PDF downloads.',
        category: 'platform',
        type: 'feature',
      },
    ],
  },
  {
    version: '1.5.0',
    title: 'Financial Savings Goals & Share Cards',
    date: '2026-07-30',
    summary:
      'Introduced Cashflow financial savings goals with target tracking, milestone badges, and an HTML5 Canvas social share card generator.',
    isLatest: false,
    highlights: [
      'Savings Goals Tracker: Set target funds and monitor progress with milestone badges.',
      'Canvas Social Share Cards: Client-side drawing pipeline for branded promo banners.',
      'Activity Feed Real-Time Logging: Structured workspace audit event stream.',
    ],
    items: [
      {
        id: 'feat-savings-goals',
        title: 'Financial Savings Goals & Targets',
        description:
          'Create targeted savings funds (Emergency Fund, Vacation, Equipment) with deadline tracking, auto-calculated remaining amounts, and milestone badges.',
        category: 'cashflow',
        type: 'feature',
      },
      {
        id: 'feat-share-cards',
        title: 'Canvas Social Share Card Generator',
        description:
          'Design and download custom promotional banner images directly in the browser via an integrated HTML5 Canvas drawing pipeline.',
        category: 'bio',
        type: 'feature',
      },
      {
        id: 'feat-security-hardening',
        title: 'List Security Hardening & Origin Validation',
        description:
          'Hardened list actions and origin verification across server actions to prevent cross-site request forgery.',
        category: 'platform',
        type: 'security',
      },
    ],
  },
  {
    version: '1.4.0',
    title: 'Notification Center & Dynamic QR Codes',
    date: '2026-07-23',
    summary:
      'Shipped a unified Notification Center for real-time alerts, dynamic QR code generation with SVG/PNG exports, and landing page visual upgrades.',
    isLatest: false,
    highlights: [
      'Notification Center: Real-time header bell with budget threshold notifications.',
      'Dynamic QR Code Generator: Customizable color palette and high-res vector exports.',
      'Landing Page Redesign: Modern bento layout and dynamic feature previews.',
    ],
    items: [
      {
        id: 'feat-notification-center',
        title: 'Unified Notification Center',
        description:
          'Interactive notification center in the platform header delivering real-time system alerts, budget thresholds, and feature notices.',
        category: 'platform',
        type: 'feature',
      },
      {
        id: 'feat-qr-generator',
        title: 'Dynamic QR Code Generator',
        description:
          'Generate instant downloadable QR codes for public bio profiles with custom color palettes and vector SVG/PNG exports.',
        category: 'bio',
        type: 'feature',
      },
      {
        id: 'feat-landing-redesign',
        title: 'Landing Page Bento Redesign & Filters',
        description:
          'Modernized public landing page with interactive bento cards, responsive preview tabs, and cashflow entry filters.',
        category: 'platform',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.3.0',
    title: 'Onboarding Tour, Geo Analytics & Recurring Automation',
    date: '2026-07-18',
    summary:
      'Delivered guided platform onboarding for new signups, country visitor geolocation analytics, and auto-recurring cashflow transaction generation.',
    isLatest: false,
    highlights: [
      'Interactive Onboarding Tour: Spotlight walkthrough for first-time users.',
      'Country Geolocation Analytics: Map visitor click distribution by country and device.',
      'Auto-Recurring Transactions: Hybrid schedule engine for automated income/expense entries.',
    ],
    items: [
      {
        id: 'feat-onboarding-tour',
        title: 'Interactive Platform Onboarding Tour',
        description:
          'Guided spotlight walkthrough introducing new users to the core capabilities of Bio, Cashflow, and List hubs.',
        category: 'platform',
        type: 'feature',
      },
      {
        id: 'feat-geo-analytics',
        title: 'Country & Device Visitor Analytics',
        description:
          'Track visitor traffic sources with privacy-friendly edge IP geolocation mapping and device breakdown charts.',
        category: 'bio',
        type: 'feature',
      },
      {
        id: 'feat-recurring-entries',
        title: 'Auto-Recurring Transactions Engine',
        description:
          'Define daily, weekly, or monthly recurring income and expense rules that automatically spawn ledger entries on their due date.',
        category: 'cashflow',
        type: 'feature',
      },
    ],
  },
  {
    version: '1.2.0',
    title: 'Link Scheduling & Section Headers',
    date: '2026-07-15',
    summary:
      'Enhanced Bio profile flexibility with time-based link scheduling (start/end windows) and visual section headers with dividers.',
    isLatest: false,
    highlights: [
      'Time-based Link Scheduling: Auto-activate and expire links at set date/time.',
      'Bio Section Headers: Organize long link lists into clear titled sections.',
      'Auth Optimization: Migrated authentication forms to React 19 useActionState.',
    ],
    items: [
      {
        id: 'feat-link-scheduling',
        title: 'Time-Based Link Scheduling',
        description:
          'Schedule links to automatically go live and expire at specific dates and times—perfect for limited-time product drops and event promos.',
        category: 'bio',
        type: 'feature',
      },
      {
        id: 'feat-section-headers',
        title: 'Bio Section Headers & Visual Dividers',
        description:
          'Group links into structured visual sections with custom header titles and dividers to improve page scanability.',
        category: 'bio',
        type: 'improvement',
      },
    ],
  },
  {
    version: '1.1.0',
    title: 'Command Palette, Activity Feed & Domain Architecture',
    date: '2026-07-11',
    summary:
      'Pioneered instant keyboard navigation via Command Palette (Cmd+K), real-time Activity Feed dashboard, and architecture transition to Domain-Driven Feature Folders.',
    isLatest: false,
    highlights: [
      'First-Gen Command Palette (Cmd+K): Quick search and route navigation.',
      'Activity Feed Dashboard: Live chronological audit of recent workspace actions.',
      'Domain-Driven Feature Folders: Scalable modular architecture across all app domains.',
    ],
    items: [
      {
        id: 'feat-cmdk-palette',
        title: 'Command Palette (Cmd+K / Ctrl+K)',
        description:
          'Global keyboard shortcut palette for rapid app navigation, modal actions, and theme switching without mouse interaction.',
        category: 'platform',
        type: 'feature',
      },
      {
        id: 'feat-activity-feed',
        title: 'Workspace Activity Feed Dashboard',
        description:
          'Chronological activity stream on the platform dashboard tracking recent edits across all connected workspace tools.',
        category: 'platform',
        type: 'feature',
      },
      {
        id: 'feat-support-admin-bell',
        title: 'Support Admin Queue & Ticket Scoring',
        description:
          'Admin support queue with urgency scoring algorithms and ticket status tracking.',
        category: 'platform',
        type: 'feature',
      },
    ],
  },
  {
    version: '1.0.0',
    title: 'Initial Platform Launch — The All-in-One Workspace',
    date: '2026-07-04',
    summary:
      'Official public launch of Kytbox: bringing together Link-in-Bio management, smart Cashflow tracking, Omni Kanban task lists, and Customer Support in one unified workspace.',
    isLatest: false,
    highlights: [
      'Bio Link Hub: Responsive creator profiles with customizable themes and click tracking.',
      'Cashflow Ledger: Multi-book income and expense management with summary KPIs.',
      'Omni List Hub: Drag-and-drop Kanban task boards, wishlists, and idea lists.',
      'Support Desk: Integrated help ticket submission and issue tracking.',
    ],
    items: [
      {
        id: 'feat-bio-core',
        title: 'Link-in-Bio Profile Hub',
        description:
          'Create responsive public profile pages with customizable themes, animated link buttons, and real-time click tracking.',
        category: 'bio',
        type: 'feature',
      },
      {
        id: 'feat-cashflow-core',
        title: 'Smart Cashflow Ledger',
        description:
          'Track personal and business finances with multi-book support, customizable categories, and dynamic monthly summaries.',
        category: 'cashflow',
        type: 'feature',
      },
      {
        id: 'feat-list-core',
        title: 'Omni Kanban & List Hub',
        description:
          'Manage tasks with drag-and-drop Kanban boards, curated shopping wishlists, and rapid brainstorm lists.',
        category: 'list',
        type: 'feature',
      },
      {
        id: 'feat-support-core',
        title: 'Support Ticket Help Desk',
        description:
          'Submit customer support requests, report bugs, and track ticket status resolution in real-time.',
        category: 'platform',
        type: 'feature',
      },
    ],
  },
]

export function getChangelogReleases(): ChangelogRelease[] {
  return CHANGELOG_RELEASES
}

export function getLatestRelease(): ChangelogRelease {
  return CHANGELOG_RELEASES.find((r) => r.isLatest) ?? CHANGELOG_RELEASES[0]
}

export function filterChangelog(
  releases: ChangelogRelease[],
  filter?: ChangelogFilterOptions,
): ChangelogRelease[] {
  if (!filter) return releases

  const category = filter.category && filter.category !== 'all' ? filter.category : null
  const query = filter.query?.trim().toLowerCase() || null

  if (!category && !query) return releases

  return releases
    .map((release) => {
      // Filter items inside the release
      const matchingItems = release.items.filter((item) => {
        const matchesCategory = !category || item.category === category
        const matchesQuery =
          !query ||
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query)

        return matchesCategory && matchesQuery
      })

      // Check if release summary/title itself matches the query
      const releaseMatchesQuery =
        query &&
        (release.title.toLowerCase().includes(query) ||
          release.summary.toLowerCase().includes(query) ||
          release.version.toLowerCase().includes(query))

      // If category filter is active, only include if there are matching items for that category
      if (category) {
        if (matchingItems.length === 0) return null
        return {
          ...release,
          items: matchingItems,
        }
      }

      // If only query filter is active
      if (query) {
        if (matchingItems.length === 0 && !releaseMatchesQuery) return null
        return {
          ...release,
          items: matchingItems.length > 0 ? matchingItems : release.items,
        }
      }

      return {
        ...release,
        items: matchingItems,
      }
    })
    .filter((release): release is ChangelogRelease => release !== null)
}
