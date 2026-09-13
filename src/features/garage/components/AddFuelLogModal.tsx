'use client'

import { useState, useTransition, useId } from 'react'
import { toast } from 'react-toastify'
import {
  LuFuel,
  LuCalendar,
  LuGauge,
  LuCoins,
  LuSparkles,
  LuRotateCcw,
  LuWallet,
  LuTriangleAlert,
  LuBatteryCharging,
  LuFileText,
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
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { VehicleDTO, VehicleFuelLogDTO } from '@/types/dto'
import { EXPENSE_CATEGORIES } from '@/features/cashflow/constants'
import { createVehicleFuelLog, updateVehicleFuelLog } from '../actions'
import {
  getFuelUnitLabels,
  calculateFuelAmountFromTotal,
  calculateTotalCostFromAmount,
} from '../lib/fuel-math'
import { isOdometerTypoJump } from '../lib/odometer'
import { getTodayDateOnlyString } from '@/lib/date-only'

interface AddFuelLogModalProps {
  vehicle: VehicleDTO
  predictedOdometer?: number
  isPredictedOdometer?: boolean
  isOpen: boolean
  onClose: () => void
  cashflowBooks?: Array<{ id: string; title: string; currency?: string }>
  onSuccess?: (newLog: VehicleFuelLogDTO) => void
  logToEdit?: VehicleFuelLogDTO | null
}

export function AddFuelLogModal({
  vehicle,
  predictedOdometer,
  isPredictedOdometer = false,
  isOpen,
  onClose,
  cashflowBooks = [],
  onSuccess,
  logToEdit,
}: AddFuelLogModalProps) {
  const isEditing = Boolean(logToEdit)
  const [isPending, startTransition] = useTransition()
  const datePickerId = useId()

  const unitLabels = getFuelUnitLabels(vehicle.fuel_type, vehicle.odometer_unit)
  const isElectric = vehicle.fuel_type === 'electric'

  const todayStr = getTodayDateOnlyString()
  const initialEstOdo = predictedOdometer || vehicle.current_odometer

  const [logDate, setLogDate] = useState<string>(logToEdit?.log_date ?? todayStr)
  const [odometer, setOdometer] = useState<number>(
    logToEdit ? logToEdit.odometer : initialEstOdo,
  )
  const [hasEditedOdometer, setHasEditedOdometer] = useState<boolean>(Boolean(logToEdit))

  // Pump values
  const [fuelAmount, setFuelAmount] = useState<string>(
    logToEdit ? String(logToEdit.fuel_amount) : '',
  )
  const [pricePerUnit, setPricePerUnit] = useState<string>(
    logToEdit?.price_per_unit !== null && logToEdit?.price_per_unit !== undefined
      ? String(logToEdit.price_per_unit)
      : '',
  )
  const [totalCost, setTotalCost] = useState<string>(
    logToEdit ? String(logToEdit.total_cost) : '',
  )

  // State toggles
  const [isFullTank, setIsFullTank] = useState<boolean>(
    logToEdit ? logToEdit.is_full_tank : true,
  )
  const [isMissedPrevious, setIsMissedPrevious] = useState<boolean>(
    logToEdit ? logToEdit.is_missed_previous : false,
  )
  const [batteryStartPct, setBatteryStartPct] = useState<string>(
    logToEdit?.battery_start_pct !== null && logToEdit?.battery_start_pct !== undefined
      ? String(logToEdit.battery_start_pct)
      : '20',
  )
  const [batteryEndPct, setBatteryEndPct] = useState<string>(
    logToEdit?.battery_end_pct !== null && logToEdit?.battery_end_pct !== undefined
      ? String(logToEdit.battery_end_pct)
      : '80',
  )
  const [notes, setNotes] = useState<string>(logToEdit?.notes || '')

  // Typo Jump Confirmation
  const [confirmTypoJump, setConfirmTypoJump] = useState<boolean>(false)
  const [jumpWarningMessage, setJumpWarningMessage] = useState<string | null>(null)

  // Cashflow Integration
  const [recordToCashflow, setRecordToCashflow] = useState<boolean>(
    Boolean(vehicle.preferred_cashflow_id && cashflowBooks.length > 0),
  )
  const [cashflowId, setCashflowId] = useState<string>(
    vehicle.preferred_cashflow_id || (cashflowBooks[0]?.id ?? ''),
  )
  const [cashflowCategory, setCashflowCategory] = useState<string>('Transport')

  // Synchronize form state during render phase when modal opens or logToEdit changes
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen)
  const [prevLogId, setPrevLogId] = useState<string | null>(logToEdit?.id ?? null)

  if (isOpen !== prevIsOpen || (logToEdit?.id ?? null) !== prevLogId) {
    setPrevIsOpen(isOpen)
    setPrevLogId(logToEdit?.id ?? null)

    if (isOpen) {
      if (logToEdit) {
        setLogDate(logToEdit.log_date)
        setOdometer(logToEdit.odometer)
        setHasEditedOdometer(true)
        setFuelAmount(String(logToEdit.fuel_amount))
        setPricePerUnit(logToEdit.price_per_unit !== null ? String(logToEdit.price_per_unit) : '')
        setTotalCost(String(logToEdit.total_cost))
        setIsFullTank(logToEdit.is_full_tank)
        setIsMissedPrevious(logToEdit.is_missed_previous)
        setBatteryStartPct(logToEdit.battery_start_pct !== null ? String(logToEdit.battery_start_pct) : '20')
        setBatteryEndPct(logToEdit.battery_end_pct !== null ? String(logToEdit.battery_end_pct) : '80')
        setNotes(logToEdit.notes || '')
        setConfirmTypoJump(false)
        setJumpWarningMessage(null)
        setRecordToCashflow(false)
      } else {
        const initialOdo = predictedOdometer || vehicle.current_odometer
        setLogDate(todayStr)
        setOdometer(initialOdo)
        setHasEditedOdometer(false)
        setFuelAmount('')
        setPricePerUnit('')
        setTotalCost('')
        setIsFullTank(true)
        setIsMissedPrevious(false)
        setBatteryStartPct('20')
        setBatteryEndPct('80')
        setNotes('')
        setConfirmTypoJump(false)
        setJumpWarningMessage(null)
        setRecordToCashflow(Boolean(vehicle.preferred_cashflow_id && cashflowBooks.length > 0))
        setCashflowId(vehicle.preferred_cashflow_id || (cashflowBooks[0]?.id ?? ''))
        setCashflowCategory('Transport')
      }
    }
  }

  const selectedCashflowBook = cashflowBooks.find((b) => b.id === cashflowId)
  const hasCurrencyMismatch =
    selectedCashflowBook?.currency &&
    selectedCashflowBook.currency.toUpperCase() !== vehicle.currency.toUpperCase()

  // Dynamic Pump Calculation Handlers
  const handleTotalCostChange = (val: string) => {
    setTotalCost(val)
    const numCost = Number(val)
    const numPrice = Number(pricePerUnit)
    if (numCost > 0 && numPrice > 0) {
      const calculatedVolume = calculateFuelAmountFromTotal(numCost, numPrice)
      if (calculatedVolume !== null) {
        setFuelAmount(String(calculatedVolume))
      }
    }
  }

  const handleFuelAmountChange = (val: string) => {
    setFuelAmount(val)
    const numVolume = Number(val)
    const numPrice = Number(pricePerUnit)
    if (numVolume > 0 && numPrice > 0) {
      const calculatedCost = calculateTotalCostFromAmount(numVolume, numPrice)
      if (calculatedCost !== null) {
        setTotalCost(String(calculatedCost))
      }
    }
  }

  const handlePricePerUnitChange = (val: string) => {
    setPricePerUnit(val)
    const numPrice = Number(val)
    const numVolume = Number(fuelAmount)
    const numCost = Number(totalCost)

    if (numPrice > 0) {
      if (numCost > 0) {
        const calculatedVolume = calculateFuelAmountFromTotal(numCost, numPrice)
        if (calculatedVolume !== null) {
          setFuelAmount(String(calculatedVolume))
        }
      } else if (numVolume > 0) {
        const calculatedCost = calculateTotalCostFromAmount(numVolume, numPrice)
        if (calculatedCost !== null) {
          setTotalCost(String(calculatedCost))
        }
      }
    }
  }

  const handleOdometerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0
    setOdometer(val)
    setHasEditedOdometer(true)
    setConfirmTypoJump(false)
    setJumpWarningMessage(null)
  }

  const handleResetToEstimate = () => {
    setOdometer(initialEstOdo)
    setHasEditedOdometer(false)
    setConfirmTypoJump(false)
    setJumpWarningMessage(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const numAmount = Number(fuelAmount)
    if (!numAmount || numAmount <= 0) {
      toast.error(`Please enter a valid fuel volume in ${unitLabels.volumeUnitFull}`)
      return
    }

    const numCost = Number(totalCost)
    if (isNaN(numCost) || numCost < 0) {
      toast.error('Please enter a valid total cost')
      return
    }

    if (recordToCashflow && !cashflowId) {
      toast.error('Please select a Cashflow book to record this transaction')
      return
    }

    // Client-side fat-finger check
    const isJump = isOdometerTypoJump(odometer, vehicle.current_odometer)
    if (isJump && !confirmTypoJump) {
      const delta = odometer - vehicle.current_odometer
      setJumpWarningMessage(
        `Odometer reading (+${delta.toLocaleString()} ${vehicle.odometer_unit}) is unusually high compared to last recorded (${vehicle.current_odometer.toLocaleString()} ${vehicle.odometer_unit}). Did you make a typo?`,
      )
      return
    }

    startTransition(async () => {
      const payload = {
        vehicleId: vehicle.id,
        logDate,
        odometer,
        fuelAmount: numAmount,
        pricePerUnit: pricePerUnit ? Number(pricePerUnit) : null,
        totalCost: numCost,
        isFullTank,
        isMissedPrevious,
        batteryStartPct: isElectric && batteryStartPct ? Number(batteryStartPct) : null,
        batteryEndPct: isElectric && batteryEndPct ? Number(batteryEndPct) : null,
        notes: notes.trim() || null,
        confirmTypoJump,
        recordToCashflow: isEditing ? false : recordToCashflow,
        cashflowId: isEditing ? null : recordToCashflow ? cashflowId : null,
        cashflowCategory: isEditing ? null : recordToCashflow ? cashflowCategory : null,
      }

      const res = isEditing && logToEdit
        ? await updateVehicleFuelLog({ id: logToEdit.id, ...payload })
        : await createVehicleFuelLog(payload)

      if (res.requiresConfirmation) {
        setJumpWarningMessage(res.error || 'Odometer jump confirmation required')
        return
      }

      if (res.success && res.data) {
        toast.success(
          isEditing
            ? 'Fuel log updated successfully!'
            : res.data.calculated_kml !== null
              ? `Fill-up logged! Economy: ${res.data.calculated_kml} ${unitLabels.efficiencyUnit}`
              : 'Fill-up logged successfully!',
        )
        if (res.warning) {
          toast.warning(res.warning)
        }
        onSuccess?.(res.data)
        onClose()
      } else {
        toast.error(res.error || (isEditing ? 'Failed to update fuel log' : 'Failed to record fuel log'))
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-base font-semibold text-foreground'>
            <LuFuel className='size-5 text-primary shrink-0' aria-hidden='true' />
            <span>{isEditing ? 'Edit Fuel Log' : 'Log Fuel Fill-up'}</span>
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            {isEditing
              ? `Update receipt details for ${vehicle.name} and recalculate mileage efficiency sequence.`
              : `Record gas station pump details for ${vehicle.name} to track mileage efficiency, cost per ${vehicle.odometer_unit}, and auto-sync odometer.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-1'>
          {/* Typo Jump Confirmation Alert */}
          {jumpWarningMessage && (
            <div className='rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 space-y-2'>
              <div className='flex items-start gap-2'>
                <LuTriangleAlert className='size-4 shrink-0 mt-0.5' />
                <p className='font-medium'>{jumpWarningMessage}</p>
              </div>
              <div className='flex items-center gap-2 pt-1'>
                <Checkbox
                  id='confirm-jump-checkbox'
                  checked={confirmTypoJump}
                  onCheckedChange={(checked) => setConfirmTypoJump(Boolean(checked))}
                />
                <Label htmlFor='confirm-jump-checkbox' className='text-xs cursor-pointer'>
                  Yes, this odometer reading ({odometer.toLocaleString()} {vehicle.odometer_unit}) is correct.
                </Label>
              </div>
            </div>
          )}

          {/* Date & Odometer Row */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <Label htmlFor={datePickerId} className='text-xs font-medium flex items-center gap-1.5 mb-1'>
                <LuCalendar className='size-3.5 text-muted-foreground' aria-hidden='true' />
                Fill-up Date
              </Label>
              <DatePicker
                id={datePickerId}
                value={logDate}
                onChange={setLogDate}
                className='w-full'
              />
            </div>

            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='fuel-odometer' className='text-xs font-medium flex items-center gap-1.5'>
                  <LuGauge className='size-3.5 text-muted-foreground' aria-hidden='true' />
                  Odometer ({vehicle.odometer_unit})
                </Label>
                {isPredictedOdometer && (
                  <div className='flex items-center gap-1.5'>
                    {!hasEditedOdometer ? (
                      <span className='inline-flex items-center gap-1 text-[0.68rem] text-primary font-medium bg-primary/10 rounded px-1.5 py-0.5'>
                        <LuSparkles className='size-2.5' aria-hidden='true' />
                        Est. {initialEstOdo.toLocaleString()}
                      </span>
                    ) : (
                      <button
                        type='button'
                        onClick={handleResetToEstimate}
                        className='inline-flex items-center gap-1 text-[0.68rem] text-muted-foreground hover:text-foreground font-medium cursor-pointer transition-colors'
                        title='Reset to calculated odometer estimate'
                      >
                        <LuRotateCcw className='size-2.5' aria-hidden='true' />
                        Reset to Est.
                      </button>
                    )}
                  </div>
                )}
              </div>
              <Input
                id='fuel-odometer'
                type='number'
                min={0}
                max={2000000}
                value={odometer || ''}
                onChange={handleOdometerChange}
                required
                className='font-mono text-xs'
              />
            </div>
          </div>

          {/* Pump Dual-Input Section */}
          <div className='rounded-lg border border-border/70 bg-card/60 p-3.5 space-y-3'>
            <div className='flex items-center justify-between text-xs text-muted-foreground border-b border-border/50 pb-2'>
              <span className='font-semibold text-foreground flex items-center gap-1.5'>
                <LuCoins className='size-3.5 text-primary' aria-hidden='true' />
                Gas Pump Calculator
              </span>
              <span className='text-[0.68rem]'>
                Cost + Price auto-calculates volume
              </span>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              {/* Total Cost */}
              <div>
                <Label htmlFor='fuel-total-cost' className='text-xs font-medium mb-1 block'>
                  Total Cost ({vehicle.currency})
                </Label>
                <InputGroup prefix={vehicle.currency}>
                  <Input
                    id='fuel-total-cost'
                    type='number'
                    min={0}
                    step='any'
                    placeholder='0'
                    value={totalCost}
                    onChange={(e) => handleTotalCostChange(e.target.value)}
                    required
                    className='font-mono text-xs'
                  />
                </InputGroup>
              </div>

              {/* Price Per Unit */}
              <div>
                <Label htmlFor='fuel-price-unit' className='text-xs font-medium mb-1 block'>
                  {unitLabels.priceUnitLabel}
                </Label>
                <InputGroup prefix={vehicle.currency}>
                  <Input
                    id='fuel-price-unit'
                    type='number'
                    min={0}
                    step='any'
                    placeholder='0'
                    value={pricePerUnit}
                    onChange={(e) => handlePricePerUnitChange(e.target.value)}
                    className='font-mono text-xs'
                  />
                </InputGroup>
              </div>

              {/* Fuel Volume */}
              <div>
                <Label htmlFor='fuel-amount' className='text-xs font-medium mb-1 block'>
                  Volume ({unitLabels.volumeUnit})
                </Label>
                <InputGroup suffix={unitLabels.volumeUnit}>
                  <Input
                    id='fuel-amount'
                    type='number'
                    min={0.01}
                    step='any'
                    placeholder='0.00'
                    value={fuelAmount}
                    onChange={(e) => handleFuelAmountChange(e.target.value)}
                    required
                    className='font-mono text-xs'
                  />
                </InputGroup>
              </div>
            </div>
          </div>

          {/* Electric Vehicle Battery Charging Fields */}
          {isElectric && (
            <div className='rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2.5'>
              <div className='flex items-center gap-1.5 text-xs font-semibold text-primary'>
                <LuBatteryCharging className='size-4' aria-hidden='true' />
                <span>EV Battery Charging Levels</span>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <Label htmlFor='battery-start' className='text-xs font-medium mb-1 block'>
                    Start Battery (%)
                  </Label>
                  <InputGroup suffix='%'>
                    <Input
                      id='battery-start'
                      type='number'
                      min={0}
                      max={100}
                      value={batteryStartPct}
                      onChange={(e) => setBatteryStartPct(e.target.value)}
                      className='font-mono text-xs'
                    />
                  </InputGroup>
                </div>
                <div>
                  <Label htmlFor='battery-end' className='text-xs font-medium mb-1 block'>
                    Target Battery (%)
                  </Label>
                  <InputGroup suffix='%'>
                    <Input
                      id='battery-end'
                      type='number'
                      min={0}
                      max={100}
                      value={batteryEndPct}
                      onChange={(e) => setBatteryEndPct(e.target.value)}
                      className='font-mono text-xs'
                    />
                  </InputGroup>
                </div>
              </div>
            </div>
          )}

          {/* Fill-up State Toggles */}
          <div className='rounded-lg border border-border/70 p-3 space-y-2 bg-secondary/15'>
            <div className='flex items-start gap-2'>
              <Checkbox
                id='fuel-full-tank'
                checked={isFullTank}
                onCheckedChange={(checked) => setIsFullTank(Boolean(checked))}
                className='mt-0.5'
              />
              <div className='space-y-0.5'>
                <Label htmlFor='fuel-full-tank' className='text-xs font-medium cursor-pointer'>
                  {isElectric
                    ? 'Charged to Target Limit (80% or 100%)'
                    : 'Full Tank Fill-up (Default)'}
                </Label>
                <p className='text-[0.72rem] text-muted-foreground'>
                  {isElectric
                    ? 'Required to calculate energy consumption (km/kWh).'
                    : 'Uncheck if partial fill-up. Economy calculation stays pending until next full tank.'}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-2 pt-1 border-t border-border/40'>
              <Checkbox
                id='fuel-missed-prev'
                checked={isMissedPrevious}
                onCheckedChange={(checked) => setIsMissedPrevious(Boolean(checked))}
                className='mt-0.5'
              />
              <div className='space-y-0.5'>
                <Label htmlFor='fuel-missed-prev' className='text-xs font-medium cursor-pointer'>
                  Missed previous fill-up?
                </Label>
                <p className='text-[0.72rem] text-muted-foreground'>
                  Resets calculation baseline so skipped receipts don’t distort fuel efficiency.
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor='fuel-notes' className='text-xs font-medium flex items-center gap-1.5 mb-1'>
              <LuFileText className='size-3.5 text-muted-foreground' aria-hidden='true' />
              Notes (Optional)
            </Label>
            <Textarea
              id='fuel-notes'
              rows={2}
              placeholder='e.g. Shell V-Power Nitro+, Gas Station Rest Area KM 57'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className='text-xs resize-none'
            />
          </div>

          {/* Day 6: Cross-App Cashflow Sync (Only when recording new fill-up) */}
          {!isEditing && (
            <div className='rounded-lg border border-border/70 p-3.5 space-y-3 bg-secondary/20'>
              <div className='flex items-start justify-between gap-3'>
                <div className='space-y-0.5'>
                  <div className='flex items-center gap-2'>
                    <LuWallet className='size-4 text-primary shrink-0' aria-hidden='true' />
                    <Label htmlFor='fuel-cashflow-toggle' className='text-xs font-semibold cursor-pointer'>
                      Record to Cashflow Ledger
                    </Label>
                  </div>
                  <p className='text-[0.72rem] text-muted-foreground'>
                    Automatically sync this fuel fill-up as an expense transaction with 1 click.
                  </p>
                </div>
                <Checkbox
                  id='fuel-cashflow-toggle'
                  checked={recordToCashflow}
                  onCheckedChange={(checked) => setRecordToCashflow(Boolean(checked))}
                />
              </div>

              {recordToCashflow && (
                <div className='space-y-3 pt-2 border-t border-border/50'>
                  {cashflowBooks.length === 0 ? (
                    <p className='text-xs text-amber-500'>
                      No Cashflow books found. Create a Cashflow book first to sync transactions.
                    </p>
                  ) : (
                    <>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        <div>
                          <Label className='text-xs font-medium mb-1 block'>Cashflow Book</Label>
                          <Select value={cashflowId} onValueChange={setCashflowId}>
                            <SelectTrigger className='text-xs min-h-9'>
                              <SelectValue placeholder='Select Cashflow book' />
                            </SelectTrigger>
                            <SelectContent>
                              {cashflowBooks.map((b) => (
                                <SelectItem key={b.id} value={b.id} className='text-xs'>
                                  {b.title} {b.currency ? `(${b.currency})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className='text-xs font-medium mb-1 block'>Expense Category</Label>
                          <Select value={cashflowCategory} onValueChange={setCashflowCategory}>
                            <SelectTrigger className='text-xs min-h-9'>
                              <SelectValue placeholder='Category' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='Transport' className='text-xs'>
                                Transport (Recommended)
                              </SelectItem>
                              {EXPENSE_CATEGORIES.filter((c) => c.value !== 'transport').map((c) => (
                                <SelectItem key={c.value} value={c.label} className='text-xs'>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Currency Mismatch Warning */}
                      {hasCurrencyMismatch && (
                        <div className='rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2'>
                          <LuTriangleAlert className='size-3.5 shrink-0 mt-0.5' />
                          <div>
                            <strong>Currency Mismatch Notice:</strong> Vehicle is set to{' '}
                            <span className='font-mono font-bold'>{vehicle.currency}</span>, but{' '}
                            {selectedCashflowBook?.title} operates in{' '}
                            <span className='font-mono font-bold'>{selectedCashflowBook?.currency}</span>.
                            The transaction will record with amount{' '}
                            <span className='font-mono'>{Number(totalCost || 0).toLocaleString()}</span>.
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className='gap-2 pt-2 sm:space-x-0'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isPending}
              className='text-xs min-h-10'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isPending}
              className='text-xs min-h-10'
            >
              {isPending
                ? isEditing
                  ? 'Updating...'
                  : 'Saving Fill-up...'
                : isEditing
                  ? 'Update Fuel Log'
                  : 'Save Fuel Fill-up'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
