'use client'

import { useState, useRef, useEffect } from 'react'
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
  LuReceipt,
  LuTrash2,
  LuUpload,
  LuDownload,
} from 'react-icons/lu'
import { toast } from 'react-toastify'
import { addEntry, updateEntry, getReceiptSignedUrl } from '../actions'
import type { CashflowEntryDTO, CashflowGoalDTO, CashflowTagDTO } from '@/types/dto'
import { getCurrencySymbol } from '@/lib/currency'
import * as z from 'zod/mini'
import { entryTypeSchema, entryCategorySchema } from '../schemas.client'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants'
import PurchaseBreakdownEditor, {
  type SplitItemInput,
} from './PurchaseBreakdownEditor'
import { TagPicker } from './TagPicker'
import {
  compressImageToWebP,
  isSupportedImageFile,
} from '../lib/image-compression'
import ReceiptLightbox from './ReceiptLightbox'

interface EntryModalProps {
  cashflowId: string
  entry?: CashflowEntryDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currency: string | null
  onSuccess: () => void
  goals?: CashflowGoalDTO[]
  availableTags?: string[]
  bookTags?: CashflowTagDTO[]
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
}: EntryModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const entryGoal = entry?.goal_id
    ? goals.find((goal) => goal.id === entry.goal_id)
    : undefined
  const entryCategory = entryGoal
    ? `Goal: ${entryGoal.title}`
    : entryCategorySchema.parse(entry?.category)

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevEntry, setPrevEntry] = useState(entry)

  const [description, setDescription] = useState(entry?.description || '')
  const [amount, setAmount] = useState(entry?.amount?.toString() || '')
  const [type, setType] = useState<'income' | 'expense'>(
    entryTypeSchema.parse(entry?.type),
  )
  const [category, setCategory] = useState<string | null>(entryCategory)
  const [goalId, setGoalId] = useState<string | null>(entry?.goal_id ?? null)
  const [date, setDate] = useState(entry?.date || today)
  const [isRecurring, setIsRecurring] = useState(entry?.is_recurring || false)
  const [recurrenceInterval, setRecurrenceInterval] = useState<
    'monthly' | 'yearly'
  >(entry?.recurrence_interval || 'monthly')
  const [yearlyCalculation, setYearlyCalculation] = useState<
    'prorated' | 'exact'
  >(entry?.yearly_calculation || 'prorated')
  const [tags, setTags] = useState<string[]>(entry?.tags ?? [])
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null)
  const [receiptAction, setReceiptAction] = useState<'keep' | 'remove' | 'upload'>('keep')
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(
    entry?.receipt_url ?? null,
  )
  const [existingSignedUrl, setExistingSignedUrl] = useState<string | null>(null)
  const [isLoadingExistingThumbnail, setIsLoadingExistingThumbnail] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const receiptInputRef = useRef<HTMLInputElement>(null)

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

  const isArchivedGoal = Boolean(
    entry?.goal_id && entry.goal_id === goalId && !entryGoal,
  )

  const isEntryChanged =
    entry?.id !== prevEntry?.id ||
    (entry === null && prevEntry !== null) ||
    (entry !== null && prevEntry === null)

  if (open !== prevOpen || isEntryChanged) {
    setPrevOpen(open)
    setPrevEntry(entry)
    if (open) {
      setDescription(entry?.description || '')
      setAmount(entry?.amount?.toString() || '')
      setType(entryTypeSchema.parse(entry?.type))
      setCategory(entryCategory)
      setGoalId(entry?.goal_id ?? null)
      setDate(entry?.date || today)
      setIsRecurring(entry?.is_recurring || false)
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
      const ext = blob.type === 'image/jpeg' || blob.type === 'image/jpg' ? 'jpg' : 'webp'
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
  const isEdit = !!entry

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('cashflowId', cashflowId)
    formData.append('description', description)
    formData.append('amount', amount || '0')
    formData.append('type', type)
    if (category) formData.append('category', category)
    if (goalId) formData.append('goalId', goalId)
    formData.append('date', date)
    formData.append('is_recurring', isRecurring.toString())
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
          const msg = 'Could not compress image. Please choose a photo under 1MB.'
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
        toast.error(result.error || (isEdit ? 'Failed to update entry' : 'Failed to add entry'))
        setIsLoading(false)
      } else {
        toast.success(isEdit ? 'Entry updated!' : 'Entry added!')
        onOpenChange(false)
        onSuccess()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(msg)
      toast.error(msg)
      setIsLoading(false)
    }
  }

  const selectedGoalIndex = goals.findIndex((goal) => goal.id === goalId)
  const categorySelectValue = isArchivedGoal
    ? 'archived-goal'
    : selectedGoalIndex >= 0
      ? `goal-option-${selectedGoalIndex}`
      : category || 'uncategorized'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md max-h-[90vh] p-0 overflow-hidden flex flex-col'>
        <div className='p-6 pb-0 shrink-0'>
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

        <form onSubmit={handleSubmit} className='p-6 pt-4 space-y-4 overflow-y-auto flex-1 pr-4 sm:pr-6'>
          <div className='grid gap-4'>
            {/* Description */}
            <div className='grid gap-2'>
              <Label
                htmlFor='description'
                className='font-medium text-foreground/80 gap-0.5'
              >
                Description<span className='text-destructive'>*</span>
              </Label>
              <div className='relative'>
                <LuFileText className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='description'
                  name='description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='e.g., Groceries, Salary'
                  required
                  className='pl-9'
                />
              </div>
            </div>

            {/* Transaction Breakdown Toggle */}
            <div className='p-3 bg-secondary/50 rounded-lg space-y-3 transition-all duration-200'>
              <div className='flex items-center justify-between gap-2'>
                <div className='space-y-0.5'>
                  <Label
                    className='font-medium text-foreground gap-1.5 flex items-center cursor-pointer'
                    htmlFor='split-toggle'
                  >
                    <LuListPlus className='text-muted-foreground w-4 h-4' />{' '}
                    Transaction Breakdown
                  </Label>
                  <p className='text-xs text-muted-foreground'>
                    Split total into individual items.
                  </p>
                </div>
                <Switch
                  id='split-toggle'
                  checked={isSplit}
                  onCheckedChange={handleSplitToggle}
                />
              </div>

              {isSplit && (
                <PurchaseBreakdownEditor
                  items={splitItems}
                  onChange={handleSplitItemsChange}
                  currency={currency}
                  categories={EXPENSE_CATEGORIES.map((c) => c.value)}
                />
              )}
            </div>

            {/* Amount */}
            <div className='grid gap-2'>
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
              <div className='relative'>
                <div className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex items-center justify-center font-semibold text-sm'>
                  {getCurrencySymbol(currency || 'USD')}
                </div>
                <Input
                  id='amount'
                  name='amount'
                  type='number'
                  step='0.01'
                  min='0.01'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder='0.00'
                  disabled={isSplit}
                  required={!isSplit}
                  className='pl-9 disabled:opacity-80 disabled:bg-muted/50 font-semibold'
                />
              </div>
            </div>

            {/* Type */}
            <div className='grid gap-2'>
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
            <div className='grid gap-2'>
              <Label
                htmlFor='date'
                className='font-medium text-foreground/80 gap-0.5'
              >
                Date<span className='text-destructive'>*</span>
              </Label>
              <DatePicker
                id='date'
                value={date}
                onChange={setDate}
              />
            </div>

            {/* Category */}
            <div className='grid gap-2'>
              <Label className='font-medium text-foreground/80'>Category</Label>
              <Select
                value={categorySelectValue}
                onValueChange={(v) => {
                  const selectedGoal = goals.find(
                    (_, index) => `goal-option-${index}` === v,
                  )
                  if (selectedGoal) {
                    setType('expense')
                    setGoalId(selectedGoal.id)
                    setCategory(`Goal: ${selectedGoal.title}`)
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
                  {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(
                    (c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ),
                  )}
                  {type === 'expense' && isArchivedGoal && (
                    <SelectItem value='archived-goal' disabled>
                      <span className='text-muted-foreground'>
                        Archived goal (history preserved)
                      </span>
                    </SelectItem>
                  )}
                      {goals.length > 0 && (
                        <>
                          <div className='h-px bg-border my-1.5' />
                          <div className='px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                            Savings Goals
                          </div>
                          {goals.map((g, index) => (
                            <SelectItem
                              key={g.id}
                              value={`goal-option-${index}`}
                            >
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
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className='grid gap-2'>
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
            <div className='grid gap-2'>
              <Label className='font-medium text-foreground/80 flex items-center gap-1.5'>
                <LuPaperclip className='w-3.5 h-3.5 text-muted-foreground' />
                Receipt / Attachment
              </Label>

              {/* Case 1: Existing receipt attached and not removed */}
              {existingReceiptUrl && receiptAction === 'keep' && (
                <div className='flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20'>
                  <div
                    role='button'
                    tabIndex={0}
                    onClick={() => (existingSignedUrl ? setIsLightboxOpen(true) : null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        if (existingSignedUrl) setIsLightboxOpen(true)
                      }
                    }}
                    className='flex items-center gap-2.5 min-w-0 cursor-pointer group/thumb flex-1 pr-2'
                    title={existingSignedUrl ? 'Click to preview receipt in full screen' : undefined}
                  >
                    {existingSignedUrl ? (
                      <div className='relative w-10 h-10 rounded border border-border bg-card overflow-hidden shrink-0 group-hover/thumb:ring-2 group-hover/thumb:ring-primary/50 transition-all'>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={existingSignedUrl}
                          alt='Receipt thumbnail'
                          className='w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-200'
                        />
                      </div>
                    ) : isLoadingExistingThumbnail ? (
                      <div className='w-10 h-10 rounded border border-border bg-muted/40 flex items-center justify-center shrink-0 animate-pulse'>
                        <LuLoader className='w-4 h-4 animate-spin text-muted-foreground' />
                      </div>
                    ) : (
                      <div className='w-10 h-10 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0'>
                        <LuReceipt className='w-4 h-4' />
                      </div>
                    )}
                    <div className='min-w-0'>
                      <p className='text-xs font-medium truncate group-hover/thumb:text-primary transition-colors'>
                        Attached Receipt
                      </p>
                      <p className='text-[10px] text-muted-foreground'>
                        {existingSignedUrl ? 'Click image to preview' : 'Saved securely'}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1.5 shrink-0'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7 text-muted-foreground hover:text-foreground'
                      onClick={handleDownloadExistingReceipt}
                      disabled={isDownloadingReceipt}
                      title='Download receipt'
                      aria-label='Download receipt'
                    >
                      {isDownloadingReceipt ? (
                        <LuLoader className='w-3.5 h-3.5 animate-spin' />
                      ) : (
                        <LuDownload className='w-3.5 h-3.5' />
                      )}
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='h-7 text-xs px-2'
                      onClick={() => receiptInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7 text-destructive hover:bg-destructive/10'
                      onClick={() => {
                        setReceiptAction('remove')
                        setReceiptFile(null)
                        if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl)
                        setReceiptPreviewUrl(null)
                      }}
                      title='Remove receipt'
                    >
                      <LuTrash2 className='w-3.5 h-3.5' />
                    </Button>
                  </div>
                </div>
              )}

              {/* Case 2: Newly selected file preview */}
              {receiptAction === 'upload' && receiptPreviewUrl && (
                <div className='flex items-center justify-between p-2.5 rounded-lg border border-primary/30 bg-primary/5'>
                  <div
                    role='button'
                    tabIndex={0}
                    onClick={() => setIsLightboxOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setIsLightboxOpen(true)
                      }
                    }}
                    className='flex items-center gap-2.5 min-w-0 flex-1 pr-2 cursor-pointer group/newthumb'
                    title='Click to preview in full screen'
                  >
                    <div className='relative w-10 h-10 rounded border border-primary/30 bg-card overflow-hidden shrink-0 group-hover/newthumb:ring-2 group-hover/newthumb:ring-primary/50 transition-all flex items-center justify-center'>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={receiptPreviewUrl}
                        alt='Receipt preview'
                        className='w-full h-full object-cover group-hover/newthumb:scale-110 transition-transform duration-200'
                      />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-xs font-medium truncate group-hover/newthumb:text-primary transition-colors'>
                        {receiptFile?.name || 'receipt.webp'}
                      </p>
                      <p className='text-[10px] text-muted-foreground'>
                        {receiptFile
                          ? receiptFile.size < 1024 * 1024
                            ? `${(receiptFile.size / 1024).toFixed(1)} KB • Click to preview`
                            : `${(receiptFile.size / (1024 * 1024)).toFixed(1)} MB • Click to preview`
                          : 'Click to preview'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0'
                    onClick={() => {
                      setReceiptAction(existingReceiptUrl ? 'keep' : 'keep')
                      setReceiptFile(null)
                      if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl)
                      setReceiptPreviewUrl(null)
                    }}
                    title='Cancel upload'
                  >
                    <LuTrash2 className='w-3.5 h-3.5' />
                  </Button>
                </div>
              )}

              {/* Case 3: No receipt or replaced/removed */}
              {(!existingReceiptUrl || receiptAction === 'remove') && !receiptPreviewUrl && (
                <div
                  role='button'
                  tabIndex={0}
                  onClick={() => receiptInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      receiptInputRef.current?.click()
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const droppedFile = e.dataTransfer.files?.[0]
                    if (droppedFile && isSupportedImageFile(droppedFile)) {
                      handleFileSelect(droppedFile)
                    } else if (droppedFile) {
                      toast.error('Only standard image files (JPG, PNG, WebP) are supported')
                    }
                  }}
                  className='flex flex-col items-center justify-center p-4 border border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/30 rounded-lg cursor-pointer transition-colors text-center group'
                >
                  <LuUpload className='w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mb-1.5' />
                  <p className='text-xs font-medium text-foreground/90'>
                    Upload receipt or photo
                  </p>
                  <p className='text-[10px] text-muted-foreground mt-0.5'>
                    Drag & drop or click to browse (PNG, JPG, WebP)
                  </p>
                </div>
              )}

              <input
                ref={receiptInputRef}
                type='file'
                accept='image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.jfif,.avif'
                className='hidden'
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileSelect(file)
                  }
                  e.target.value = ''
                }}
              />
            </div>

            {/* Recurring Switch */}
            <div className='flex items-center justify-between mt-2 p-3 bg-secondary/50 rounded-lg'>
              <div className='space-y-0.5'>
                <Label className='font-medium text-foreground gap-1.5 flex items-center'>
                  <LuRepeat className='text-muted-foreground w-4 h-4' />{' '}
                  Recurring Transaction
                </Label>
                <p className='text-xs text-muted-foreground'>
                  Repeat this transaction automatically in forecasts
                </p>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
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
          receiptAction === 'upload'
            ? receiptPreviewUrl
            : existingSignedUrl
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
