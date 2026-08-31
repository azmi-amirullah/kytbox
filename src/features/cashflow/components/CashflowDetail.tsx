'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { formatAppDate } from '@/lib/date-only'
import { Button } from '@/components/ui/button'
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav'
import {
  Table,
  TableBody,
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
  LuCloudDownload,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
  LuSearch,
  LuX,
  LuCopy,
  LuImport,
  LuArrowDown,
  LuArrowUp,
  LuTag,
  LuSlidersHorizontal,
  LuFileText,
  LuRotateCcw,
} from 'react-icons/lu'
import { toast } from 'react-toastify'
import type {
  CashflowDTO,
  CashflowEntryDTO,
  CashflowBudgetDTO,
  CashflowTagDTO,
  CashflowGoalDTO,
} from '@/types/dto'
import { formatCurrencyCompact } from '@/lib/currency'
import {
  deleteCashflow,
  deleteEntry,
  generateRecurringEntries,
  duplicateCashflow,
} from '../actions'
import dynamic from 'next/dynamic'
import CashflowModal from './CashflowModal'
import EntryModal from './EntryModal'
import ShareModal from './ShareModal'
import GoalCard from './GoalCard'
import { CashflowSummaryStats } from './CashflowSummaryStats'
import { Loader } from '@/components/ui/loader'
const CashflowCharts = dynamic(
  () => import('./CashflowCharts').then((mod) => mod.CashflowCharts),
  {
    ssr: false,
    loading: () => (
      <Loader
        className='min-h-90 py-12 bg-card border rounded-xl'
        text='Loading financial overview...'
      />
    ),
  },
)
import { ProjectionsView } from './ProjectionsView'
import { subscribeToPublicCashflow, removeShare } from '../actions'
import BudgetManager from './BudgetManager'
import ImportCsvModal from './ImportCsvModal'
import ReceiptLightbox from './ReceiptLightbox'
import { DateFilter, DateFilterCustomRange } from './DateFilter'
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
  sortEntries,
  filterEntriesByTags,
  isCashflowSortOption,
  type DateFilterState,
  type CashflowSortOption,
} from '../math'
import { escapeCsvField } from '../lib/csv'
import { cn } from '@/lib/utils'
import { EntryTypeBadge, EntryMetadataBadges } from './EntryBadges'
import { resolveTagColor, TAG_COLORS } from '../lib/tag-colors'
import { ManageTagModal } from './ManageTagModal'
import { FinancialReportModal } from './FinancialReportModal'

interface CashflowDetailProps {
  cashflow: CashflowDTO
  entries: CashflowEntryDTO[]
  budgets: CashflowBudgetDTO[]
  tags?: CashflowTagDTO[]
  goals?: CashflowGoalDTO[]
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
  tags = [],
  goals = [],
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<CashflowEntryDTO | null>(
    null,
  )
  const [viewingReceiptEntry, setViewingReceiptEntry] =
    useState<CashflowEntryDTO | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const [isDeletingEntryId, setIsDeletingEntryId] = useState<string | null>(
    null,
  )

  const isOwner = currentUserId === cashflow.user_id

  // ── Synchronized local entries state (updated instantly on API response) ───
  const [localEntries, setLocalEntries] = useState<CashflowEntryDTO[]>(entries)
  const [prevEntriesProp, setPrevEntriesProp] = useState(entries)

  if (entries !== prevEntriesProp) {
    setPrevEntriesProp(entries)
    setLocalEntries(entries)
  }

  // Initialize state from server props
  const [hasShare, setHasShare] = useState(initialHasShare)
  const [shareId, setShareId] = useState<string | null>(initialShareId)
  const [userRole] = useState<'owner' | 'edit' | 'read' | 'public'>(
    isOwner ? 'owner' : initialUserRole,
  )
  const [isManageTagOpen, setIsManageTagOpen] = useState(false)
  const [managingTag, setManagingTag] = useState<string | null>(null)

  // ── Search query ─────────────────────────────────────────────────────────────
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || searchParams.get('search') || ''
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search')
    if (q !== null) {
      setSearchQuery(q)
    }
  }, [searchParams])

  // ── Type / Category filters ────────────────────────────────────────────────
  const [selectedType, setSelectedType] = useState<
    'all' | 'income' | 'expense'
  >('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // ── Tag filter ────────────────────────────────────────────────────────────
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // ── Sort option ──────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<CashflowSortOption>('date-desc')

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>()
    for (const e of localEntries) {
      if (e.category) set.add(e.category)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [localEntries])

  const allUniqueTags = useMemo(() => {
    if (tags && tags.length > 0) {
      const sortedTags = [...tags].sort((a, b) => {
        const slotA =
          ((a.color_index % TAG_COLORS.length) + TAG_COLORS.length) %
          TAG_COLORS.length
        const slotB =
          ((b.color_index % TAG_COLORS.length) + TAG_COLORS.length) %
          TAG_COLORS.length
        if (slotA !== slotB) {
          return slotA - slotB
        }
        return a.name.localeCompare(b.name)
      })
      return sortedTags.map((t) => t.name)
    }
    const set = new Set<string>()
    for (const e of localEntries) {
      for (const t of e.tags ?? []) {
        if (t) set.add(t)
      }
    }
    return Array.from(set).sort((a, b) => {
      const colorA = resolveTagColor(a, tags)
      const colorB = resolveTagColor(b, tags)
      const idxA = TAG_COLORS.indexOf(colorA)
      const idxB = TAG_COLORS.indexOf(colorB)
      if (idxA !== idxB) return idxA - idxB
      return a.localeCompare(b)
    })
  }, [tags, localEntries])

  // ── Date filter ──────────────────────────────────────────────────────────────
  const [filterState, setFilterState] = useState<DateFilterState>({
    preset: 'all-time',
    custom: { from: null, to: null },
  })

  const hasActiveFilters =
    filterState.preset !== 'all-time' ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    sortBy !== 'date-desc' ||
    selectedTags.length > 0

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filterState.preset !== 'all-time') count++
    if (selectedType !== 'all') count++
    if (selectedCategory !== 'all') count++
    if (sortBy !== 'date-desc') count++
    if (selectedTags.length > 0) count += selectedTags.length
    return count
  }, [filterState, selectedType, selectedCategory, sortBy, selectedTags])

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  function clearAllFilters() {
    setFilterState({ preset: 'all-time', custom: { from: null, to: null } })
    setSelectedType('all')
    setSelectedCategory('all')
    setSearchQuery('')
    setSortBy('date-desc')
    setSelectedTags([])
  }

  const filteredEntries = useMemo(() => {
    const range = resolveFilterRange(filterState)
    let filtered = filterEntriesByDate(localEntries, range)

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
    filtered = sortEntries(filtered, sortBy)
    return filterEntriesByTags(filtered, selectedTags)
  }, [
    localEntries,
    filterState,
    selectedType,
    selectedCategory,
    searchQuery,
    sortBy,
    selectedTags,
  ])
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Client-side pagination ─────────────────────────────────────────────────────
  const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
  type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

  // Store page, pageSize, filterState, searchQuery, and sort reference together so filter, search, or sort changes
  // reset the page to 1 in a single render pass — no refs, no effects.
  const [pageInfo, setPageInfo] = useState<{
    page: number
    pageSize: PageSizeOption
    forFilter: DateFilterState
    forSearch: string
    forType: string
    forCategory: string
    forSort: CashflowSortOption
  }>({
    page: 1,
    pageSize: 10,
    forFilter: filterState,
    forSearch: searchQuery,
    forType: selectedType,
    forCategory: selectedCategory,
    forSort: sortBy,
  })

  const currentPage =
    pageInfo.forFilter === filterState &&
    pageInfo.forSearch === searchQuery &&
    pageInfo.forType === selectedType &&
    pageInfo.forCategory === selectedCategory &&
    pageInfo.forSort === sortBy
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
      forSort: sortBy,
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
      forSort: sortBy,
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
    const latestSeriesMap = new Map<string, (typeof localEntries)[number]>()
    for (const entry of localEntries) {
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
    const existingThisMonth = localEntries.filter((e) => {
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
      localEntries
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
  }, [localEntries, userRole])

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

  async function handleDuplicateCashflow() {
    startTransition(async () => {
      const result = await duplicateCashflow(cashflow.id)
      if (result.error) {
        toast.error(result.error)
      } else if (result.id) {
        toast.success('Cashflow duplicated!')
        router.push(`/cashflow/${result.id}`)
      }
    })
  }

  async function handleDeleteEntry(entryId: string) {
    setIsDeletingEntryId(entryId)
    try {
      const result = await deleteEntry(entryId)
      if (result.error) {
        toast.error('Failed to delete entry')
      } else {
        setLocalEntries((prev) => prev.filter((e) => e.id !== entryId))
        toast.success('Entry deleted')
      }
    } catch {
      toast.error('Failed to delete entry')
    } finally {
      setDeletingEntryId(null)
      setIsDeletingEntryId(null)
    }
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

  function handleEntrySuccess(savedEntry?: CashflowEntryDTO | null) {
    if (savedEntry) {
      setLocalEntries((prev) => {
        const exists = prev.some((e) => e.id === savedEntry.id)
        if (exists) {
          return prev.map((e) => (e.id === savedEntry.id ? savedEntry : e))
        }
        return [savedEntry, ...prev]
      })
    }
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
      e.description,
      e.amount,
      currency || '',
      e.is_recurring ? 'Yes' : 'No',
      e.recurrence_interval || '',
    ])

    const csvContent = [
      headers.map(escapeCsvField).join(','),
      ...rows.map((row) => row.map(escapeCsvField).join(',')),
    ].join('\r\n')

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
      {/* Header Section */}
      <div className='space-y-1.5 sm:space-y-2'>
        <BreadcrumbNav title={cashflow.title} />

        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full'>
          <div className='min-w-0 flex-1'>
            <div className='flex items-start sm:items-center justify-between gap-2 sm:gap-3'>
              <div className='flex items-baseline sm:items-center gap-2 flex-wrap min-w-0'>
                <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground wrap-break-word'>
                  {cashflow.title}
                </h1>
                {!isOwner && (
                  <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full shrink-0 align-middle'>
                    {userRole === 'edit' ? 'Editor Access' : 'View Only'}
                  </span>
                )}
              </div>

              {/* Mobile Actions (Kebab Menu) */}
              <div className='flex sm:hidden items-center gap-1 shrink-0'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-9 w-9 shrink-0'
                      aria-label='More options'
                    >
                      <LuEllipsisVertical className='w-5 h-5' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    {isOwner && (
                      <DropdownMenuItem
                        className='cursor-pointer'
                        onClick={() => setIsShareModalOpen(true)}
                      >
                        <LuShare2 className='w-4 h-4 mr-2' />
                        Share
                      </DropdownMenuItem>
                    )}
                    {isOwner && (
                      <DropdownMenuItem
                        className='cursor-pointer'
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        <LuPencil className='w-4 h-4 mr-2' />
                        Rename
                      </DropdownMenuItem>
                    )}
                    {(isOwner || canEdit) && (
                      <DropdownMenuItem
                        className='cursor-pointer'
                        onClick={handleDuplicateCashflow}
                      >
                        <LuCopy className='w-4 h-4 mr-2' />
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    {canEdit && (
                      <DropdownMenuItem
                        className='cursor-pointer'
                        onClick={() => setIsImportModalOpen(true)}
                      >
                        <LuImport className='w-4 h-4 mr-2' />
                        Import CSV
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className='cursor-pointer'
                      onClick={() => setIsReportModalOpen(true)}
                    >
                      <LuFileText className='w-4 h-4 mr-2' />
                      Financial Report
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='cursor-pointer'
                      onClick={handleExportCSV}
                    >
                      <LuCloudDownload className='w-4 h-4 mr-2' />
                      Download CSV
                    </DropdownMenuItem>
                    {!isOwner &&
                      currentUserId &&
                      (cashflow.is_public || !!shareId) && (
                        <DropdownMenuItem
                          className='cursor-pointer'
                          onClick={handleBookmark}
                        >
                          {hasShare ? (
                            <>
                              <LuCheck className='w-4 h-4 mr-2 text-emerald-600' />
                              <span>Saved to Dashboard</span>
                            </>
                          ) : (
                            <>
                              <LuBookmark className='w-4 h-4 mr-2' />
                              <span>Add to Dashboard</span>
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                    {isOwner && (
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
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <p className='text-muted-foreground text-sm mt-0.5'>
              {filterState.preset !== 'all-time'
                ? `${filteredEntries.length} of ${entries.length} entries`
                : `${entries.length} entries`}
            </p>
          </div>

          {/* Desktop Actions & Kebab Menu */}
          <div className='hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto'>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-9 w-9 shrink-0'
                    aria-label='More options'
                  >
                    <LuEllipsisVertical className='w-4 h-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
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
                    className='cursor-pointer'
                    onClick={handleDuplicateCashflow}
                  >
                    <LuCopy className='w-4 h-4 mr-2' />
                    Duplicate
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

            {canEdit && (
              <Button
                variant='outline'
                onClick={() => setIsImportModalOpen(true)}
                className='gap-1.5 h-9 px-2.5 sm:px-3 text-xs sm:text-sm'
                title='Import CSV'
              >
                <LuImport className='w-4 h-4' />
                <span className='hidden md:inline'>Import CSV</span>
              </Button>
            )}

            <Button
              variant='outline'
              onClick={() => setIsReportModalOpen(true)}
              className='gap-1.5 h-9 px-2.5 sm:px-3 text-xs sm:text-sm'
              title='Financial Report & Statement'
            >
              <LuFileText className='w-4 h-4' />
              <span className='hidden md:inline'>Financial Report</span>
            </Button>

            <Button
              variant='outline'
              onClick={handleExportCSV}
              className='gap-1.5 h-9 px-2.5 sm:px-3 text-xs sm:text-sm'
              title='Download CSV'
            >
              <LuCloudDownload className='w-4 h-4' />
              <span className='hidden md:inline'>Download CSV</span>
            </Button>

            {!isOwner && currentUserId && (cashflow.is_public || !!shareId) && (
              <Button
                onClick={handleBookmark}
                variant={hasShare ? 'secondary' : 'outline'}
                className={`gap-1.5 h-9 px-2.5 sm:px-3 text-xs sm:text-sm ${hasShare ? 'text-green-600' : ''}`}
                disabled={isPending}
              >
                {isPending ? (
                  <LuLoader className='w-4 h-4 animate-spin' />
                ) : hasShare ? (
                  <LuCheck className='w-4 h-4' />
                ) : (
                  <LuBookmark className='w-4 h-4' />
                )}
                <span>{hasShare ? 'Saved' : 'Add to Dashboard'}</span>
              </Button>
            )}

            {canEdit && (
              <Button
                onClick={openAddEntry}
                className='gap-1.5 h-9 px-3 text-sm font-semibold'
              >
                <LuPlus className='w-4 h-4' />
                <span>Add Entry</span>
              </Button>
            )}
          </div>

          {/* Mobile Primary Action Button */}
          {canEdit && (
            <div className='sm:hidden w-full pt-1'>
              <Button
                onClick={openAddEntry}
                className='w-full gap-2 h-10 text-sm font-semibold shadow-xs'
              >
                <LuPlus className='w-4 h-4' />
                <span>Add Entry</span>
              </Button>
            </div>
          )}
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
          <div
            suppressHydrationWarning
            className='bg-emerald-50/30 border border-emerald-200/30 dark:bg-emerald-950/10 dark:border-emerald-800/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4'
          >
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

      {/* Summary Stats Bar */}
      <CashflowSummaryStats
        income={income}
        expense={expense}
        balance={balance}
        currency={currency}
      />

      {/* Entries Table & Filter Card */}
      <div className='bg-card border rounded-xl overflow-hidden relative'>
        {isPending && (
          <div className='absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center z-10 transition-all duration-200'>
            <div className='flex items-center gap-2 bg-background border px-4 py-2 rounded-lg shadow-sm'>
              <LuLoader className='w-4 h-4 animate-spin text-primary' />
              <span className='text-sm font-medium'>Updating data...</span>
            </div>
          </div>
        )}

        {/* Toolbar Header (inside the Card) */}
        {localEntries.length > 0 && (
          <div className='border-b border-border/60 flex flex-col bg-muted/15'>
            {/* Main Controls Section */}
            <div className='p-3 sm:p-4 flex flex-col gap-3'>
              {/* Main Toolbar Row */}
              <div className='flex flex-col lg:flex-row lg:items-center gap-0 lg:gap-3 w-full'>
                {/* Search Input & Mobile Filter Toggle */}
                <div className='flex items-center gap-2 w-full lg:flex-1 min-w-50'>
                  <div className='relative flex items-center flex-1'>
                    <LuSearch className='absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none' />
                    <Input
                      placeholder='Search entries...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='pl-9 pr-9 bg-card w-full h-9 text-xs sm:text-sm rounded-lg'
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className='absolute right-2.5 p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs cursor-pointer'
                        aria-label='Clear search'
                      >
                        <LuX className='w-4 h-4' />
                      </button>
                    )}
                  </div>

                  {/* Mobile Filter Toggle Button */}
                  <Button
                    variant={activeFilterCount > 0 ? 'secondary' : 'outline'}
                    size='sm'
                    onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
                    className={cn(
                      'h-9 px-3 gap-1.5 shrink-0 lg:hidden text-xs font-medium cursor-pointer rounded-lg',
                      activeFilterCount > 0 &&
                        'border-primary/50 text-primary font-semibold',
                    )}
                    aria-expanded={isMobileFiltersOpen}
                    aria-label='Toggle filters'
                  >
                    <LuSlidersHorizontal className='w-3.5 h-3.5' />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className='inline-flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full'>
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </div>

                {/* Select Dropdowns Wrapper (Date, Type, Category, Sort, Reset) with Coordinated Grid & Opacity Transition */}
                <div
                  className={cn(
                    'w-full lg:w-auto shrink-0 grid lg:flex items-start lg:items-center transition-[grid-template-rows,opacity,visibility] duration-200 ease-out',
                    isMobileFiltersOpen
                      ? 'grid-rows-[1fr] opacity-100 pointer-events-auto visible'
                      : 'grid-rows-[0fr] opacity-0 pointer-events-none invisible lg:grid-rows-[1fr] lg:opacity-100 lg:pointer-events-auto lg:visible',
                  )}
                >
                  <div
                    className={cn(
                      'min-h-0 overflow-hidden w-full lg:overflow-visible flex flex-col gap-2.5 transition-all duration-200 ease-out',
                      isMobileFiltersOpen
                        ? 'pt-2.5 lg:pt-0 opacity-100'
                        : 'pt-0 opacity-0 lg:opacity-100',
                    )}
                  >
                    {/* Dropdowns Row / Grid */}
                    <div className='flex flex-col lg:flex-row lg:items-center gap-2'>
                      <div
                        className={cn(
                          'grid gap-2 w-full lg:flex lg:w-auto lg:items-center',
                          uniqueCategories.length > 0
                            ? 'grid-cols-2 sm:grid-cols-4'
                            : 'grid-cols-2 sm:grid-cols-3',
                        )}
                      >
                        {/* Date Filter */}
                        <div className='w-full lg:w-36 xl:w-40'>
                          <DateFilter
                            state={filterState}
                            onChange={setFilterState}
                            filteredCount={filteredEntries.length}
                            totalCount={localEntries.length}
                          />
                        </div>

                        {/* Type Dropdown */}
                        <div className='w-full lg:w-28 xl:w-32'>
                          <Select
                            value={selectedType}
                            onValueChange={(v) => {
                              if (
                                v === 'all' ||
                                v === 'income' ||
                                v === 'expense'
                              ) {
                                setSelectedType(v)
                              }
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                'bg-card w-full h-9 text-xs sm:text-sm whitespace-nowrap transition-colors rounded-lg',
                                selectedType !== 'all' &&
                                  'border-primary/60 bg-primary/5 text-primary [&>svg]:text-primary font-medium shadow-xs',
                              )}
                            >
                              <SelectValue placeholder='Type' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='all'>All Types</SelectItem>
                              <SelectItem value='income'>Income</SelectItem>
                              <SelectItem value='expense'>Expense</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Category Dropdown */}
                        {uniqueCategories.length > 0 && (
                          <div className='w-full lg:w-36 xl:w-40'>
                            <Select
                              value={selectedCategory}
                              onValueChange={setSelectedCategory}
                            >
                              <SelectTrigger
                                className={cn(
                                  'bg-card w-full h-9 text-xs sm:text-sm whitespace-nowrap transition-colors rounded-lg',
                                  selectedCategory !== 'all' &&
                                    'border-primary/60 bg-primary/5 text-primary [&>svg]:text-primary font-medium shadow-xs',
                                )}
                              >
                                <SelectValue placeholder='Category' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='all'>
                                  All Categories
                                </SelectItem>
                                {uniqueCategories.map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Sort Dropdown */}
                        <div className='w-full lg:w-32 xl:w-36'>
                          <Select
                            value={sortBy}
                            onValueChange={(v) => {
                              if (isCashflowSortOption(v)) {
                                setSortBy(v)
                              }
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                'bg-card w-full h-9 text-xs sm:text-sm whitespace-nowrap transition-colors rounded-lg',
                                sortBy !== 'date-desc' &&
                                  'border-primary/60 bg-primary/5 text-primary [&>svg]:text-primary font-medium shadow-xs',
                              )}
                              aria-label='Sort entries'
                            >
                              <SelectValue placeholder='Sort by' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='date-desc'>
                                <span className='flex items-center gap-1.5 whitespace-nowrap'>
                                  <span>Date</span>
                                  <LuArrowDown className='w-3.5 h-3.5 text-current shrink-0' />
                                </span>
                              </SelectItem>
                              <SelectItem value='date-asc'>
                                <span className='flex items-center gap-1.5 whitespace-nowrap'>
                                  <span>Date</span>
                                  <LuArrowUp className='w-3.5 h-3.5 text-current shrink-0' />
                                </span>
                              </SelectItem>
                              <SelectItem value='created-desc'>
                                <span className='flex items-center gap-1.5 whitespace-nowrap'>
                                  <span>Created</span>
                                  <LuArrowDown className='w-3.5 h-3.5 text-current shrink-0' />
                                </span>
                              </SelectItem>
                              <SelectItem value='created-asc'>
                                <span className='flex items-center gap-1.5 whitespace-nowrap'>
                                  <span>Created</span>
                                  <LuArrowUp className='w-3.5 h-3.5 text-current shrink-0' />
                                </span>
                              </SelectItem>
                              <SelectItem value='amount-desc'>
                                <span className='flex items-center gap-1.5 whitespace-nowrap'>
                                  <span>Amount</span>
                                  <LuArrowDown className='w-3.5 h-3.5 text-current shrink-0' />
                                </span>
                              </SelectItem>
                              <SelectItem value='amount-asc'>
                                <span className='flex items-center gap-1.5 whitespace-nowrap'>
                                  <span>Amount</span>
                                  <LuArrowUp className='w-3.5 h-3.5 text-current shrink-0' />
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Desktop Inline Reset Button */}
                      {hasActiveFilters && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={clearAllFilters}
                          className='hidden lg:inline-flex h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 shrink-0 whitespace-nowrap rounded-lg cursor-pointer'
                          title='Reset all active filters'
                        >
                          <LuRotateCcw className='w-3.5 h-3.5' />
                          <span>Reset</span>
                        </Button>
                      )}
                    </div>

                    {/* Mobile Custom Date Range & Reset Row */}
                    {(filterState.preset === 'custom' || hasActiveFilters) && (
                      <div className='lg:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-0.5 w-full'>
                        <DateFilterCustomRange
                          state={filterState}
                          onChange={setFilterState}
                        />

                        {/* Mobile Drawer Compact Reset Button */}
                        {hasActiveFilters && (
                          <div className='flex items-center justify-end w-full sm:w-auto ml-auto shrink-0 sm:self-center'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={clearAllFilters}
                              className='h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5 rounded-lg cursor-pointer'
                            >
                              <LuRotateCcw className='w-3.5 h-3.5' />
                              <span>Reset</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Custom Date Range Picker (rendered as sleek sub-row) */}
              {filterState.preset === 'custom' && (
                <div className='hidden lg:block'>
                  <DateFilterCustomRange
                    state={filterState}
                    onChange={setFilterState}
                  />
                </div>
              )}

              {/* Active Filters Summary Strip on Mobile (when filters are collapsed and active) */}
              {!isMobileFiltersOpen && activeFilterCount > 0 && (
                <div className='flex lg:hidden items-center justify-between gap-2 pt-1 border-t border-border/30'>
                  <p className='text-xs text-muted-foreground truncate'>
                    <span className='font-medium text-foreground'>
                      {filteredEntries.length}
                    </span>{' '}
                    of {localEntries.length} entries matching {activeFilterCount}{' '}
                    {activeFilterCount === 1 ? 'filter' : 'filters'}
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className='text-xs text-primary font-medium hover:underline shrink-0 cursor-pointer'
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Row 2: Tag Filter Strip */}
            {allUniqueTags.length > 0 && (
              <div className='flex flex-wrap items-center gap-1.5 px-3 sm:px-4 py-2.5 border-t border-border/40 bg-muted/10'>
                <span className='text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1 shrink-0'>
                  <LuTag className='w-3.5 h-3.5' /> Tags:
                </span>
                {allUniqueTags.map((tag) => {
                  const isActive = selectedTags.includes(tag)
                  const tagColor = resolveTagColor(tag, tags)
                  return (
                    <div
                      key={tag}
                      className={cn(
                        'group inline-flex items-center min-h-7 sm:min-h-6 rounded-md text-xs border leading-none transition-all duration-200 select-none',
                        isActive
                          ? cn(
                              tagColor.activeBg,
                              tagColor.activeText,
                              tagColor.activeBorder,
                              'shadow-xs ring-1 ring-black/10 dark:ring-white/20 scale-[1.02]',
                            )
                          : cn(
                              tagColor.bg,
                              tagColor.text,
                              tagColor.border,
                              'shadow-2xs font-medium hover:opacity-85',
                            ),
                      )}
                    >
                      <button
                        type='button'
                        aria-pressed={isActive}
                        onClick={() => {
                          setSelectedTags((prev) =>
                            isActive
                              ? prev.filter((t) => t !== tag)
                              : [...prev, tag],
                          )
                        }}
                        className='inline-flex items-center px-2.5 py-1 cursor-pointer focus-visible:outline-none'
                      >
                        {isActive && (
                          <LuCheck className='w-3 h-3 mr-1 shrink-0 animate-in fade-in zoom-in-75 duration-150' />
                        )}
                        <span className='shrink-0'>#{tag}</span>
                      </button>
                      {canEdit && (
                        <span className='inline-flex items-center max-w-0 opacity-0 overflow-hidden group-hover:max-w-6 group-hover:opacity-100 group-hover:pr-1.5 group-focus-within:max-w-6 group-focus-within:opacity-100 group-focus-within:pr-1.5 transition-all duration-150 shrink-0'>
                          <button
                            type='button'
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setManagingTag(tag)
                              setIsManageTagOpen(true)
                            }}
                            aria-label={`Manage tag ${tag}`}
                            className={cn(
                              'p-0.5 focus-visible:outline-none rounded-xs cursor-pointer inline-flex items-center justify-center hover:scale-110 transition-transform',
                              isActive
                                ? 'text-inherit opacity-85 hover:opacity-100'
                                : 'opacity-70 hover:opacity-100',
                            )}
                            title='Rename or delete tag'
                          >
                            <LuPencil className='w-3 h-3' />
                          </button>
                        </span>
                      )}
                    </div>
                  )
                })}
                {selectedTags.length > 0 && (
                  <button
                    type='button'
                    onClick={() => setSelectedTags([])}
                    className='text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1.5 py-1 cursor-pointer'
                  >
                    Reset tags
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {filteredEntries.length === 0 ? (
          <div className='p-12 text-center text-muted-foreground'>
            <p className='text-sm mb-4'>
              {localEntries.length === 0
                ? 'No entries yet. Add your first transaction.'
                : hasActiveFilters
                  ? 'No entries match your filters.'
                  : 'No entries match the selected date range.'}
            </p>
            {localEntries.length === 0 ? (
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
                      <TableHead className='text-right border-r border-border/40'>
                        Amount
                      </TableHead>
                      <TableHead className='w-36 border-r border-border/40'>
                        Created
                      </TableHead>
                      <TableHead className='w-20'></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody
                    data-slot='table-body'
                    className='[&_tr:last-child]:border-0'
                  >
                    {paginatedEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className='text-muted-foreground text-sm border-r border-border/30 text-nowrap'>
                          {formatAppDate(entry.date)}
                        </TableCell>
                        <TableCell className='border-r border-border/30'>
                          <EntryTypeBadge type={entry.type} />
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span className='font-medium'>
                              {entry.description}
                            </span>
                            <EntryMetadataBadges
                              entry={entry}
                              currency={currency}
                              bookTags={tags}
                              availableTags={allUniqueTags}
                              onViewReceipt={(e) => setViewingReceiptEntry(e)}
                            />
                          </div>
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium text-nowrap border-r border-border/30 ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {entry.type === 'income' ? '+' : '-'}
                          {formatCurrencyCompact(
                            Number(entry.amount),
                            currency,
                          )}
                        </TableCell>
                        <TableCell className='text-muted-foreground text-xs border-r border-border/30 text-nowrap'>
                          {entry.created_at ? (
                            <time
                              dateTime={entry.created_at}
                              suppressHydrationWarning
                            >
                              {format(
                                new Date(entry.created_at),
                                'dd MMM yyyy, HH:mm',
                              )}
                            </time>
                          ) : (
                            <span className='text-muted-foreground/50'>—</span>
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
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className='md:hidden'>
                <div key={currentPage} className='divide-y divide-border'>
                  {paginatedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className='flex items-stretch justify-between transition-colors hover:bg-muted/10'
                    >
                      <div className='flex-1 p-3.5 sm:p-4 min-w-0 flex items-center justify-between gap-3'>
                        <div className='space-y-1.5 min-w-0 flex-1'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span className='text-xs text-muted-foreground font-medium'>
                              {formatAppDate(entry.date)}
                            </span>
                            {entry.created_at && (
                              <time
                                dateTime={entry.created_at}
                                suppressHydrationWarning
                                className='text-[10px] text-muted-foreground/70'
                                title={`Created: ${new Date(entry.created_at).toLocaleString()}`}
                              >
                                (Created{' '}
                                {format(
                                  new Date(entry.created_at),
                                  'dd MMM, HH:mm',
                                )}
                                )
                              </time>
                            )}
                            <EntryTypeBadge type={entry.type} />
                          </div>
                          {/* Row 2: Unobstructed Entry Description */}
                          <p className='font-semibold text-sm leading-snug text-foreground wrap-break-word'>
                            {entry.description}
                          </p>

                          {/* Row 3: Metadata Badges (Category, Split items, Receipt, Tags) */}
                          <div className='pt-0.5'>
                            <EntryMetadataBadges
                              entry={entry}
                              currency={currency}
                              bookTags={tags}
                              availableTags={allUniqueTags}
                              onViewReceipt={(e) => setViewingReceiptEntry(e)}
                            />
                          </div>
                        </div>

                        <div
                          className={`font-bold text-sm tabular-nums shrink-0 text-right ${entry.type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}
                        >
                          {entry.type === 'income' ? '+' : '-'}
                          {formatCurrencyCompact(
                            Number(entry.amount),
                            currency,
                          )}
                        </div>
                      </div>

                      {canEdit && (
                        <div className='flex flex-col items-center justify-center gap-2 border-l border-border/50 px-2 sm:px-2.5 shrink-0 bg-muted/5'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-9 w-9 rounded-md'
                            onClick={() => openEditEntry(entry)}
                            aria-label={`Edit entry ${entry.description}`}
                          >
                            <LuPencil className='w-4 h-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-9 w-9 rounded-md text-destructive hover:bg-destructive/10'
                            onClick={() => {
                              setIsDeletingEntryId(null)
                              setDeletingEntryId(entry.id)
                            }}
                            aria-label={`Delete entry ${entry.description}`}
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
                  ))}
                </div>
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

      {/* Projections View — always uses unfiltered entries (recurring logic is time-aware) */}
      <ProjectionsView entries={localEntries} currency={currency} />

      {/* Charts */}
      <CashflowCharts entries={filteredEntries} currency={currency} />

      {/* Budget Tracker */}
      <BudgetManager
        cashflowId={cashflow.id}
        budgets={budgets}
        entries={localEntries}
        currency={currency}
        canEdit={canEdit}
      />

      {/* Savings Goals */}
      <GoalCard
        cashflowId={cashflow.id}
        goals={goals.filter((goal) => goal.cashflow_id === cashflow.id)}
        currency={currency}
        isOwner={isOwner}
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
        goals={goals}
        availableTags={allUniqueTags}
        bookTags={tags}
      />

      {/* Import CSV Modal */}
      <ImportCsvModal
        cashflowId={cashflow.id}
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        currency={currency}
        onSuccess={handleEntrySuccess}
      />

      {/* Manage Tag Modal */}
      <ManageTagModal
        cashflowId={cashflow.id}
        tag={managingTag}
        open={isManageTagOpen}
        onOpenChange={setIsManageTagOpen}
        onSuccess={handleEntrySuccess}
        bookTags={tags}
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
      {/* Receipt Lightbox Modal */}
      <ReceiptLightbox
        open={!!viewingReceiptEntry}
        onOpenChange={(open) => {
          if (!open) setViewingReceiptEntry(null)
        }}
        cashflowId={cashflow.id}
        entryId={viewingReceiptEntry?.id ?? null}
        description={viewingReceiptEntry?.description}
        date={viewingReceiptEntry?.date}
        amount={
          viewingReceiptEntry ? Number(viewingReceiptEntry.amount) : undefined
        }
        currency={currency}
      />
      {/* Financial Report & Statement Modal */}
      <FinancialReportModal
        cashflow={cashflow}
        entries={localEntries}
        currency={currency}
        activeFilterState={filterState}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  )
}
