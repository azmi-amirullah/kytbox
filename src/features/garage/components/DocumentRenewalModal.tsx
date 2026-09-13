'use client'

import { useState, useTransition, useId } from 'react'
import { toast } from 'react-toastify'
import {
  LuRefreshCw,
  LuSparkles,
  LuWallet,
  LuCheck,
  LuClock,
  LuTriangleAlert,
} from 'react-icons/lu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputGroup } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { VehicleDTO, VehicleDocumentDTO } from '@/types/dto'
import { EXPENSE_CATEGORIES } from '@/features/cashflow/constants'
import { renewVehicleDocument } from '../actions'
import { advanceExpiryDate } from '../lib/document-math'
import { getTodayDateOnlyString } from '@/lib/date-only'

interface DocumentRenewalModalProps {
  vehicle: VehicleDTO
  document: VehicleDocumentDTO | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (updated: VehicleDocumentDTO) => void
  cashflowBooks?: { id: string; title: string; currency: string }[]
}

type RenewalPreset = '1y' | '5y' | '6m' | 'custom'

const PRESET_OPTIONS: { id: RenewalPreset; label: string; description: string }[] = [
  { id: '1y', label: '+1 Year', description: 'Standard annual road tax & insurance' },
  { id: '5y', label: '+5 Years', description: '5-year plate / STNK renewal' },
  { id: '6m', label: '+6 Months', description: 'Semi-annual inspection or policy' },
  { id: 'custom', label: 'Custom', description: 'Choose specific future date' },
]

export function DocumentRenewalModal({
  vehicle,
  document,
  isOpen,
  onClose,
  onSuccess,
  cashflowBooks = [],
}: DocumentRenewalModalProps) {
  const [isPending, startTransition] = useTransition()

  // Form IDs for accessibility
  const costId = useId()
  const customDateId = useId()
  const paymentDateId = useId()
  const bookSelectId = useId()
  const categoryInputId = useId()
  const syncCashflowId = useId()
  const advanceTodayId = useId()

  const todayStr = getTodayDateOnlyString()
  const isDocumentExpired = Boolean(document && document.expiry_date < todayStr)

  // Default preset based on document type
  const defaultPreset: RenewalPreset =
    document?.document_type === 'registration_renewal' ? '5y' : '1y'

  const [preset, setPreset] = useState<RenewalPreset>(defaultPreset)
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('')
  const [advanceFromToday, setAdvanceFromToday] = useState<boolean>(false)
  const [paymentDate, setPaymentDate] = useState<string>(todayStr)
  const [cost, setCost] = useState<string>(
    document?.cost && document.cost > 0 ? String(document.cost) : ''
  )
  const [recordToCashflow, setRecordToCashflow] = useState<boolean>(
    Boolean(vehicle.preferred_cashflow_id && cashflowBooks.length > 0)
  )
  const [cashflowId, setCashflowId] = useState<string>(
    vehicle.preferred_cashflow_id || (cashflowBooks[0]?.id ?? '')
  )
  const [cashflowCategory, setCashflowCategory] = useState<string>('transport')

  // Synchronize state when target document or open status changes (render-phase per React guidelines)
  const [prevDocId, setPrevDocId] = useState<string | null | undefined>(document?.id)
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen)

  if (document?.id !== prevDocId || isOpen !== prevIsOpen) {
    setPrevDocId(document?.id)
    setPrevIsOpen(isOpen)
    if (document) {
      const defPreset: RenewalPreset =
        document.document_type === 'registration_renewal' ? '5y' : '1y'
      setPreset(defPreset)
      setCustomExpiryDate('')
      setAdvanceFromToday(false)
      setPaymentDate(todayStr)
      setCost(document.cost && document.cost > 0 ? String(document.cost) : '')
      setRecordToCashflow(Boolean(vehicle.preferred_cashflow_id && cashflowBooks.length > 0))
      setCashflowId(vehicle.preferred_cashflow_id || (cashflowBooks[0]?.id ?? ''))
      setCashflowCategory('transport')
    }
  }

  if (!document) return null

  // Calculate projected new expiry preview
  const projectedExpiry = advanceExpiryDate(
    document.expiry_date,
    preset,
    customExpiryDate || undefined,
    advanceFromToday
  )

  const handlePresetChange = (newPreset: RenewalPreset) => {
    setPreset(newPreset)
    if (newPreset !== 'custom') {
      setCustomExpiryDate('')
    } else if (!customExpiryDate) {
      setCustomExpiryDate(advanceExpiryDate(document.expiry_date, '1y'))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (preset === 'custom' && !customExpiryDate) {
      toast.error('Please specify a valid custom expiry date')
      return
    }

    const numericCost = cost.trim() ? Number(cost) : undefined
    if (numericCost !== undefined && (isNaN(numericCost) || numericCost < 0)) {
      toast.error('Please enter a valid renewal cost')
      return
    }

    if (recordToCashflow && (!cashflowId || !numericCost || numericCost <= 0)) {
      toast.error('Please select a cashflow book and enter a valid cost to sync to ledger')
      return
    }

    startTransition(async () => {
      const res = await renewVehicleDocument({
        id: document.id,
        vehicleId: vehicle.id,
        preset,
        customExpiryDate: preset === 'custom' ? customExpiryDate : undefined,
        renewalCost: numericCost,
        recordToCashflow,
        cashflowId: recordToCashflow ? cashflowId : undefined,
        cashflowCategoryId: recordToCashflow ? cashflowCategory : undefined,
        advanceFromToday,
        paymentDate: recordToCashflow ? (paymentDate || todayStr) : undefined,
      })

      if (!res.success || !res.data) {
        toast.error(res.error || 'Failed to renew document')
        return
      }

      if (res.warning) {
        toast.warn(res.warning)
      } else {
        toast.success(`Renewed ${document.title} to ${projectedExpiry}!`)
      }
      onSuccess(res.data)
      onClose()
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <div className='flex items-center gap-2 text-primary mb-1'>
            <LuRefreshCw className='size-5' aria-hidden='true' />
            <span className='text-xs font-semibold uppercase tracking-wider'>
              1-Tap Document Renewal
            </span>
          </div>
          <DialogTitle className='text-lg font-bold'>Renew {document.title}</DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Extend expiration date and optionally record renewal expenses to your Cashflow ledger.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          {/* Current Expiry & Vehicle Info */}
          <div className='rounded-lg border border-border/70 bg-muted/40 p-3 text-xs space-y-1.5'>
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>Vehicle:</span>
              <span className='font-medium text-foreground'>
                {vehicle.name} {vehicle.license_plate ? `(${vehicle.license_plate})` : ''}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>Current Expiration:</span>
              <span className='font-mono font-semibold text-foreground'>
                {document.expiry_date}
              </span>
            </div>
            {document.document_number && (
              <div className='flex justify-between items-center'>
                <span className='text-muted-foreground'>Document No:</span>
                <span className='font-mono text-muted-foreground'>
                  {document.document_number}
                </span>
              </div>
            )}
          </div>

          {/* Preset Buttons */}
          <div className='space-y-2'>
            <Label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
              <LuClock className='size-3.5 text-primary' aria-hidden='true' />
              Renewal Period Preset
            </Label>
            <div className='grid grid-cols-2 gap-2'>
              {PRESET_OPTIONS.map((opt) => {
                const isSelected = preset === opt.id
                return (
                  <button
                    key={opt.id}
                    type='button'
                    onClick={() => handlePresetChange(opt.id)}
                    className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-colors min-h-11 ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                        : 'border-border/70 bg-card hover:border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className='flex items-center justify-between w-full'>
                      <span className='text-xs font-semibold text-foreground'>{opt.label}</span>
                      {isSelected && <LuCheck className='size-3 text-primary' />}
                    </div>
                    <span className='text-[0.68rem] text-muted-foreground mt-0.5 line-clamp-1'>
                      {opt.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Advance from Today toggle if document is currently expired */}
          {isDocumentExpired && preset !== 'custom' && (
            <div className='flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs'>
              <Checkbox
                id={advanceTodayId}
                checked={advanceFromToday}
                onCheckedChange={(checked) => setAdvanceFromToday(Boolean(checked))}
                className='mt-0.5'
              />
              <div>
                <Label
                  htmlFor={advanceTodayId}
                  className='text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5'
                >
                  Advance renewal period from today (instead of registration anniversary)
                </Label>
                <p className='text-[0.68rem] text-muted-foreground mt-0.5'>
                  By default, renewals advance from the official anniversary (<strong>{document.expiry_date}</strong>) to preserve legal vehicle registration cycles. Check this only if resetting a lapsed non-anniversary policy.
                </p>
              </div>
            </div>
          )}

          {/* Custom Date Input (if preset === 'custom') */}
          {preset === 'custom' && (
            <div className='space-y-1.5'>
              <Label htmlFor={customDateId} className='text-xs font-medium'>
                Custom New Expiry Date
              </Label>
              <DatePicker
                id={customDateId}
                value={customExpiryDate}
                onChange={setCustomExpiryDate}
                minDate={document.expiry_date}
                className='min-h-10 text-xs'
              />
            </div>
          )}

          {/* Preview New Expiry Banner */}
          <div className='rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <LuSparkles className='size-4 text-primary shrink-0' aria-hidden='true' />
              <div>
                <span className='text-[0.7rem] text-muted-foreground block'>
                  New Expiration Date Preview:
                </span>
                <span className='font-mono text-sm font-bold text-primary'>
                  {projectedExpiry}
                </span>
              </div>
            </div>
            <span className='text-[0.68rem] font-medium text-muted-foreground'>
              {preset === '1y' && '+365 Days'}
              {preset === '5y' && '+5 Years'}
              {preset === '6m' && '+6 Months'}
            </span>
          </div>

          {/* Renewal Cost Input */}
          <div className='space-y-1.5'>
            <Label htmlFor={costId} className='text-xs font-medium flex items-center justify-between'>
              <span>Renewal Cost</span>
              <span className='text-[0.68rem] text-muted-foreground'>Optional</span>
            </Label>
            <InputGroup prefix={vehicle.currency}>
              <Input
                id={costId}
                type='number'
                min='0'
                step='any'
                placeholder='e.g. 3500000'
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className='min-h-10 text-xs font-mono'
              />
            </InputGroup>
          </div>

          {/* Optional Cashflow Ledger Sync */}
          {cashflowBooks.length > 0 && (
            <div className='rounded-lg border border-border/80 bg-card p-3 space-y-3'>
              <div className='flex items-start gap-2.5'>
                <Checkbox
                  id={syncCashflowId}
                  checked={recordToCashflow}
                  onCheckedChange={(checked) => setRecordToCashflow(Boolean(checked))}
                  className='mt-0.5'
                />
                <div>
                  <Label
                    htmlFor={syncCashflowId}
                    className='text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer'
                  >
                    <LuWallet className='size-3.5 text-primary' aria-hidden='true' />
                    Sync expense to Cashflow ledger
                  </Label>
                  <p className='text-[0.68rem] text-muted-foreground mt-0.5'>
                    Automatically creates an expense entry with vehicle tags when renewed.
                  </p>
                </div>
              </div>

              {recordToCashflow && (
                <div className='space-y-2 pt-1 border-t border-border/60'>
                  <div className='space-y-1'>
                    <Label htmlFor={bookSelectId} className='text-[0.72rem] text-muted-foreground'>
                      Target Cashflow Book
                    </Label>
                    <Select value={cashflowId} onValueChange={setCashflowId}>
                      <SelectTrigger id={bookSelectId} className='min-h-9.5 text-xs'>
                        <SelectValue placeholder='Select Cashflow book' />
                      </SelectTrigger>
                      <SelectContent>
                        {cashflowBooks.map((b) => (
                          <SelectItem key={b.id} value={b.id} className='text-xs'>
                            {b.title} ({b.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1'>
                    <Label htmlFor={categoryInputId} className='text-[0.72rem] text-muted-foreground'>
                      Expense Category
                    </Label>
                    <Select value={cashflowCategory} onValueChange={setCashflowCategory}>
                      <SelectTrigger id={categoryInputId} className='min-h-9.5 text-xs'>
                        <SelectValue placeholder='Select category' />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value} className='text-xs'>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1'>
                    <Label htmlFor={paymentDateId} className='text-[0.72rem] text-muted-foreground'>
                      Payment Date
                    </Label>
                    <DatePicker
                      id={paymentDateId}
                      value={paymentDate}
                      onChange={setPaymentDate}
                      className='h-8 text-xs'
                    />
                  </div>

                  {(() => {
                    const selectedBook = cashflowBooks.find((b) => b.id === cashflowId)
                    if (
                      selectedBook?.currency &&
                      selectedBook.currency.toUpperCase() !== vehicle.currency.toUpperCase()
                    ) {
                      return (
                        <div className='rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5'>
                          <LuTriangleAlert className='size-3.5 shrink-0 mt-0.5' />
                          <span>
                            <strong>Currency Notice:</strong> Vehicle is in{' '}
                            <strong className='font-mono'>{vehicle.currency}</strong>, but{' '}
                            {selectedBook.title} is in{' '}
                            <strong className='font-mono'>{selectedBook.currency}</strong>.
                          </span>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              )}
            </div>
          )}

          <DialogFooter className='gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isPending}
              className='min-h-11'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isPending}
              className='min-h-11 gap-1.5 font-medium'
            >
              {isPending ? (
                <>
                  <LuRefreshCw className='size-4 animate-spin' aria-hidden='true' />
                  Updating...
                </>
              ) : (
                <>
                  <LuCheck className='size-4' aria-hidden='true' />
                  Confirm Renewal
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
