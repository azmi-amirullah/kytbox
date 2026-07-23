'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LuPlus,
  LuPencil,
  LuTrash2,
  LuEllipsisVertical,
  LuLoader,
  LuShare2,
  LuBookmark,
  LuCheck,
  LuRepeat,
  LuDownload,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
  LuSearch,
  LuX,
} from 'react-icons/lu'
import { toast } from 'react-toastify'
import type {
  CashflowDTO,
  CashflowEntryDTO,
  CashflowBudgetDTO,
} from '@/types/dto'
import { formatCurrencyCompact } from '@/lib/currency'
import {
  deleteCashflow,
  deleteEntry,
  generateRecurringEntries,
} from '../actions'
import CashflowModal from './CashflowModal'
import EntryModal from './EntryModal'
import ShareModal from './ShareModal'
import { CashflowCharts } from './CashflowCharts'
import { ProjectionsView } from './ProjectionsView'
import { subscribeToPublicCashflow, removeShare } from '../actions'
import BudgetManager from './BudgetManager'
import { DateFilter } from './DateFilter'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  filterEntriesByDate,
  resolveFilterRange,
  type DateFilterState,
} from '../math'
import { cn } from '@/lib/utils'

interface CashflowDetailProps {
  cashflow: CashflowDTO
  entries: CashflowEntryDTO[]
  budgets: CashflowBudgetDTO[]
  currency: string | null
  currentUserId?: string
  initialUserRole?: 'owner' | 'edit' | 'read' | 'public'
  initialShareId?: string | null
  initialHasShare?: boolean
}

export default function CashflowDetail({
  cashflow,
  entries,
  budgets,
  currency,
  currentUserId,
  initialUserRole = 'public',
  initialShareId = null,
  initialHasShare = false,
}: CashflowDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<CashflowEntryDTO | null>(
    null,
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const [isDeletingEntryId, setIsDeletingEntryId] = useState<string | null>(
    null,
  )

  const isOwner = currentUserId === cashflow.user_id

  // Initialize state from server props
  const [hasShare, setHasShare] = useState(initialHasShare)
  const [shareId, setShareId] = useState<string | null>(initialShareId)
  const [userRole] = useState<'owner' | 'edit' | 'read' | 'public'>(
    isOwner ? 'owner' : initialUserRole,
  )

  // ── Search query ─────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')

  // ── Type / Category filters ────────────────────────────────────────────────
  const [selectedType, setSelectedType] = useState<
    'all' | 'income' | 'expense'
  >('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>()
    for (const e of entries) {
      if (e.category) set.add(e.category)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [entries])

  const hasActiveFilters =
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    searchQuery.trim() !== ''

  function clearAllFilters() {
    setSelectedType('all')
    setSelectedCategory('all')
    setSearchQuery('')
  }

  // ── Date filter ──────────────────────────────────────────────────────────────
  const [filterState, setFilterState] = useState<DateFilterState>({
    preset: 'all-time',
    custom: { from: null, to: null },
  })

  const filteredEntries = useMemo(() => {
    const range = resolveFilterRange(filterState)
    let filtered = filterEntriesByDate(entries, range)

    if (selectedType !== 'all') {
      filtered = filtered.filter((e) => e.type === selectedType)
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((e) => e.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((e) =>
        e.description.toLowerCase().includes(query),
      )
    }
    return filtered
  }, [entries, filterState, selectedType, selectedCategory, searchQuery])
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Client-side pagination ─────────────────────────────────────────────────────
  const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
  type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

  // Store page, pageSize, filterState, and searchQuery reference together so filter or search changes
  // reset the page to 1 in a single render pass — no refs, no effects.
  const [pageInfo, setPageInfo] = useState<{
    page: number
    pageSize: PageSizeOption
    forFilter: DateFilterState
    forSearch: string
    forType: string
    forCategory: string
  }>({
    page: 1,
    pageSize: 10,
    forFilter: filterState,
    forSearch: searchQuery,
    forType: selectedType,
    forCategory: selectedCategory,
  })

  const currentPage =
    pageInfo.forFilter === filterState &&
    pageInfo.forSearch === searchQuery &&
    pageInfo.forType === selectedType &&
    pageInfo.forCategory === selectedCategory
      ? pageInfo.page
      : 1
  const pageSize = pageInfo.pageSize

  function goToPage(next: number | ((p: number) => number)) {
    setPageInfo((prev) => ({
      page: typeof next === 'function' ? next(currentPage) : next,
      pageSize: prev.pageSize,
      forFilter: filterState,
      forSearch: searchQuery,
      forType: selectedType,
      forCategory: selectedCategory,
    }))
  }

  function changePageSize(size: PageSizeOption) {
    setPageInfo({
      page: 1,
      pageSize: size,
      forFilter: filterState,
      forSearch: searchQuery,
      forType: selectedType,
      forCategory: selectedCategory,
    })
  }

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize))
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, currentPage, pageSize])

  // Stable 7-slot pagination: ALWAYS render exactly 7 <Button> elements (for
  // totalPages > 7). Using the slot INDEX as the React key means React never
  // destroys and recreates a DOM node when content changes — it only updates
  // props on the same existing element. Ellipsis slots are disabled buttons
  // showing '…' so the element type is always the same at every position.
  type PaginationSlot = { kind: 'page'; page: number } | { kind: 'ellipsis' }

  function getPaginationSlots(): PaginationSlot[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => ({
        kind: 'page' as const,
        page: i + 1,
      }))
    }

    const e: PaginationSlot = { kind: 'ellipsis' }

    // Left zone: currentPage is near the start — layout is always identical
    // within this zone, so no structural change on page 1→2→3→4.
    if (currentPage <= 4) {
      return [
        { kind: 'page', page: 1 },
        { kind: 'page', page: 2 },
        { kind: 'page', page: 3 },
        { kind: 'page', page: 4 },
        { kind: 'page', page: 5 },
        e,
        { kind: 'page', page: totalPages },
      ]
    }

    // Right zone: currentPage is near the end — mirror of left zone.
    if (currentPage >= totalPages - 3) {
      return [
        { kind: 'page', page: 1 },
        e,
        { kind: 'page', page: totalPages - 4 },
        { kind: 'page', page: totalPages - 3 },
        { kind: 'page', page: totalPages - 2 },
        { kind: 'page', page: totalPages - 1 },
        { kind: 'page', page: totalPages },
      ]
    }

    // Middle zone: currentPage is far from both edges.
    return [
      { kind: 'page', page: 1 },
      e,
      { kind: 'page', page: currentPage - 1 },
      { kind: 'page', page: currentPage },
      { kind: 'page', page: currentPage + 1 },
      e,
      { kind: 'page', page: totalPages },
    ]
  }
  // ────────────────────────────────────────────────────────────────────────────────

  const canEdit = isOwner || userRole === 'edit'

  const [isGeneratingRecurring, setIsGeneratingRecurring] = useState(false)
  const [isGeneratingPast, setIsGeneratingPast] = useState(false)

  const recurringStats = useMemo(() => {
    const emptyMonthsList: string[] = []
    if (userRole !== 'owner')
      return {
        dueNowCount: 0,
        upcomingCount: 0,
        pastMissingCount: 0,
        pastMonthsList: emptyMonthsList,
        currentMonthName: '',
      }

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const todayDay = now.getDate()
    const currentMonthStart = new Date(currentYear, currentMonth, 1)
    const currentMonthName = `${now.toLocaleDateString('en-US', { month: 'long' })} ${now.getFullYear()}`

    // Group all entries by description + type (case-insensitive) to find the absolute latest entry of each series
    const latestSeriesMap = new Map<string, (typeof entries)[number]>()
    for (const entry of entries) {
      const key = `${entry.description.trim().toLowerCase()}|${entry.type}`
      const existing = latestSeriesMap.get(key)
      if (!existing || entry.date > existing.date) {
        latestSeriesMap.set(key, entry)
      }
    }
    const uniqueRecurring = Array.from(latestSeriesMap.values()).filter(
      (e) => e.is_recurring,
    )

    if (uniqueRecurring.length === 0)
      return {
        dueNowCount: 0,
        upcomingCount: 0,
        pastMissingCount: 0,
        pastMonthsList: emptyMonthsList,
        currentMonthName,
      }

    // Get all entries for the current month
    const existingThisMonth = entries.filter((e) => {
      const [year, month] = e.date.split('-').map(Number)
      return year === currentYear && month - 1 === currentMonth
    })

    const existingSet = new Set(
      existingThisMonth.map(
        (e) => `${e.description.trim().toLowerCase()}|${e.type}`,
      ),
    )

    // Create a lookup for past entries to see what is missing in past months
    const pastExistingSet = new Set(
      entries
        .filter((e) => {
          const [year, month] = e.date.split('-').map(Number)
          return (
            year < currentYear ||
            (year === currentYear && month - 1 < currentMonth)
          )
        })
        .map((e) => {
          const [year, month] = e.date.split('-').map(Number)
          return `${year}|${month - 1}|${e.description.trim().toLowerCase()}|${e.type}`
        }),
    )

    let dueNowCount = 0
    let upcomingCount = 0
    let pastMissingCount = 0
    const pastMonthsSet = new Set<string>()

    for (const entry of uniqueRecurring) {
      const [entryYear, entryMonthNumber, entryDay] = entry.date
        .split('-')
        .map(Number)

      // 1. Check current month status (due now vs upcoming)
      const startedInOrBeforeCurrentMonth =
        entryYear < currentYear ||
        (entryYear === currentYear && entryMonthNumber - 1 <= currentMonth)

      const isAnniversaryMonth =
        entry.recurrence_interval !== 'yearly' ||
        entryMonthNumber - 1 === currentMonth

      if (startedInOrBeforeCurrentMonth && isAnniversaryMonth) {
        const key = `${entry.description.trim().toLowerCase()}|${entry.type}`
        if (!existingSet.has(key)) {
          const lastDayOfCurrentMonth = new Date(
            currentYear,
            currentMonth + 1,
            0,
          ).getDate()
          const targetDay = Math.min(entryDay, lastDayOfCurrentMonth)

          if (targetDay > todayDay) {
            upcomingCount++
          } else {
            dueNowCount++
          }
        }
      }

      // 2. Check past months status
      const tempDate = new Date(entryYear, entryMonthNumber - 1, 1)
      while (tempDate < currentMonthStart) {
        const y = tempDate.getFullYear()
        const m = tempDate.getMonth()

        // Check if yearly and anniversary
        if (
          entry.recurrence_interval === 'yearly' &&
          entryMonthNumber - 1 !== m
        ) {
          tempDate.setMonth(tempDate.getMonth() + 1)
          continue
        }

        const key = `${y}|${m}|${entry.description.trim().toLowerCase()}|${entry.type}`
        if (!pastExistingSet.has(key)) {
          pastMissingCount++
          const monthName = tempDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })
          pastMonthsSet.add(monthName)
        }
        tempDate.setMonth(tempDate.getMonth() + 1)
      }
    }

    return {
      dueNowCount,
      upcomingCount,
      pastMissingCount,
      pastMonthsList: Array.from(pastMonthsSet),
      currentMonthName,
    }
  }, [entries, userRole])

  async function handleGenerateRecurring() {
    setIsGeneratingRecurring(true)
    try {
      const now = new Date()
      const result = await generateRecurringEntries(
        cashflow.id,
        now.getFullYear(),
        now.getMonth(),
      )
      if (result.error) {
        toast.error(result.error)
      } else if (result.generated !== undefined) {
        if (result.generated > 0) {
          toast.success(
            `Generated ${result.generated} recurring ${result.generated === 1 ? 'entry' : 'entries'}`,
          )
          router.refresh()
        } else {
          toast.info('No recurring entries to generate')
        }
      }
    } catch (err) {
      console.error('Error generating recurring entries:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setTimeout(() => {
        setIsGeneratingRecurring(false)
      }, 1000)
    }
  }

  async function handleGeneratePast() {
    setIsGeneratingPast(true)
    try {
      const result = await generateRecurringEntries(
        cashflow.id,
        undefined,
        undefined,
        true,
      )
      if (result.error) {
        toast.error(result.error)
      } else if (result.generated !== undefined) {
        if (result.generated > 0) {
          toast.success(
            `Generated ${result.generated} past recurring ${result.generated === 1 ? 'entry' : 'entries'}`,
          )
          router.refresh()
        } else {
          toast.info('No past recurring entries to generate')
        }
      }
    } catch (err) {
      console.error('Error generating past recurring entries:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setTimeout(() => {
        setIsGeneratingPast(false)
      }, 1000)
    }
  }

  // Calculate stats from filtered entries
  const income = filteredEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + Number(e.amount), 0)
  const expense = filteredEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + Number(e.amount), 0)
  const balance = income - expense

  async function handleDeleteCashflow() {
    setIsDeleting(true)
    startTransition(async () => {
      const result = await deleteCashflow(cashflow.id)
      if (result.error) {
        toast.error('Failed to delete cashflow')
        setIsDeleting(false)
        setDeleteDialogOpen(false)
      } else {
        setDeleteDialogOpen(false)
        toast.success('Cashflow deleted')
        router.push('/cashflow')
      }
    })
  }

  async function handleDeleteEntry(entryId: string) {
    setIsDeletingEntryId(entryId)
    startTransition(async () => {
      const result = await deleteEntry(entryId)
      if (result.error) {
        toast.error('Failed to delete entry')
        setIsDeletingEntryId(null)
        setDeletingEntryId(null)
      } else {
        setDeletingEntryId(null)
        toast.success('Entry deleted')
        router.refresh()
        // Keep isDeletingEntryId true to prevent flicker before refresh updates UI
      }
    })
  }

  async function handleBookmark() {
    startTransition(async () => {
      if (hasShare && shareId) {
        // Remove bookmark
        const result = await removeShare(shareId)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Removed from dashboard')
          setHasShare(false)
          setShareId(null)
          router.refresh()
        }
      } else {
        // Add bookmark
        const result = await subscribeToPublicCashflow(cashflow.id)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Added to your dashboard')
          setHasShare(true)
          if (result.data) {
            setShareId(result.data.id)
          }
          router.refresh()
        }
      }
    })
  }

  function openEditEntry(entry: CashflowEntryDTO) {
    setEditingEntry(entry)
    setIsEntryModalOpen(true)
  }

  function openAddEntry() {
    setEditingEntry(null)
    setIsEntryModalOpen(true)
  }

  function handleEntrySuccess() {
    startTransition(() => {
      router.refresh()
    })
  }

  function handleExportCSV() {
    if (filteredEntries.length === 0) {
      toast.info('No entries to export')
      return
    }

    const headers = [
      'Date',
      'Type',
      'Category',
      'Description',
      'Amount',
      'Currency',
      'Recurring',
      'Frequency',
    ]
    const rows = filteredEntries.map((e) => [
      e.date,
      e.type,
      e.category || '',
      `"${e.description.replace(/"/g, '""')}"`, // escape quotes
      e.amount.toString(),
      currency || '',
      e.is_recurring ? 'Yes' : 'No',
      e.recurrence_interval || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    let dateSuffix = 'all-time'
    if (filterState.preset !== 'all-time' && filterState.preset !== 'custom') {
      dateSuffix = filterState.preset
    } else if (filterState.preset === 'custom') {
      if (filterState.custom.from && filterState.custom.to) {
        dateSuffix = `${filterState.custom.from}_to_${filterState.custom.to}`
      } else if (filterState.custom.from) {
        dateSuffix = `from_${filterState.custom.from}`
      } else if (filterState.custom.to) {
        dateSuffix = `to_${filterState.custom.to}`
      }
    }

    const safeTitle = cashflow.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const filename = `export-${safeTitle}-${dateSuffix}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className='space-y-6'>
      {/* Breadcrumbs */}
      <div>
        <nav
          aria-label='breadcrumb'
          className='flex items-center gap-1 text-sm text-muted-foreground mb-2'
        >
          <Link href='/app' className='hover:text-foreground transition-colors'>
            Kytbox
          </Link>
          <span className='text-muted-foreground'>/</span>
          <Link
            href='/cashflow'
            className='hover:text-foreground transition-colors'
          >
            Cashflow
          </Link>
          <span className='text-muted-foreground'>/</span>
          <span
            aria-current='page'
            className='text-foreground font-medium truncate max-w-50'
          >
            {cashflow.title}
          </span>
        </nav>

        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <div className='flex items-center gap-3'>
              <h1 className='text-3xl font-bold tracking-tight text-foreground'>
                {cashflow.title}
              </h1>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='h-8 w-8'>
                      <LuEllipsisVertical className='w-4 h-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='start'>
                    <DropdownMenuItem
                      className='cursor-pointer'
                      onClick={() => setIsShareModalOpen(true)}
                    >
                      <LuShare2 className='w-4 h-4 mr-2' />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='cursor-pointer'
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <LuPencil className='w-4 h-4 mr-2' />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setIsDeleting(false)
                        setDeleteDialogOpen(true)
                      }}
                      className='text-destructive focus:text-destructive cursor-pointer'
                    >
                      <LuTrash2 className='w-4 h-4 mr-2' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {!isOwner && (
                <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full'>
                  {userRole === 'edit' ? 'Editor Access' : 'View Only'}
                </span>
              )}
            </div>
            <p className='text-muted-foreground text-sm'>
              {filterState.preset !== 'all-time'
                ? `${filteredEntries.length} of ${entries.length} entries`
                : `${entries.length} entries`}
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={handleExportCSV}
              className='gap-2'
            >
              <LuDownload className='w-4 h-4' />
              <span className='hidden sm:inline'>Export CSV</span>
            </Button>

            {!isOwner && currentUserId && (cashflow.is_public || !!shareId) && (
              <Button
                onClick={handleBookmark}
                variant={hasShare ? 'secondary' : 'outline'}
                className={`gap-2 ${hasShare ? 'text-green-600' : ''}`}
                disabled={isPending}
              >
                {isPending ? (
                  <LuLoader className='w-4 h-4 animate-spin' />
                ) : hasShare ? (
                  <LuCheck className='w-4 h-4' />
                ) : (
                  <LuBookmark className='w-4 h-4' />
                )}
                {hasShare ? 'Saved' : 'Add to Dashboard'}
              </Button>
            )}

            {canEdit && (
              <Button onClick={openAddEntry} className='gap-2'>
                <LuPlus className='w-4 h-4' />
                Add Entry
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Recurring Entry Generation Banner */}
      {(() => {
        const {
          dueNowCount,
          upcomingCount,
          pastMissingCount,
          pastMonthsList,
          currentMonthName,
        } = recurringStats
        const totalPastAndDueCount = pastMissingCount + dueNowCount
        if (totalPastAndDueCount === 0 && upcomingCount === 0) return null

        const formatMonthsList = (months: string[]) => {
          const groups: Record<string, string[]> = {}
          for (const m of months) {
            const [monthName, year] = m.split(' ')
            if (!groups[year]) {
              groups[year] = []
            }
            groups[year].push(monthName)
          }
          return Object.entries(groups)
            .map(([year, monthNames]) => {
              if (monthNames.length === 1) {
                return `${monthNames[0]} (${year})`
              }
              return `${monthNames.join(', ')} (${year})`
            })
            .join(', ')
        }

        // Combine past months and current month if current month has due entries
        const displayMonths = [...pastMonthsList]
        if (dueNowCount > 0) {
          displayMonths.push(currentMonthName)
        }

        const pastMonthsStr = formatMonthsList(displayMonths)
        const [curMonth, curYear] = currentMonthName.split(' ')
        const currentMonthDisplay = `${curMonth} (${curYear})`

        let titleText = ''
        let subtextText = ''

        if (totalPastAndDueCount > 0) {
          const entryWord =
            totalPastAndDueCount === 1 ? 'entry is' : 'entries are'
          titleText = `${totalPastAndDueCount} recurring ${entryWord} missing or due for ${pastMonthsStr}`
          if (upcomingCount > 0) {
            subtextText = `Catch up on missed transactions for ${pastMonthsStr}. You can also generate upcoming entries early.`
          } else {
            subtextText = `Catch up on missed transactions for ${pastMonthsStr}.`
          }
        } else if (upcomingCount > 0) {
          const entryWord = upcomingCount === 1 ? 'entry is' : 'entries are'
          titleText = `${upcomingCount} upcoming recurring ${entryWord} ready for ${currentMonthDisplay}`
          subtextText =
            'No entries are due today, but you can generate upcoming entries early.'
        }

        return (
          <div className='bg-emerald-50/30 border border-emerald-200/30 dark:bg-emerald-950/10 dark:border-emerald-800/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='flex items-center gap-3 flex-1'>
              <div className='p-2 bg-emerald-50/50 border border-emerald-200/30 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0 self-start sm:self-center'>
                <LuRepeat className='w-5 h-5 animate-pulse' />
              </div>
              <div>
                <p className='font-semibold text-sm text-foreground'>
                  {titleText}
                </p>
                <p className='text-xs text-muted-foreground'>{subtextText}</p>
              </div>
            </div>
            <div className='flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 self-start md:self-center w-full md:w-auto justify-end'>
              {totalPastAndDueCount > 0 && (
                <Button
                  onClick={handleGeneratePast}
                  disabled={isGeneratingPast}
                  variant='outline'
                  className='gap-2 sm:self-center self-start shrink-0'
                >
                  {isGeneratingPast ? (
                    <LuLoader className='w-4 h-4 animate-spin' />
                  ) : (
                    <LuRepeat className='w-4 h-4' />
                  )}
                  Generate Past ({totalPastAndDueCount})
                </Button>
              )}

              {upcomingCount > 0 && (
                <Button
                  onClick={handleGenerateRecurring}
                  disabled={isGeneratingRecurring}
                  className='gap-2 sm:self-center self-start shrink-0'
                >
                  {isGeneratingRecurring ? (
                    <LuLoader className='w-4 h-4 animate-spin' />
                  ) : (
                    <LuRepeat className='w-4 h-4' />
                  )}
                  Generate Early ({upcomingCount})
                </Button>
              )}
            </div>
          </div>
        )
      })()}

      {/* Summary Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Income</p>
          <p className='text-2xl font-bold text-green-600'>
            +{formatCurrencyCompact(income, currency)}
          </p>
        </div>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Expense</p>
          <p className='text-2xl font-bold text-red-600'>
            -{formatCurrencyCompact(expense, currency)}
          </p>
        </div>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Balance</p>
          <p
            className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {balance >= 0 ? '+' : ''}
            {formatCurrencyCompact(balance, currency)}
          </p>
        </div>
      </div>

      {/* Date Filter */}
      {entries.length > 0 && (
        <DateFilter
          state={filterState}
          onChange={setFilterState}
          filteredCount={filteredEntries.length}
          totalCount={entries.length}
        />
      )}

      {/* Projections View — always uses unfiltered entries (recurring logic is time-aware) */}
      <ProjectionsView entries={entries} currency={currency} />

      {/* Search + Filters */}
      {entries.length > 0 && (
        <div className='flex flex-col gap-3 w-full sm:flex-row sm:items-center'>
          {/* Search Input */}
          <div className='relative flex items-center w-full sm:max-w-xs'>
            <LuSearch className='absolute left-3 w-4 h-4 text-muted-foreground' />
            <Input
              placeholder='Search entries...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9 pr-9 bg-card w-full'
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className='absolute right-3 text-muted-foreground hover:text-foreground focus:outline-none'
                aria-label='Clear search'
              >
                <LuX className='w-4 h-4' />
              </button>
            )}
          </div>

          {/* Select Dropdowns Wrapper */}
          <div className='flex flex-wrap items-center gap-3 w-full sm:w-auto sm:flex-1'>
            <div
              className={cn(
                'grid gap-3 w-full sm:flex sm:w-auto',
                uniqueCategories.length > 0 ? 'grid-cols-2' : 'grid-cols-1',
              )}
            >
              <Select
                value={selectedType}
                onValueChange={(v) => {
                  if (v === 'all' || v === 'income' || v === 'expense') {
                    setSelectedType(v)
                  }
                }}
              >
                <SelectTrigger className='bg-card w-full sm:w-35'>
                  <SelectValue placeholder='Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='income'>Income</SelectItem>
                  <SelectItem value='expense'>Expense</SelectItem>
                </SelectContent>
              </Select>

              {uniqueCategories.length > 0 && (
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className='bg-card w-full sm:w-40'>
                    <SelectValue placeholder='Category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Categories</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clearAllFilters}
                className='gap-1.5 text-muted-foreground hover:text-foreground w-full sm:w-auto justify-center sm:justify-start'
              >
                <LuX className='w-3.5 h-3.5' />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className='bg-card border rounded-xl overflow-hidden relative'>
        {isPending && (
          <div className='absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center z-10 transition-all duration-200'>
            <div className='flex items-center gap-2 bg-background border px-4 py-2 rounded-lg shadow-sm'>
              <LuLoader className='w-4 h-4 animate-spin text-primary' />
              <span className='text-sm font-medium'>Updating data...</span>
            </div>
          </div>
        )}
        {filteredEntries.length === 0 ? (
          <div className='p-12 text-center text-muted-foreground'>
            <p className='text-sm mb-4'>
              {entries.length === 0
                ? 'No entries yet. Add your first transaction.'
                : hasActiveFilters
                  ? 'No entries match your filters.'
                  : 'No entries match the selected date range.'}
            </p>
            {entries.length === 0 ? (
              <Button
                onClick={openAddEntry}
                variant='outline'
                className='gap-2'
              >
                <LuPlus className='w-4 h-4' />
                Add Entry
              </Button>
            ) : (
              hasActiveFilters && (
                <Button
                  onClick={clearAllFilters}
                  variant='outline'
                  className='gap-2'
                >
                  <LuX className='w-4 h-4' />
                  Clear Filters
                </Button>
              )
            )}
          </div>
        ) : (
          <>
            <div className='divide-y divide-border'>
              {/* Desktop Table View */}
              <div className='hidden md:block overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-20 border-r border-border/40'>
                        Date
                      </TableHead>
                      <TableHead className='w-25 border-r border-border/40'>
                        Type
                      </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                      <TableHead className='w-20'></TableHead>
                    </TableRow>
                  </TableHeader>
                  <motion.tbody
                    key={currentPage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    data-slot='table-body'
                    className='[&_tr:last-child]:border-0'
                  >
                    {paginatedEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className='text-muted-foreground text-sm border-r border-border/30 text-nowrap'>
                          {(() => {
                            const [eYear, eMonth, eDay] = entry.date
                              .split('-')
                              .map(Number)
                            const date = new Date(eYear, eMonth - 1, eDay)
                            return date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          })()}
                        </TableCell>
                        <TableCell className='border-r border-border/30'>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                              entry.type === 'income'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                            }`}
                          >
                            {entry.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span className='font-medium'>
                              {entry.description}
                            </span>
                            {entry.category && (
                              <span className='inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground capitalize'>
                                {entry.category}
                              </span>
                            )}
                            {entry.is_recurring && (
                              <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/30'>
                                <LuRepeat className='w-2.5 h-2.5' />
                                <span className='capitalize text-[10px]'>
                                  {entry.recurrence_interval}
                                </span>
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium text-nowrap ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {entry.type === 'income' ? '+' : '-'}
                          {formatCurrencyCompact(
                            Number(entry.amount),
                            currency,
                          )}
                        </TableCell>
                        <TableCell>
                          {canEdit && (
                            <div className='flex justify-end gap-1'>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                onClick={() => openEditEntry(entry)}
                              >
                                <LuPencil className='w-4 h-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8 text-destructive hover:text-destructive'
                                onClick={() => {
                                  setIsDeletingEntryId(null)
                                  setDeletingEntryId(entry.id)
                                }}
                              >
                                <LuTrash2 className='w-4 h-4' />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </motion.tbody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className='md:hidden'>
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className='divide-y divide-border'
                >
                  {paginatedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn('px-4 py-2', canEdit ? 'pr-0' : '')}
                    >
                      <div className='flex items-center justify-between gap-4'>
                        <div className='space-y-2 min-w-0 flex-1'>
                          <div className='flex items-center gap-2'>
                            <span className='text-xs text-muted-foreground font-medium'>
                              {(() => {
                                const [eYear, eMonth, eDay] = entry.date
                                  .split('-')
                                  .map(Number)
                                const date = new Date(eYear, eMonth - 1, eDay)
                                return date.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              })()}
                            </span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                                entry.type === 'income'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                              }`}
                            >
                              {entry.type}
                            </span>
                          </div>
                          <div className='flex flex-wrap items-center gap-1.5'>
                            <span className='font-medium text-sm leading-tight overflow-wrap-anywhere'>
                              {entry.description}
                            </span>
                            {entry.category && (
                              <span className='inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground capitalize'>
                                {entry.category}
                              </span>
                            )}
                            {entry.is_recurring && (
                              <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/30'>
                                <LuRepeat className='w-2.5 h-2.5' />
                                <span className='capitalize text-[10px]'>
                                  {entry.recurrence_interval}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className='text-right shrink-0 flex gap-4 items-center'>
                          <div
                            className={`font-bold text-sm ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {entry.type === 'income' ? '+' : '-'}
                            {formatCurrencyCompact(
                              Number(entry.amount),
                              currency,
                            )}
                          </div>
                          {canEdit && (
                            <div className='flex justify-end gap-1 flex-col border-l px-2'>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                onClick={() => openEditEntry(entry)}
                              >
                                <LuPencil className='w-4 h-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8 text-destructive hover:bg-destructive/10'
                                onClick={() => {
                                  setIsDeletingEntryId(null)
                                  setDeletingEntryId(entry.id)
                                }}
                              >
                                {isDeletingEntryId === entry.id ? (
                                  <LuLoader className='w-4 h-4 animate-spin' />
                                ) : (
                                  <LuTrash2 className='w-4 h-4' />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className='flex items-center justify-between gap-3 px-4 py-3 border-t border-border/60 bg-muted/20 flex-wrap'>
                {/* Left: entry count + page size picker */}
                <div className='flex items-center gap-2'>
                  <p className='text-xs text-muted-foreground'>
                    Showing{' '}
                    <span className='font-medium text-foreground'>
                      {(currentPage - 1) * pageSize + 1}–
                      {Math.min(currentPage * pageSize, filteredEntries.length)}
                    </span>{' '}
                    of{' '}
                    <span className='font-medium text-foreground'>
                      {filteredEntries.length}
                    </span>{' '}
                    entries
                  </p>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const num = Number(e.target.value)
                      const size = PAGE_SIZE_OPTIONS.find((n) => n === num)
                      if (size !== undefined) changePageSize(size)
                    }}
                    className='h-6 rounded border border-border bg-background px-1.5 text-[11px] text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring'
                    aria-label='Entries per page'
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>
                </div>

                {/* Right: navigation buttons */}
                <div className='flex items-center gap-1'>
                  {/* First page */}
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-7 w-7'
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    aria-label='First page'
                  >
                    <LuChevronsLeft className='w-3.5 h-3.5' />
                  </Button>
                  {/* Previous page */}
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-7 w-7'
                    onClick={() => goToPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label='Previous page'
                  >
                    <LuChevronLeft className='w-3.5 h-3.5' />
                  </Button>

                  {/* Slot-keyed buttons: same element type at every slot index,
                    so React only updates props — never destroys/recreates nodes */}
                  {getPaginationSlots().map((slot, slotIdx) => (
                    <Button
                      key={slotIdx}
                      variant={
                        slot.kind === 'page' && currentPage === slot.page
                          ? 'default'
                          : 'outline'
                      }
                      size='icon'
                      className={
                        slot.kind === 'ellipsis'
                          ? 'h-7 w-7 text-xs border-0 shadow-none text-muted-foreground cursor-default pointer-events-none'
                          : 'h-7 w-7 text-xs'
                      }
                      disabled={slot.kind === 'ellipsis'}
                      onClick={
                        slot.kind === 'page'
                          ? () => goToPage(slot.page)
                          : undefined
                      }
                      aria-label={
                        slot.kind === 'page' ? `Page ${slot.page}` : undefined
                      }
                      aria-current={
                        slot.kind === 'page' && currentPage === slot.page
                          ? 'page'
                          : undefined
                      }
                      tabIndex={slot.kind === 'ellipsis' ? -1 : undefined}
                    >
                      {slot.kind === 'ellipsis' ? '…' : slot.page}
                    </Button>
                  ))}

                  {/* Next page */}
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-7 w-7'
                    onClick={() => goToPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label='Next page'
                  >
                    <LuChevronRight className='w-3.5 h-3.5' />
                  </Button>
                  {/* Last page */}
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-7 w-7'
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    aria-label='Last page'
                  >
                    <LuChevronsRight className='w-3.5 h-3.5' />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Charts */}
      <div className='space-y-4'>
        <div>
          <h2 className='text-lg font-bold tracking-tight'>
            Financial Overview
          </h2>
          <p className='text-sm text-muted-foreground'>
            Monthly breakdown of your transactions
          </p>
        </div>
        <CashflowCharts entries={filteredEntries} currency={currency} />
      </div>

      {/* Budget Tracker */}
      <BudgetManager
        cashflowId={cashflow.id}
        budgets={budgets}
        entries={entries}
        currency={currency}
        canEdit={canEdit}
      />

      {/* Edit Cashflow Modal */}
      <CashflowModal
        mode='edit'
        cashflow={cashflow}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      {/* Share Modal */}
      <ShareModal
        cashflow={cashflow}
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
      />

      {/* Entry Modal */}
      <EntryModal
        cashflowId={cashflow.id}
        entry={editingEntry}
        open={isEntryModalOpen}
        onOpenChange={setIsEntryModalOpen}
        currency={currency}
        onSuccess={handleEntrySuccess}
      />

      {/* Delete Cashflow Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cashflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{cashflow.title}&quot; and all
              its entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteCashflow()
              }}
              disabled={isPending}
              className='bg-destructive text-white hover:bg-destructive/90 min-w-25'
            >
              {isDeleting ? (
                <div className='flex items-center gap-2'>
                  <LuLoader className='w-4 h-4 animate-spin' />
                  <span>Deleting...</span>
                </div>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Entry Dialog */}
      <AlertDialog
        open={!!deletingEntryId}
        onOpenChange={() => setDeletingEntryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this entry. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                const id = deletingEntryId
                if (id) {
                  setIsDeletingEntryId(id)
                  handleDeleteEntry(id)
                }
              }}
              disabled={!!isDeletingEntryId}
              className='bg-destructive text-white hover:bg-destructive/90 min-w-20'
            >
              {isDeletingEntryId ? (
                <div className='flex items-center gap-2'>
                  <LuLoader className='w-3.5 h-3.5 animate-spin' />
                  <span>Deleting...</span>
                </div>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
