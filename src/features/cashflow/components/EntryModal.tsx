'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  ModalHeader,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  LuLoader,
  LuFileText,
  LuRepeat,
  LuListPlus,
  LuPaperclip,
  LuSparkles,
  LuScanLine,
  LuCamera,
  LuImage,
  LuChevronDown,
} from 'react-icons/lu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ImageAttachmentInput from './ImageAttachmentInput'
import { toast } from 'react-toastify'
import { addEntry, updateEntry, getReceiptSignedUrl } from '../actions'
import type {
  CashflowEntryDTO,
  CashflowGoalDTO,
  CashflowTagDTO,
} from '@/types/dto'
import { CURRENCIES, formatCurrency, getCurrencySymbol } from '@/lib/currency'
import {
  convertCurrencyAmount,
  updateExchangeRates,
  getCurrentRatesMatrix,
} from '../lib/exchange-rates'
import * as z from 'zod/mini'
import { entryTypeSchema, entryCategorySchema } from '../schemas.client'
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  formatCategoryName,
  isTagDuplicateOfCategory,
} from '../constants'
import { resolveMerchantCategory } from '../lib/merchant-rules'
import { extractReceiptData } from '../lib/receipt-extractor'
import PurchaseBreakdownEditor, {
  type SplitItemInput,
} from './PurchaseBreakdownEditor'
import { TagPicker } from './TagPicker'
import { cn } from '@/lib/utils'
import {
  compressImageToWebP,
  isSupportedImageFile,
} from '../lib/image-compression'
import ReceiptLightbox from './ReceiptLightbox'
import { getTodayDateOnlyString } from '@/lib/date-only'

function mergeTagsWithoutPluralDuplicates(
  existing: string[],
  incoming: string[],
  category?: string | null,
): string[] {
  const result = [...existing]
  for (const tag of incoming) {
    const trimmed = tag.trim().replace(/^#/, '')
    if (!trimmed) continue
    if (category && isTagDuplicateOfCategory(trimmed, category)) continue
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
    const lower = formatted.toLowerCase()
    const isDuplicate = result.some((curr) => {
      const currLower = curr.toLowerCase()
      return (
        currLower === lower ||
        currLower === `${lower}s` ||
        `${currLower}s` === lower
      )
    })
    if (!isDuplicate) {
      result.push(formatted)
    }
  }
  return result
}

interface EntryModalProps {
  cashflowId: string
  entry?: CashflowEntryDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currency: string | null
  onSuccess?: (entry?: CashflowEntryDTO | null) => void
  goals?: CashflowGoalDTO[]
  availableTags?: string[]
  bookTags?: CashflowTagDTO[]
  recentEntries?: CashflowEntryDTO[]
}

export default function EntryModal({
  cashflowId,
  entry = null,
  open,
  onOpenChange,
  currency,
  onSuccess,
  goals = [],
  availableTags = [],
  bookTags = [],
  recentEntries = [],
}: EntryModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = getTodayDateOnlyString()
  const entryGoal = entry?.goal_id
    ? goals.find((goal) => goal.id === entry.goal_id)
    : undefined
  const entryCategory = entryGoal
    ? `${entryGoal.type === 'debt' ? 'Debt:' : entryGoal.type === 'lent' ? 'Lent:' : 'Goal:'} ${entryGoal.title}`
    : entryCategorySchema.parse(entry?.category)

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevEntry, setPrevEntry] = useState(entry)

  const [description, setDescription] = useState(entry?.description || '')
  const [amount, setAmount] = useState(
    entry?.original_amount !== null && entry?.original_amount !== undefined
      ? entry.original_amount.toString()
      : entry?.amount?.toString() || '',
  )
  const [entryCurrency, setEntryCurrency] = useState<string>(
    entry?.original_currency || currency || 'USD',
  )
  const [type, setType] = useState<'income' | 'expense'>(
    entryTypeSchema.parse(entry?.type),
  )
  const [category, setCategory] = useState<string | null>(entryCategory)
  const [goalId, setGoalId] = useState<string | null>(entry?.goal_id ?? null)
  const [date, setDate] = useState(entry?.date || today)
  const [isRecurring, setIsRecurring] = useState(entry?.is_recurring || false)
  const [updateRecurringRule, setUpdateRecurringRule] = useState(false)
  const [recurrenceInterval, setRecurrenceInterval] = useState<
    'monthly' | 'yearly'
  >(entry?.recurrence_interval || 'monthly')
  const [yearlyCalculation, setYearlyCalculation] = useState<
    'prorated' | 'exact'
  >(entry?.yearly_calculation || 'prorated')
  const [tags, setTags] = useState<string[]>(entry?.tags ?? [])
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(
    null,
  )
  const [receiptAction, setReceiptAction] = useState<
    'keep' | 'remove' | 'upload'
  >('keep')
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(
    entry?.receipt_url ?? null,
  )
  const [existingSignedUrl, setExistingSignedUrl] = useState<string | null>(
    null,
  )
  const [isLoadingExistingThumbnail, setIsLoadingExistingThumbnail] =
    useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isExtractingReceipt, setIsExtractingReceipt] = useState(false)
  const [ocrStatus, setOcrStatus] = useState<string | null>(null)
  const [lastScannedFile, setLastScannedFile] = useState<File | null>(null)
  const receiptCameraScanRef = useRef<HTMLInputElement>(null)
  const receiptGalleryScanRef = useRef<HTMLInputElement>(null)
  const isAiScanRef = useRef(false)

  const merchantMatch = useMemo(() => {
    return resolveMerchantCategory(description, type, recentEntries)
  }, [description, type, recentEntries])

  // Auto-apply category and tags when merchant is recognized (same behavior as /quick)
  const isEdit = Boolean(entry)
  const initialDescRef = useRef(entry?.description)
  useEffect(() => {
    if (open) {
      initialDescRef.current = entry?.description
    }
  }, [open, entry?.description])

  useEffect(() => {
    if (!merchantMatch || !merchantMatch.category || goalId) return
    // If description was set by an AI receipt scan, suppress local heuristics completely
    if (isAiScanRef.current) {
      isAiScanRef.current = false
      return
    }
    // If editing an existing entry, only auto-apply if user actually changed the description
    if (isEdit && description === initialDescRef.current) return

    setCategory(merchantMatch.category)
    if (merchantMatch.suggestedTags && merchantMatch.suggestedTags.length > 0) {
      setTags((prev) =>
        mergeTagsWithoutPluralDuplicates(
          prev,
          merchantMatch.suggestedTags!,
          merchantMatch.category,
        ),
      )
    }
  }, [merchantMatch, goalId, isEdit, description])

  const initialItems: SplitItemInput[] =
    entry?.items && entry.items.length > 0
      ? entry.items.map((item) => ({
          id: item.id,
          itemName: item.item_name,
          category: item.category || 'General',
          amount: item.amount.toString(),
        }))
      : []

  const [isSplit, setIsSplit] = useState(initialItems.length > 0)
  const [splitItems, setSplitItems] = useState<SplitItemInput[]>(initialItems)

  const activeGoals = goals.filter((goal) => !goal.is_archived)

  const isArchivedGoal = Boolean(
    entry?.goal_id &&
    entry.goal_id === goalId &&
    (!entryGoal || Boolean(entryGoal.is_archived)),
  )

  const isEntryChanged =
    entry?.id !== prevEntry?.id ||
    (entry === null && prevEntry !== null) ||
    (entry !== null && prevEntry === null)

  if (open !== prevOpen || isEntryChanged) {
    setPrevOpen(open)
    setPrevEntry(entry)
    setLastScannedFile(null)
    if (open) {
      setDescription(entry?.description || '')
      setAmount(
        entry?.original_amount !== null && entry?.original_amount !== undefined
          ? entry.original_amount.toString()
          : entry?.amount?.toString() || '',
      )
      setEntryCurrency(entry?.original_currency || currency || 'USD')
      setType(entryTypeSchema.parse(entry?.type))
      setCategory(entryCategory)
      setGoalId(entry?.goal_id ?? null)
      setDate(entry?.date || today)
      setIsRecurring(entry?.is_recurring || false)
      setUpdateRecurringRule(false)
      setRecurrenceInterval(entry?.recurrence_interval || 'monthly')
      setYearlyCalculation(entry?.yearly_calculation || 'prorated')

      const items: SplitItemInput[] =
        entry?.items && entry.items.length > 0
          ? entry.items.map((item) => ({
              id: item.id,
              itemName: item.item_name,
              category: item.category || 'General',
              amount: item.amount.toString(),
            }))
          : []
      setIsSplit(items.length > 0)
      setSplitItems(items)
      setTags(entry?.tags ?? [])
      setReceiptFile(null)
      if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl)
      setReceiptPreviewUrl(null)
      setReceiptAction('keep')
      setExistingReceiptUrl(entry?.receipt_url ?? null)
      setExistingSignedUrl(null)
      setIsLightboxOpen(false)
      setError(null)
      setIsLoading(false)
    }
  }

  // Live daily currency exchange rates
  const [liveRatesInfo, setLiveRatesInfo] = useState<{
    isLive: boolean
    date?: string
  } | null>(null)

  useEffect(() => {
    let isMounted = true
    fetch('/api/exchange-rates')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.rates) {
          updateExchangeRates(data.rates)
          setLiveRatesInfo({ isLive: data.isLive, date: data.date })
        }
      })
      .catch(() => {
        // Silently use in-memory fallback matrix
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Live currency conversion calculation
  const isForeignCurrency = entryCurrency !== (currency || 'USD')
  const numAmount = parseFloat(amount) || 0
  const conversion = useMemo(() => {
    if (!isForeignCurrency || numAmount <= 0) return null
    const matrix = liveRatesInfo?.isLive ? getCurrentRatesMatrix() : undefined
    return convertCurrencyAmount(
      numAmount,
      entryCurrency,
      currency,
      undefined,
      matrix,
    )
  }, [isForeignCurrency, numAmount, entryCurrency, currency, liveRatesInfo])

  // Fetch signed URL for thumbnail preview when editing an entry with an existing receipt
  useEffect(() => {
    if (!open || !entry?.id || !entry?.receipt_url) {
      setExistingSignedUrl(null)
      return
    }
    let isMounted = true
    setIsLoadingExistingThumbnail(true)
    getReceiptSignedUrl(cashflowId, entry.id)
      .then((res) => {
        if (isMounted && res.signedUrl) {
          setExistingSignedUrl(res.signedUrl)
        }
      })
      .catch(() => {
        // Silently fall back to icon
      })
      .finally(() => {
        if (isMounted) setIsLoadingExistingThumbnail(false)
      })
    return () => {
      isMounted = false
    }
  }, [open, entry?.id, entry?.receipt_url, cashflowId])

  const handleFileSelect = (file: File) => {
    if (!isSupportedImageFile(file)) {
      toast.error('Only image files (JPG, PNG, WebP) are supported')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Image is too large (max 25MB before compression)')
      return
    }
    if (receiptPreviewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl)
    }

    setReceiptFile(file)
    setReceiptAction('upload')
    const preview = URL.createObjectURL(file)
    setReceiptPreviewUrl(preview)
  }

  const handleQuickScanReceipt = async (file: File) => {
    if (!isSupportedImageFile(file)) {
      toast.error('Only image files (JPG, PNG, WebP) are supported')
      return
    }
    setIsExtractingReceipt(true)
    setOcrStatus('Scanning receipt...')
    try {
      const extracted = await extractReceiptData(file, (_, status) => {
        setOcrStatus(status)
      })
      setLastScannedFile(file)
      if (extracted.amount !== null && !isSplit) {
        setAmount(extracted.amount.toString())
      }
      if (extracted.merchant) {
        isAiScanRef.current = true
        setDescription(extracted.merchant)
      }
      if (extracted.date) {
        setDate(extracted.date)
      }
      const targetCat = extracted.category || category
      if (extracted.category && !goalId) {
        setCategory(extracted.category)
      }
      if (extracted.suggestedTags && extracted.suggestedTags.length > 0) {
        setTags((prev) =>
          mergeTagsWithoutPluralDuplicates(
            prev,
            extracted.suggestedTags!,
            targetCat,
          ),
        )
      }
      toast.success(
        extracted.merchant || extracted.amount
          ? `Extracted: ${extracted.merchant || 'Receipt'} ${extracted.amount ? `(${extracted.amount})` : ''}`
          : 'Scanned receipt data successfully',
      )
    } catch (err) {
      setLastScannedFile(null)
      console.warn('Receipt extraction error:', err)
      toast.error('Could not extract receipt data. Please enter manually.')
    } finally {
      setIsExtractingReceipt(false)
      setOcrStatus(null)
    }
  }

  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false)

  const handleDownloadExistingReceipt = async () => {
    if (!entry?.id) return
    setIsDownloadingReceipt(true)
    try {
      const res = await getReceiptSignedUrl(cashflowId, entry.id)
      if (res.error || !res.signedUrl) {
        toast.error(res.error || 'Failed to access receipt')
        return
      }
      const response = await fetch(res.signedUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const sanitizedDesc = (description || 'receipt')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
      link.href = blobUrl
      const ext =
        blob.type === 'image/jpeg' || blob.type === 'image/jpg' ? 'jpg' : 'webp'
      link.download = `receipt-${date || 'entry'}-${sanitizedDesc || 'attachment'}.${ext}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch {
      toast.error('Failed to download receipt')
    } finally {
      setIsDownloadingReceipt(false)
    }
  }

  const handleSplitItemsChange = (newItems: SplitItemInput[]) => {
    setSplitItems(newItems)
    if (isSplit) {
      const sum = newItems.reduce(
        (acc, item) => acc + (parseFloat(item.amount) || 0),
        0,
      )
      setAmount(sum > 0 ? (Math.round(sum * 100) / 100).toFixed(2) : '')
    }
  }

  const handleSplitToggle = (checked: boolean) => {
    setIsSplit(checked)
    if (checked) {
      if (splitItems.length === 0) {
        const defaultItem: SplitItemInput = {
          id: crypto.randomUUID(),
          itemName: '',
          category: category || 'General',
          amount: amount || '',
        }
        const updated = [defaultItem]
        setSplitItems(updated)
        handleSplitItemsChange(updated)
      } else {
        handleSplitItemsChange(splitItems)
      }
    }
  }

  const isBusy = isLoading

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const baseAmount = conversion
      ? String(conversion.convertedAmount)
      : amount || '0'
    const formData = new FormData()
    formData.append('cashflowId', cashflowId)
    formData.append('description', description)
    formData.append('amount', baseAmount)
    formData.append('original_currency', entryCurrency)
    formData.append('original_amount', amount || '0')
    formData.append('exchange_rate', String(conversion?.effectiveRate || 1))
    formData.append('type', type)
    if (category) formData.append('category', category)
    if (goalId) formData.append('goalId', goalId)
    formData.append('date', date)
    formData.append('is_recurring', isRecurring.toString())
    if (entry?.recurring_rule_id) {
      formData.append('recurring_rule_id', entry.recurring_rule_id)
    }
    if (updateRecurringRule) {
      formData.append('update_recurring_rule', 'true')
    }
    if (isRecurring) formData.append('recurrence_interval', recurrenceInterval)
    if (isRecurring && recurrenceInterval === 'yearly') {
      formData.append('yearly_calculation', yearlyCalculation)
    }
    formData.append('receiptAction', receiptAction)

    if (receiptAction === 'upload' && receiptFile) {
      try {
        const compressedBlob = await compressImageToWebP(receiptFile, {
          maxDimension: 1600,
          quality: 0.8,
        })
        const ext = compressedBlob.type === 'image/webp' ? 'webp' : 'jpg'
        formData.append('receipt_file', compressedBlob, `receipt.${ext}`)
      } catch (err) {
        console.error('Client compression failed:', err)
        if (receiptFile.size <= 1024 * 1024) {
          formData.append('receipt_file', receiptFile)
        } else {
          const msg =
            'Could not compress image. Please choose a photo under 1MB.'
          setError(msg)
          toast.error(msg)
          setIsLoading(false)
          return
        }
      }
    }

    if (isSplit) {
      const validItems: {
        itemName: string
        category: string
        amount: number
      }[] = []

      for (let i = 0; i < splitItems.length; i++) {
        const item = splitItems[i]
        const hasName = item.itemName.trim().length > 0
        const parsedAmount = parseFloat(item.amount)
        const hasAmount = !isNaN(parsedAmount) && parsedAmount > 0

        if (hasName && !hasAmount) {
          const msg = `Please enter an amount for Item #${i + 1} ("${item.itemName.trim()}").`
          setError(msg)
          toast.error(msg)
          setIsLoading(false)
          return
        }

        if (!hasName && hasAmount) {
          const msg = `Please enter a name for Item #${i + 1}.`
          setError(msg)
          toast.error(msg)
          setIsLoading(false)
          return
        }

        if (hasName && hasAmount) {
          validItems.push({
            itemName: item.itemName.trim(),
            category: item.category,
            amount: parsedAmount,
          })
        }
      }

      if (validItems.length === 0 && splitItems.length > 0) {
        const msg =
          'Please add at least one item or turn off Transaction Breakdown.'
        setError(msg)
        toast.error(msg)
        setIsLoading(false)
        return
      }

      if (validItems.length > 0) {
        formData.append('itemsJson', JSON.stringify(validItems))
      }
    }

    if (tags.length > 0) {
      formData.append('tagsJson', JSON.stringify(tags))
    }

    try {
      let result
      if (isEdit && entry) {
        result = await updateEntry(entry.id, formData)
      } else {
        result = await addEntry(formData)
      }

      if (result?.error) {
        setError(result.error)
        toast.error(
          result.error ||
            (isEdit ? 'Failed to update entry' : 'Failed to add entry'),
        )
        setIsLoading(false)
      } else {
        toast.success(isEdit ? 'Entry updated!' : 'Entry added!')
        onOpenChange(false)
        onSuccess?.(result?.entry ?? null)
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(msg)
      toast.error(msg)
      setIsLoading(false)
    }
  }

  const selectedGoal = goals.find((goal) => goal.id === goalId)
  const categorySelectValue = isArchivedGoal
    ? 'archived-goal'
    : selectedGoal && !selectedGoal.is_archived
      ? `goal-${selectedGoal.id}`
      : category || 'uncategorized'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl max-h-[90vh] p-0 overflow-hidden flex flex-col'>
        <div className='p-4 sm:p-6 pb-0 sm:pb-0 shrink-0'>
          <ModalHeader
            title={isEdit ? 'Edit Entry' : 'Add Entry'}
            description={
              isEdit
                ? 'Update your transaction details.'
                : 'Add a new income or expense entry.'
            }
            onClose={() => onOpenChange(false)}
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className='@container w-full min-w-0 max-w-full p-4 sm:p-6 pt-3 sm:pt-4 space-y-4 overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar'
        >
          <div className='grid gap-4 w-full min-w-0 max-w-full'>
            {/* Quick-Extract from Receipt Banner (only shown when creating a new entry) */}
            {!isEdit && (
              <div className='p-3 rounded-xl border border-primary/25 bg-linear-to-r from-primary/5 via-primary/2 to-transparent flex flex-col @sm:flex-row items-stretch @sm:items-center justify-between gap-3 transition-colors w-full min-w-0'>
                <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                  <div className='w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                    <LuScanLine className='w-4 h-4' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-xs font-semibold text-foreground flex items-center gap-1.5 flex-wrap'>
                      <span>Quick-Extract with AI</span>
                      <span className='text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold shrink-0'>
                        Auto-Fill
                      </span>
                    </p>
                    <p className='text-[11px] text-muted-foreground leading-snug'>
                      Scan receipt to fill amount, merchant, date, category & tags
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      disabled={isExtractingReceipt}
                      className='h-8 text-xs px-3 gap-1.5 border-primary/30 hover:bg-primary/10 text-primary font-medium shrink-0 cursor-pointer shadow-xs w-full @sm:w-auto justify-center'
                    >
                      {isExtractingReceipt ? (
                        <>
                          <LuLoader className='w-3.5 h-3.5 animate-spin' />
                          <span className='truncate max-w-28'>
                            {ocrStatus || 'Scanning...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <LuScanLine className='w-3.5 h-3.5' />
                          <span>Scan Receipt</span>
                          <LuChevronDown className='w-3 h-3 opacity-60 ml-0.5' />
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    <DropdownMenuItem
                      onClick={() => receiptCameraScanRef.current?.click()}
                      className='cursor-pointer gap-2 py-2 text-xs'
                    >
                      <LuCamera className='w-4 h-4 text-primary shrink-0' />
                      <div className='flex flex-col'>
                        <span className='font-medium'>Take Photo</span>
                        <span className='text-[10px] text-muted-foreground'>
                          Use device camera
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => receiptGalleryScanRef.current?.click()}
                      className='cursor-pointer gap-2 py-2 text-xs'
                    >
                      <LuImage className='w-4 h-4 text-primary shrink-0' />
                      <div className='flex flex-col'>
                        <span className='font-medium'>Choose from Gallery</span>
                        <span className='text-[10px] text-muted-foreground'>
                          Upload existing photo
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <input
                  ref={receiptCameraScanRef}
                  type='file'
                  accept='image/*'
                  capture='environment'
                  className='hidden'
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleQuickScanReceipt(file)
                    }
                    e.target.value = ''
                  }}
                />
                <input
                  ref={receiptGalleryScanRef}
                  type='file'
                  accept='image/*,image/jpeg,image/png,image/webp,image/avif'
                  className='hidden'
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleQuickScanReceipt(file)
                    }
                    e.target.value = ''
                  }}
                />
              </div>
            )}

            {/* Description */}
            <div className='grid gap-2 w-full min-w-0'>
              <Label
                htmlFor='description'
                className='font-medium text-foreground/80 gap-0.5'
              >
                Description<span className='text-destructive'>*</span>
              </Label>
              <div className='relative w-full min-w-0'>
                <LuFileText className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='description'
                  name='description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='e.g., Groceries, Salary'
                  required
                  className='pl-9 w-full'
                />
              </div>
              {merchantMatch && !goalId && (
                <div className='flex items-center justify-between text-[11px] px-1 text-primary flex-wrap gap-1'>
                  <span className='inline-flex items-center gap-1 font-medium'>
                    <LuSparkles className='w-3 h-3 shrink-0' />
                    <span>
                      Auto-categorized as{' '}
                      <strong>
                        {formatCategoryName(merchantMatch.category)}
                      </strong>
                    </span>
                  </span>
                  {merchantMatch.confidence === 'learned' && (
                    <span className='text-[10px] text-muted-foreground'>
                      (from history)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Transaction Breakdown Toggle */}
            <div className='p-3 bg-secondary/50 rounded-lg space-y-3 transition-all duration-200 w-full min-w-0'>
              <div className='flex items-center justify-between gap-2 w-full min-w-0'>
                <div className='space-y-0.5 min-w-0 flex-1 pr-2'>
                  <Label
                    className='font-medium text-foreground gap-1.5 flex items-center cursor-pointer'
                    htmlFor='split-toggle'
                  >
                    <LuListPlus className='text-muted-foreground w-4 h-4 shrink-0' />{' '}
                    <span>Transaction Breakdown</span>
                  </Label>
                  <p className='text-xs text-muted-foreground'>
                    Split total into individual items.
                  </p>
                </div>
                <Switch
                  id='split-toggle'
                  checked={isSplit}
                  onCheckedChange={handleSplitToggle}
                  className='shrink-0'
                />
              </div>

              {isSplit && (
                <PurchaseBreakdownEditor
                  items={splitItems}
                  onChange={handleSplitItemsChange}
                  currency={currency}
                />
              )}
            </div>

            {/* Amount & Currency */}
            <div className='grid gap-2 w-full min-w-0'>
              <div className='flex items-center justify-between'>
                <Label
                  htmlFor='amount'
                  className='font-medium text-foreground/80 gap-0.5'
                >
                  Amount<span className='text-destructive'>*</span>
                </Label>
                {isSplit && (
                  <span className='text-xs text-primary font-medium'>
                    Auto-calculated from items
                  </span>
                )}
              </div>
              <div className='flex gap-2 w-full min-w-0'>
                <div className='w-24 sm:w-28 shrink-0'>
                  <Select
                    value={entryCurrency}
                    onValueChange={setEntryCurrency}
                    disabled={isSplit}
                  >
                    <SelectTrigger className='h-9 text-xs font-medium w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem
                          key={c.code}
                          value={c.code}
                          className='text-xs'
                        >
                          {c.code} ({c.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='relative flex-1 min-w-0'>
                  <span className='pointer-events-none absolute inset-y-0 left-3 flex items-center font-medium text-muted-foreground text-sm select-none'>
                    {getCurrencySymbol(entryCurrency)}
                  </span>
                  <Input
                    id='amount'
                    name='amount'
                    type='number'
                    step='any'
                    min='0.01'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder='0.00'
                    disabled={isSplit}
                    required={!isSplit}
                    className={cn(
                      'disabled:opacity-80 disabled:bg-muted/50 font-medium w-full',
                      getCurrencySymbol(entryCurrency).length > 1
                        ? 'pl-10'
                        : 'pl-8',
                    )}
                  />
                </div>
              </div>

              {conversion && (
                <div className='flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-lg bg-muted/40 text-xs border border-border/50 w-full min-w-0'>
                  <span className='text-muted-foreground'>
                    Converted to:{' '}
                    <strong className='text-foreground font-semibold'>
                      {formatCurrency(conversion.convertedAmount, currency)}
                    </strong>
                  </span>
                  <span className='text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap'>
                    <span>
                      Rate: 1 {entryCurrency} ={' '}
                      {conversion.effectiveRate < 1
                        ? conversion.effectiveRate.toFixed(4)
                        : conversion.effectiveRate.toFixed(2)}{' '}
                      {currency || 'USD'}
                    </span>
                    {liveRatesInfo?.isLive && (
                      <span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded'>
                        Live Rate
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Type */}
            <div className='grid gap-2 w-full min-w-0'>
              <Label className='font-medium text-foreground/80'>
                Type<span className='text-destructive'>*</span>
              </Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  const newType = entryTypeSchema.parse(v)

                  // If the user's changing the type, reset the category to uncategorized,
                  // unless they're currently on 'other' or already uncategorized.
                  if (newType !== type) {
                    if (category && category !== 'other') {
                      setCategory(null)
                    }
                    setGoalId(null)
                  }

                  setType(newType)
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='expense'>
                    <span className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-red-500'></span>
                      Expense
                    </span>
                  </SelectItem>
                  <SelectItem value='income'>
                    <span className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-green-500'></span>
                      Income
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className='grid gap-2 w-full min-w-0'>
              <Label
                htmlFor='date'
                className='font-medium text-foreground/80 gap-0.5'
              >
                Date<span className='text-destructive'>*</span>
              </Label>
              <DatePicker id='date' value={date} onChange={setDate} />
            </div>

            {/* Category */}
            <div className='grid gap-2 w-full min-w-0'>
              <Label className='font-medium text-foreground/80'>Category</Label>
              <Select
                value={categorySelectValue}
                onValueChange={(v) => {
                  const selectedGoal = activeGoals.find(
                    (g) => `goal-${g.id}` === v,
                  )
                  if (selectedGoal) {
                    // Savings and debt always record expenses. Lent records keep
                    // the current type: income = repayment, expense = new lending.
                    if (selectedGoal.type !== 'lent') {
                      setType('expense')
                    }
                    setGoalId(selectedGoal.id)
                    const targetPrefix =
                      selectedGoal.type === 'debt'
                        ? 'Debt:'
                        : selectedGoal.type === 'lent'
                          ? 'Lent:'
                          : 'Goal:'
                    setCategory(`${targetPrefix} ${selectedGoal.title}`)
                    return
                  }
                  setGoalId(null)
                  setCategory(v === 'uncategorized' ? null : v)
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='uncategorized'>
                    <span className='italic text-muted-foreground'>
                      Uncategorized
                    </span>
                  </SelectItem>
                  {(type === 'income'
                    ? INCOME_CATEGORIES
                    : EXPENSE_CATEGORIES
                  ).map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                  {type === 'expense' && isArchivedGoal && (
                    <SelectItem value='archived-goal' disabled>
                      <span className='text-muted-foreground'>
                        Archived target (history preserved)
                      </span>
                    </SelectItem>
                  )}
                  {type === 'income' && isArchivedGoal && (
                    <SelectItem value='archived-goal' disabled>
                      <span className='text-muted-foreground'>
                        Archived lent target (history preserved)
                      </span>
                    </SelectItem>
                  )}
                  {type === 'expense' &&
                    activeGoals.filter((g) => g.type !== 'debt' && g.type !== 'lent').length > 0 && (
                      <>
                        <div className='h-px bg-border my-1.5' />
                        <div className='px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                          Savings Goals
                        </div>
                        {activeGoals
                          .filter((g) => g.type !== 'debt' && g.type !== 'lent')
                          .map((g) => (
                            <SelectItem key={g.id} value={`goal-${g.id}`}>
                              <span className='flex flex-col items-start'>
                                <span>Goal: {g.title}</span>
                                {g.cashflow_title && (
                                  <span className='text-[10px] text-muted-foreground'>
                                    Cashflow: {g.cashflow_title}
                                  </span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                      </>
                    )}
                  {type === 'expense' &&
                    activeGoals.filter((g) => g.type === 'debt').length > 0 && (
                      <>
                        <div className='h-px bg-border my-1.5' />
                        <div className='px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                          Debt Paydowns
                        </div>
                        {activeGoals
                          .filter((g) => g.type === 'debt')
                          .map((g) => (
                            <SelectItem key={g.id} value={`goal-${g.id}`}>
                              <span className='flex flex-col items-start'>
                                <span>Debt: {g.title}</span>
                                {g.cashflow_title && (
                                  <span className='text-[10px] text-muted-foreground'>
                                    Cashflow: {g.cashflow_title}
                                  </span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                      </>
                    )}
                  {type === 'expense' &&
                    activeGoals.filter((g) => g.type === 'lent').length > 0 && (
                      <>
                        <div className='h-px bg-border my-1.5' />
                        <div className='px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                          Money Lent
                        </div>
                        {activeGoals
                          .filter((g) => g.type === 'lent')
                          .map((g) => (
                            <SelectItem key={g.id} value={`goal-${g.id}`}>
                              <span className='flex flex-col items-start'>
                                <span>Lent: {g.title}</span>
                                {g.cashflow_title && (
                                  <span className='text-[10px] text-muted-foreground'>
                                    Cashflow: {g.cashflow_title}
                                  </span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                      </>
                    )}
                  {type === 'income' &&
                    activeGoals.filter((g) => g.type === 'lent').length > 0 && (
                      <>
                        <div className='h-px bg-border my-1.5' />
                        <div className='px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                          Lent Repayments
                        </div>
                        {activeGoals
                          .filter((g) => g.type === 'lent')
                          .map((g) => (
                            <SelectItem key={g.id} value={`goal-${g.id}`}>
                              <span className='flex flex-col items-start'>
                                <span>Lent: {g.title}</span>
                                {g.cashflow_title && (
                                  <span className='text-[10px] text-muted-foreground'>
                                    Cashflow: {g.cashflow_title}
                                  </span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                      </>
                    )}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className='grid gap-2 w-full min-w-0'>
              <Label className='font-medium text-foreground/80'>Tags</Label>
              <TagPicker
                tags={tags}
                onChange={setTags}
                availableTags={availableTags}
                bookTags={bookTags}
                placeholder='e.g. TaxDeductible, ClientA…'
              />
              <p className='text-[11px] text-muted-foreground'>
                Select existing or type and press Enter to create. Max 10 tags.
              </p>
            </div>

            {/* Receipt / Attachment Upload */}
            <div className='grid gap-2 w-full min-w-0'>
              <ImageAttachmentInput
                label='Receipt / Attachment'
                optional
                icon={<LuPaperclip className='w-3.5 h-3.5 text-muted-foreground shrink-0' />}
                headerAction={
                  !isEdit && lastScannedFile && receiptAction !== 'upload' ? (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => handleFileSelect(lastScannedFile)}
                      className='h-7 text-xs px-2.5 gap-1.5 border-primary/40 hover:bg-primary/10 text-primary cursor-pointer'
                    >
                      <LuPaperclip className='w-3 h-3' />
                      <span>Attach Scanned Receipt</span>
                    </Button>
                  ) : undefined
                }
                existingUrl={existingReceiptUrl}
                existingSignedUrl={existingSignedUrl}
                isLoadingExistingThumbnail={isLoadingExistingThumbnail}
                existingTitle='Attached Receipt'
                onDownloadExisting={handleDownloadExistingReceipt}
                isDownloadingExisting={isDownloadingReceipt}
                action={receiptAction}
                file={receiptFile}
                previewUrl={receiptPreviewUrl}
                onFileSelect={handleFileSelect}
                onRemoveExisting={() => {
                  setReceiptAction('remove')
                  setReceiptFile(null)
                  if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl)
                  setReceiptPreviewUrl(null)
                }}
                onCancelUpload={() => {
                  setReceiptAction(existingReceiptUrl ? 'keep' : 'keep')
                  setReceiptFile(null)
                  if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl)
                  setReceiptPreviewUrl(null)
                }}
                onPreviewClick={() => {
                  if (receiptPreviewUrl || existingSignedUrl) setIsLightboxOpen(true)
                }}
                dropzoneTitle='Upload receipt or photo'
                dropzoneSubtitle='Drag & drop or click to browse (PNG, JPG, WebP)'
                tipText='💡 Tip: Attach receipts or payment proofs for clear record-keeping'
              />
            </div>

            {/* Recurring Switch */}
            <div className='flex items-center justify-between mt-2 p-3 bg-secondary/50 rounded-lg gap-2'>
              <div className='space-y-0.5 min-w-0 flex-1'>
                <Label className='font-medium text-foreground gap-1.5 flex items-center'>
                  <LuRepeat className='text-muted-foreground w-4 h-4 shrink-0' />{' '}
                  <span>Recurring Transaction</span>
                </Label>
                <p className='text-xs text-muted-foreground'>
                  Repeat this transaction automatically in forecasts
                </p>
              </div>
              <Switch
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
                className='shrink-0'
              />
            </div>

            {/* Recurrence Interval (Conditional) */}
            {isRecurring && (
              <div className='grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300 border border-border p-4 rounded-xl bg-muted/20 dark:bg-muted/10'>
                <div className='grid gap-2'>
                  <Label className='font-medium text-foreground/80'>
                    Recurrence Interval
                    <span className='text-destructive'>*</span>
                  </Label>
                  <Select
                    value={recurrenceInterval}
                    onValueChange={(v) =>
                      setRecurrenceInterval(
                        z.enum(['monthly', 'yearly']).parse(v),
                      )
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='monthly'>Monthly</SelectItem>
                      <SelectItem value='yearly'>Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Yearly Calculation Method (Conditional) */}
                {recurrenceInterval === 'yearly' && (
                  <div className='grid gap-2 pt-2 border-t border-border/50'>
                    <Label className='font-medium text-foreground/80'>
                      Projection Calculation
                      <span className='text-destructive'>*</span>
                    </Label>
                    <Select
                      value={yearlyCalculation}
                      onValueChange={(v) =>
                        setYearlyCalculation(
                          z.enum(['prorated', 'exact']).parse(v),
                        )
                      }
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='prorated'>
                          Prorated (1/12th per month)
                        </SelectItem>
                        <SelectItem value='exact'>
                          Exact Anniversary Date
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className='text-[10px] text-muted-foreground mt-1'>
                      {yearlyCalculation === 'prorated'
                        ? "Smooths out massive annual charges so they don't destroy a single month's budget projection."
                        : 'Only deducts this from your projected balance if the anniversary falls within the next month.'}
                    </p>
                  </div>
                )}

                {Boolean(entry?.recurring_rule_id) && (
                  <div className='flex items-start gap-2.5 pt-3 border-t border-border/50'>
                    <input
                      type='checkbox'
                      id='update-recurring-rule-check'
                      checked={updateRecurringRule}
                      onChange={(e) => setUpdateRecurringRule(e.target.checked)}
                      className='mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4'
                    />
                    <div className='grid gap-0.5'>
                      <Label
                        htmlFor='update-recurring-rule-check'
                        className='text-xs font-semibold text-foreground cursor-pointer'
                      >
                        Apply to future recurring entries
                      </Label>
                      <p className='text-[11px] text-muted-foreground leading-tight'>
                        Updates the recurring template for future cycles. Keep
                        unchecked to edit this entry only.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className='text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md font-medium'>
                {error}
              </p>
            )}
          </div>

          <DialogFooter className='py-4 mt-4'>
            <div className='flex w-full gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isBusy}
                className='flex-1'
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isBusy} className='flex-1'>
                {isBusy ? (
                  <>
                    <LuLoader className='mr-2 h-4 w-4 animate-spin' />
                    {isEdit ? 'Saving...' : 'Adding...'}
                  </>
                ) : isEdit ? (
                  'Save Changes'
                ) : (
                  'Add Entry'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
      {/* Interactive Lightbox preview */}
      <ReceiptLightbox
        open={isLightboxOpen}
        onOpenChange={setIsLightboxOpen}
        previewUrl={
          receiptAction === 'upload' ? receiptPreviewUrl : existingSignedUrl
        }
        cashflowId={cashflowId}
        entryId={entry?.id ?? null}
        description={description || 'Receipt'}
        date={date}
        amount={amount ? parseFloat(amount) : undefined}
        currency={currency}
      />
    </Dialog>
  )
}
