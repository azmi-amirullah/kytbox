'use client'

import { useState, useTransition, useId } from 'react'
import { toast } from 'react-toastify'
import {
  LuWrench,
  LuCalendar,
  LuGauge,
  LuReceipt,
  LuFileText,
  LuCheck,
  LuPlus,
  LuX,
  LuExternalLink,
  LuSparkles,
  LuShieldAlert,
  LuShieldCheck,
  LuClock,
  LuWallet,
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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  VehicleDTO,
  VehicleMaintenanceRuleDTO,
  VehicleServiceDTO,
  ServiceType,
} from '@/types/dto'
import { EXPENSE_CATEGORIES } from '@/features/cashflow/constants'
import { createVehicleService } from '../actions'
import { sanitizeInvoiceUrl } from '../lib/invoice-url'
import { calculateRuleDueStatus } from '../lib/rules-math'
import { isOdometerTypoJump } from '../lib/odometer'
import { getTodayDateOnlyString } from '@/lib/date-only'

interface LogServiceModalProps {
  vehicle: VehicleDTO
  maintenanceRules: VehicleMaintenanceRuleDTO[]
  predictedOdometer?: number
  isPredictedOdometer?: boolean
  isOpen: boolean
  onClose: () => void
  onSuccess: (newService: VehicleServiceDTO) => void
  cashflowBooks?: { id: string; title: string; currency: string }[]
}

const SERVICE_TYPE_CONFIG: Record<
  ServiceType,
  { label: string; icon: React.ElementType; description: string }
> = {
  routine: {
    label: 'Routine Service',
    icon: LuWrench,
    description: 'Periodic fluid changes, filters, and standard checkup',
  },
  repair: {
    label: 'Repair / Fix',
    icon: LuWrench,
    description: 'Fixing worn or damaged mechanical/electrical components',
  },
  inspection: {
    label: 'Inspection',
    icon: LuShieldCheck,
    description: 'Safety check, emission test, or roadworthiness inspection',
  },
  upgrade: {
    label: 'Upgrade / Mod',
    icon: LuSparkles,
    description: 'Performance modifications, accessories, and enhancements',
  },
}

const SERVICE_TYPES: readonly ServiceType[] = ['routine', 'repair', 'inspection', 'upgrade']

export function LogServiceModal({
  vehicle,
  maintenanceRules,
  predictedOdometer,
  isPredictedOdometer = false,
  isOpen,
  onClose,
  onSuccess,
  cashflowBooks = [],
}: LogServiceModalProps) {
  const [isPending, startTransition] = useTransition()
  const baseId = useId()

  const todayStr = getTodayDateOnlyString()
  const initialOdo = predictedOdometer || vehicle.current_odometer || 0

  const [serviceDate, setServiceDate] = useState<string>(todayStr)
  const [odometer, setOdometer] = useState<number>(initialOdo)
  const [isCustomOdo, setIsCustomOdo] = useState<boolean>(false)
  const [serviceType, setServiceType] = useState<ServiceType>('routine')
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([])
  const [customItems, setCustomItems] = useState<string[]>([])
  const [customItemInput, setCustomItemInput] = useState<string>('')
  const [cost, setCost] = useState<string>('0')
  const [workshopName, setWorkshopName] = useState<string>('')
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [invoiceUrl, setInvoiceUrl] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [confirmTypoJump, setConfirmTypoJump] = useState<boolean>(false)

  // Cashflow sync state
  const [recordToCashflow, setRecordToCashflow] = useState<boolean>(
    Boolean(vehicle.preferred_cashflow_id && cashflowBooks && cashflowBooks.length > 0)
  )
  const [cashflowId, setCashflowId] = useState<string>(
    vehicle.preferred_cashflow_id || (cashflowBooks?.[0]?.id ?? '')
  )
  const [cashflowCategory, setCashflowCategory] = useState<string>('transport')

  // Synchronize and reset state whenever modal opens or vehicle changes (render-phase per React guidelines)
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen)
  const [prevVehicleId, setPrevVehicleId] = useState<string>(vehicle.id)

  if (isOpen !== prevIsOpen || vehicle.id !== prevVehicleId) {
    setPrevIsOpen(isOpen)
    setPrevVehicleId(vehicle.id)
    if (isOpen) {
      const resetOdo = predictedOdometer || vehicle.current_odometer || 0
      setServiceDate(getTodayDateOnlyString())
      setOdometer(resetOdo)
      setIsCustomOdo(false)
      setServiceType('routine')
      setSelectedRuleIds([])
      setCustomItems([])
      setCustomItemInput('')
      setCost('0')
      setWorkshopName('')
      setInvoiceNumber('')
      setInvoiceUrl('')
      setNotes('')
      setConfirmTypoJump(false)
      setRecordToCashflow(
        Boolean(vehicle.preferred_cashflow_id && cashflowBooks && cashflowBooks.length > 0)
      )
      setCashflowId(vehicle.preferred_cashflow_id || (cashflowBooks?.[0]?.id ?? ''))
      setCashflowCategory('transport')
    }
  }

  const syncCashflowId = `${baseId}-sync-cashflow`
  const bookSelectId = `${baseId}-book-select`
  const categoryInputId = `${baseId}-category-select`

  // Odometer Typo Jump Calculation
  const isTypoJump = isOdometerTypoJump(Number(odometer) || 0, vehicle.current_odometer, 3000)

  // Compute status for each rule to allow smart selection
  const rulesWithStatus = maintenanceRules
    .filter((r) => r.is_active)
    .map((rule) => ({
      rule,
      status: calculateRuleDueStatus(rule, {
        currentOdometer: odometer || vehicle.current_odometer,
        unit: vehicle.odometer_unit,
      }),
    }))

  const sanitizedInvoice = sanitizeInvoiceUrl(invoiceUrl)

  const handleToggleRule = (ruleId: string) => {
    setSelectedRuleIds((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    )
  }

  const handleSelectDueOrOverdue = () => {
    const dueOrOverdueIds = rulesWithStatus
      .filter((item) => item.status.isOverdue || item.status.isDueSoon)
      .map((item) => item.rule.id)

    if (dueOrOverdueIds.length === 0) {
      toast.info('No overdue or due soon items found')
      return
    }

    setSelectedRuleIds((prev) => Array.from(new Set([...prev, ...dueOrOverdueIds])))
    toast.success(`Selected ${dueOrOverdueIds.length} due items`)
  }

  const handleAddCustomItem = () => {
    const trimmed = customItemInput.trim()
    if (!trimmed) return
    if (customItems.includes(trimmed)) {
      toast.info('Item already added')
      return
    }
    setCustomItems((prev) => [...prev, trimmed])
    setCustomItemInput('')
  }

  const handleRemoveCustomItem = (name: string) => {
    setCustomItems((prev) => prev.filter((item) => item !== name))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedOdometer = Number(odometer)
    if (isNaN(parsedOdometer) || parsedOdometer < 0) {
      toast.error('Please enter a valid odometer reading')
      return
    }

    if (isTypoJump && !confirmTypoJump) {
      toast.error(
        `Odometer jump exceeds 3,000 ${vehicle.odometer_unit}. Please confirm the reading before submitting.`
      )
      return
    }

    const parsedCost = Number(cost.replace(/[^0-9.]/g, '')) || 0

    // Combine selected rule names + custom items for snapshot
    const selectedRuleNames = maintenanceRules
      .filter((r) => selectedRuleIds.includes(r.id))
      .map((r) => r.name)

    const allItemsServiced = Array.from(new Set([...selectedRuleNames, ...customItems]))

    if (allItemsServiced.length === 0 && !notes.trim()) {
      toast.error('Please select at least one serviced item or write service notes')
      return
    }

    startTransition(async () => {
      const res = await createVehicleService({
        vehicleId: vehicle.id,
        serviceDate,
        odometer: parsedOdometer,
        serviceType,
        itemsServiced: allItemsServiced,
        servicedRuleIds: selectedRuleIds,
        cost: parsedCost,
        workshopName: workshopName.trim() || null,
        invoiceNumber: invoiceNumber.trim() || null,
        externalInvoiceUrl: invoiceUrl.trim() || null,
        notes: notes.trim() || null,
        recordToCashflow,
        cashflowId: recordToCashflow ? cashflowId : null,
        cashflowCategory: recordToCashflow ? cashflowCategory : null,
        confirmTypoJump,
      })

      if (res.success && res.data) {
        if (res.warning) {
          toast.warn(res.warning)
        } else {
          toast.success('Service record logged successfully')
        }
        onSuccess(res.data)
        onClose()
      } else {
        toast.error(res.error || 'Failed to record service log')
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isPending && !open && onClose()}>
      <DialogContent className='max-h-[92vh] overflow-y-auto sm:max-w-2xl'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-base font-semibold'>
              <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <LuWrench className='size-4' aria-hidden='true' />
              </div>
              <span>Log Service & Maintenance</span>
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Record a service visit for <strong>{vehicle.name}</strong>. Checked checklist items
              will automatically advance their countdowns.
            </DialogDescription>
          </DialogHeader>

          {/* Service Type Selection */}
          <div className='space-y-2'>
            <Label className='text-xs font-semibold text-foreground'>Service Type</Label>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
              {SERVICE_TYPES.map((type) => {
                const config = SERVICE_TYPE_CONFIG[type]
                const Icon = config.icon
                const isSelected = serviceType === type
                return (
                  <button
                    key={type}
                    type='button'
                    onClick={() => setServiceType(type)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                        : 'border-border/80 bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className='size-4' aria-hidden='true' />
                    <span className='text-xs font-medium'>{config.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date & Odometer Row */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label htmlFor={`${baseId}-date`} className='text-xs font-medium flex items-center gap-1.5'>
                <LuCalendar className='size-3.5 text-muted-foreground' aria-hidden='true' />
                Service Date
              </Label>
              <DatePicker
                id={`${baseId}-date`}
                value={serviceDate}
                onChange={setServiceDate}
                maxDate={todayStr}
                className='text-xs'
              />
            </div>

            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <Label htmlFor={`${baseId}-odo`} className='text-xs font-medium flex items-center gap-1.5'>
                  <LuGauge className='size-3.5 text-muted-foreground' aria-hidden='true' />
                  Odometer Reading
                </Label>
                {isPredictedOdometer && !isCustomOdo ? (
                  <span className='inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary'>
                    <LuSparkles className='size-2.5' aria-hidden='true' />
                    Estimated
                  </span>
                ) : (
                  <span className='text-[10px] text-muted-foreground font-mono'>
                    Last recorded: {vehicle.current_odometer.toLocaleString()} {vehicle.odometer_unit}
                  </span>
                )}
              </div>
              <InputGroup suffix={vehicle.odometer_unit}>
                <Input
                  id={`${baseId}-odo`}
                  type='number'
                  min={0}
                  max={2000000}
                  value={odometer}
                  onChange={(e) => {
                    setOdometer(parseInt(e.target.value, 10) || 0)
                    setIsCustomOdo(true)
                  }}
                  required
                  className='text-xs font-mono min-h-10'
                />
              </InputGroup>
              {isPredictedOdometer && !isCustomOdo ? (
                <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                  <span>Auto-estimated from daily driving velocity.</span>
                  <button
                    type='button'
                    onClick={() => {
                      setOdometer(vehicle.current_odometer)
                      setIsCustomOdo(true)
                    }}
                    className='text-primary hover:underline font-medium cursor-pointer'
                  >
                    Use recorded ({vehicle.current_odometer.toLocaleString()})
                  </button>
                </div>
              ) : isCustomOdo && Number(odometer) !== vehicle.current_odometer ? (
                <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                  <span>Custom manual entry.</span>
                  <button
                    type='button'
                    onClick={() => {
                      const resetVal = isPredictedOdometer
                        ? (predictedOdometer || vehicle.current_odometer)
                        : vehicle.current_odometer
                      setOdometer(resetVal)
                      setIsCustomOdo(false)
                    }}
                    className='text-primary hover:underline font-medium cursor-pointer'
                  >
                    Reset to {isPredictedOdometer ? 'estimate' : 'recorded'} ({isPredictedOdometer ? (predictedOdometer || vehicle.current_odometer).toLocaleString() : vehicle.current_odometer.toLocaleString()})
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Odometer Typo Jump Warning */}
          {isTypoJump && (
            <div className='rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 space-y-2'>
              <div className='flex items-center gap-2 font-semibold'>
                <LuTriangleAlert className='size-4 text-amber-600 dark:text-amber-400 shrink-0' />
                <span>Large Odometer Increase Detected (+{(Number(odometer) - vehicle.current_odometer).toLocaleString()} {vehicle.odometer_unit})</span>
              </div>
              <p className='text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed'>
                You entered <strong>{Number(odometer).toLocaleString()} {vehicle.odometer_unit}</strong>, which jumps current mileage ({vehicle.current_odometer.toLocaleString()} {vehicle.odometer_unit}) by more than 3,000. Please verify you did not type an extra zero.
              </p>
              <div className='flex items-center gap-2 pt-1'>
                <Checkbox
                  id={`${baseId}-typo-jump`}
                  checked={confirmTypoJump}
                  onCheckedChange={(val) => setConfirmTypoJump(Boolean(val))}
                />
                <Label
                  htmlFor={`${baseId}-typo-jump`}
                  className='cursor-pointer font-medium text-foreground text-xs'
                >
                  Yes, this high reading is correct
                </Label>
              </div>
            </div>
          )}

          {/* Maintenance Rules Checklist */}
          <div className='space-y-2.5 rounded-xl border border-border/80 bg-muted/20 p-3.5'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div>
                <Label className='text-xs font-semibold text-foreground'>
                  Vehicle Maintenance Checklist
                </Label>
                <p className='text-[11px] text-muted-foreground'>
                  Select items performed during this service visit.
                </p>
              </div>

              {rulesWithStatus.length > 0 && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleSelectDueOrOverdue}
                  className='h-7 text-[11px] gap-1'
                >
                  <LuSparkles className='size-3 text-amber-500' aria-hidden='true' />
                  Select Due Items
                </Button>
              )}
            </div>

            {rulesWithStatus.length === 0 ? (
              <p className='text-xs text-muted-foreground py-2 text-center'>
                No maintenance rules configured for this vehicle yet. You can still add custom parts
                below or configure rules in the Maintenance Rules tab.
              </p>
            ) : (
              <div className='max-h-48 space-y-1.5 overflow-y-auto pr-1'>
                {rulesWithStatus.map(({ rule, status }) => {
                  const isChecked = selectedRuleIds.includes(rule.id)
                  return (
                    <div
                      key={rule.id}
                      className={`flex items-center justify-between gap-3 rounded-lg border p-2.5 transition-colors text-xs ${
                        isChecked
                          ? 'border-primary/50 bg-primary/5 text-foreground'
                          : 'border-border/60 bg-card hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <div className='flex items-center gap-2.5 min-w-0'>
                        <Checkbox
                          id={`${baseId}-rule-${rule.id}`}
                          checked={isChecked}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                        />
                        <Label
                          htmlFor={`${baseId}-rule-${rule.id}`}
                          className='font-medium text-foreground truncate cursor-pointer'
                        >
                          {rule.name}
                        </Label>
                      </div>

                      <div className='flex items-center gap-1.5 shrink-0'>
                        {status.isOverdue ? (
                          <Badge
                            variant='outline'
                            className='inline-flex items-center gap-1 border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive'
                          >
                            <LuShieldAlert className='size-2.5' aria-hidden='true' />
                            Overdue
                          </Badge>
                        ) : status.isDueSoon ? (
                          <Badge
                            variant='outline'
                            className='inline-flex items-center gap-1 border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400'
                          >
                            <LuClock className='size-2.5' aria-hidden='true' />
                            Due Soon
                          </Badge>
                        ) : (
                          <Badge
                            variant='outline'
                            className='inline-flex items-center gap-1 border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400'
                          >
                            <LuCheck className='size-2.5' aria-hidden='true' />
                            Good
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Custom Extra Items */}
            <div className='pt-2 border-t border-border/60 space-y-2'>
              <Label htmlFor={`${baseId}-custom-item`} className='text-[11px] font-medium text-muted-foreground'>
                Other Services or Replaced Parts (Not in checklist)
              </Label>
              <div className='flex gap-2'>
                <Input
                  id={`${baseId}-custom-item`}
                  placeholder='e.g. Wheel Alignment, Wiper Fluid, Battery Top-up'
                  value={customItemInput}
                  onChange={(e) => setCustomItemInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCustomItem()
                    }
                  }}
                  className='h-8 text-xs'
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleAddCustomItem}
                  className='h-8 px-2.5 text-xs'
                >
                  <LuPlus className='size-3.5' aria-hidden='true' />
                  Add
                </Button>
              </div>

              {customItems.length > 0 && (
                <div className='flex flex-wrap gap-1.5 pt-1'>
                  {customItems.map((item) => (
                    <span
                      key={item}
                      className='inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground'
                    >
                      {item}
                      <button
                        type='button'
                        onClick={() => handleRemoveCustomItem(item)}
                        className='text-muted-foreground hover:text-destructive cursor-pointer'
                        aria-label={`Remove ${item}`}
                      >
                        <LuX className='size-3' aria-hidden='true' />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cost & Workshop Info */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div className='space-y-1.5'>
              <Label htmlFor={`${baseId}-cost`} className='text-xs font-medium'>
                Total Cost
              </Label>
              <InputGroup prefix={vehicle.currency}>
                <Input
                  id={`${baseId}-cost`}
                  type='number'
                  min={0}
                  step='any'
                  placeholder='0'
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className='text-xs font-mono min-h-10'
                />
              </InputGroup>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor={`${baseId}-workshop`} className='text-xs font-medium'>
                Workshop / Mechanic
              </Label>
              <Input
                id={`${baseId}-workshop`}
                placeholder='e.g. Honda Official Service'
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
                maxLength={100}
                className='text-xs'
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor={`${baseId}-invoice-num`} className='text-xs font-medium'>
                Invoice / Receipt #
              </Label>
              <Input
                id={`${baseId}-invoice-num`}
                placeholder='e.g. INV-2026-8842'
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                maxLength={100}
                className='text-xs font-mono'
              />
            </div>
          </div>

          {/* Receipt URL (Google Drive / Dropbox) with Preview */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor={`${baseId}-receipt-url`} className='text-xs font-medium flex items-center gap-1.5'>
                <LuReceipt className='size-3.5 text-muted-foreground' aria-hidden='true' />
                Cloud Receipt / Invoice Link
              </Label>
              <span className='text-[0.68rem] text-muted-foreground'>Optional</span>
            </div>

            <Input
              id={`${baseId}-receipt-url`}
              type='url'
              placeholder='https://drive.google.com/file/d/... or Dropbox link'
              value={invoiceUrl}
              onChange={(e) => setInvoiceUrl(e.target.value)}
              className='text-xs font-mono'
            />

            {sanitizedInvoice.isValid && (
              <div className='flex items-center gap-3 rounded-lg border border-border/80 bg-muted/20 p-2 text-xs'>
                {sanitizedInvoice.thumbnailUrl ? (
                  <div className='relative size-12 shrink-0 overflow-hidden rounded border border-border/80 bg-background'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sanitizedInvoice.thumbnailUrl}
                      alt='Receipt preview'
                      className='size-full object-cover'
                    />
                  </div>
                ) : (
                  <div className='flex size-12 shrink-0 items-center justify-center rounded border border-border/80 bg-background text-muted-foreground'>
                    <LuFileText className='size-5' aria-hidden='true' />
                  </div>
                )}

                <div className='min-w-0 flex-1'>
                  <p className='text-[11px] font-semibold text-foreground truncate'>
                    {sanitizedInvoice.isDrive
                      ? 'Google Drive Receipt Stream'
                      : sanitizedInvoice.isDropbox
                        ? 'Dropbox Cloud Receipt'
                        : 'External Invoice URL'}
                  </p>
                  <a
                    href={sanitizedInvoice.viewUrl || invoiceUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1 text-[10px] text-primary hover:underline'
                  >
                    Open link in new tab
                    <LuExternalLink className='size-2.5' aria-hidden='true' />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Optional Cashflow Ledger Sync */}
          {cashflowBooks && cashflowBooks.length > 0 && (
            <div className='rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-3'>
              <div className='flex items-start gap-2.5'>
                <Checkbox
                  id={syncCashflowId}
                  checked={recordToCashflow}
                  onCheckedChange={(val) => setRecordToCashflow(Boolean(val))}
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
                    Automatically creates an expense entry with vehicle tags when logged.
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

          {/* Notes */}
          <div className='space-y-1.5'>
            <Label htmlFor={`${baseId}-notes`} className='text-xs font-medium'>
              Service Notes & Recommendations
            </Label>
            <Textarea
              id={`${baseId}-notes`}
              placeholder='e.g. Mechanic advised replacing front brake pads on next visit. Used Motul 5W-30 fully synthetic oil.'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={2000}
              className='text-xs'
            />
          </div>

          <DialogFooter className='gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={onClose}
              disabled={isPending}
              className='text-xs'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              size='sm'
              loading={isPending}
              className='text-xs'
            >
              Save Service Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
