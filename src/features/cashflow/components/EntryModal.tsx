'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  LuCalendar,
  LuRepeat,
  LuListPlus,
} from 'react-icons/lu'
import { toast } from 'react-toastify'
import { addEntry, updateEntry } from '../actions'
import type { CashflowEntryDTO, CashflowGoalDTO, CashflowTagDTO } from '@/types/dto'
import { getCurrencySymbol } from '@/lib/currency'
import * as z from 'zod/mini'
import { entryTypeSchema, entryCategorySchema } from '../schemas.client'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants'
import PurchaseBreakdownEditor, {
  type SplitItemInput,
} from './PurchaseBreakdownEditor'
import { TagPicker } from './TagPicker'

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
      setError(null)
      setIsLoading(false)
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
              <div className='relative'>
                <LuCalendar className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='date'
                  name='date'
                  type='date'
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className='pl-9'
                />
              </div>
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
    </Dialog>
  )
}
