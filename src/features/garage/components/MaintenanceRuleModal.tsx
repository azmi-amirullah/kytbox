'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import {
  LuPlus,
  LuWrench,
  LuSave,
  LuSparkles,
  LuCalendar,
  LuGauge,
  LuCircleDot,
  LuCircle,
  LuChevronDown,
  LuChevronUp,
} from 'react-icons/lu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  FuelType,
  MaintenanceCategory,
  OdometerUnit,
  TransmissionType,
  VehicleMaintenanceRuleDTO,
  VehicleType,
} from '@/types/dto'
import { isMaintenanceCategory } from '../types'
import { createMaintenanceRule, updateMaintenanceRule } from '../actions'
import { getDefaultRulesForVehicle, type MaintenanceRulePresetItem } from '../lib/presets'

interface MaintenanceRuleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicleId: string
  currentOdometer: number
  odometerUnit: OdometerUnit
  vehicleType?: VehicleType
  fuelType?: FuelType
  transmission?: TransmissionType
  ruleToEdit?: VehicleMaintenanceRuleDTO | null
  onSuccess?: (rule: VehicleMaintenanceRuleDTO) => void
}

const CATEGORY_OPTIONS: { value: MaintenanceCategory; label: string }[] = [
  { value: 'fluids', label: 'Fluids & Lubrication' },
  { value: 'filters', label: 'Air & Cabin Filters' },
  { value: 'brakes', label: 'Brakes & Hydraulics' },
  { value: 'tires', label: 'Tires & Wheels' },
  { value: 'powertrain', label: 'Powertrain & Drivetrain' },
  { value: 'electrical', label: 'Electrical & Ignition' },
  { value: 'other', label: 'Inspections & Other' },
]

export function MaintenanceRuleModal({
  open,
  onOpenChange,
  vehicleId,
  currentOdometer,
  odometerUnit,
  vehicleType = 'car',
  fuelType = 'petrol',
  transmission = 'automatic',
  ruleToEdit,
  onSuccess,
}: MaintenanceRuleModalProps) {
  const isEdit = !!ruleToEdit
  const isMiles = odometerUnit === 'miles'

  const suggestions = useMemo(() => {
    return getDefaultRulesForVehicle(vehicleType, fuelType, odometerUnit, transmission)
  }, [vehicleType, fuelType, odometerUnit, transmission])

  const [name, setName] = useState('')
  const [category, setCategory] = useState<MaintenanceCategory>('fluids')
  const [intervalDistance, setIntervalDistance] = useState('')
  const [intervalMonths, setIntervalMonths] = useState('')
  const [baselineChoice, setBaselineChoice] = useState<'current' | 'custom' | 'none'>('current')
  const [lastServiceOdometer, setLastServiceOdometer] = useState('')
  const [lastServiceDate, setLastServiceDate] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(false)

  // Initialize or reset form state
  useEffect(() => {
    if (ruleToEdit) {
      setName(ruleToEdit.name)
      setCategory(ruleToEdit.category)
      setIntervalDistance(ruleToEdit.interval_distance ? String(ruleToEdit.interval_distance) : '')
      setIntervalMonths(ruleToEdit.interval_months ? String(ruleToEdit.interval_months) : '')
      setLastServiceOdometer(
        ruleToEdit.last_service_odometer !== null ? String(ruleToEdit.last_service_odometer) : ''
      )
      setLastServiceDate(ruleToEdit.last_service_date || '')
      setIsActive(ruleToEdit.is_active)
      setBaselineChoice(
        ruleToEdit.last_service_odometer !== null || ruleToEdit.last_service_date ? 'custom' : 'none'
      )
    } else {
      setName('')
      setCategory('fluids')
      setIntervalDistance(isMiles ? '3000' : '5000')
      setIntervalMonths('6')
      setBaselineChoice('current')
      setLastServiceOdometer(String(currentOdometer))
      setLastServiceDate(new Date().toISOString().split('T')[0])
      setIsActive(true)
    }
    setIsTemplatesExpanded(false)
    setErrors({})
  }, [ruleToEdit, open, currentOdometer, isMiles])

  const handleSuggestionClick = (item: MaintenanceRulePresetItem) => {
    setName(item.name)
    setCategory(item.category)
    setIntervalDistance(item.intervalDistance !== null ? String(item.intervalDistance) : '')
    setIntervalMonths(item.intervalMonths !== null ? String(item.intervalMonths) : '')
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors: Record<string, string> = {}
    if (!name.trim()) {
      nextErrors.name = 'Rule name is required'
    }

    const distNum = intervalDistance.trim() ? Number(intervalDistance) : null
    const monthsNum = intervalMonths.trim() ? Number(intervalMonths) : null

    if ((!distNum || distNum <= 0) && (!monthsNum || monthsNum <= 0)) {
      nextErrors.interval = 'Specify at least distance or month interval'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    let finalLastOdo: number | null = null
    let finalLastDate: string | null = null

    if (isEdit) {
      finalLastOdo = lastServiceOdometer.trim() ? Number(lastServiceOdometer) : null
      finalLastDate = lastServiceDate.trim() ? lastServiceDate.trim() : null
    } else {
      if (baselineChoice === 'current') {
        finalLastOdo = currentOdometer
        finalLastDate = new Date().toISOString().split('T')[0]
      } else if (baselineChoice === 'custom') {
        finalLastOdo = lastServiceOdometer.trim() ? Number(lastServiceOdometer) : null
        finalLastDate = lastServiceDate.trim() ? lastServiceDate.trim() : null
      } else {
        finalLastOdo = null
        finalLastDate = null
      }
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      if (isEdit && ruleToEdit) {
        const res = await updateMaintenanceRule({
          id: ruleToEdit.id,
          name: name.trim(),
          category,
          intervalDistance: distNum,
          intervalMonths: monthsNum,
          lastServiceOdometer: finalLastOdo,
          lastServiceDate: finalLastDate,
          isActive,
        })

        if (!res.success || !res.data) {
          toast.error(res.error || 'Failed to update rule')
          setIsSubmitting(false)
          return
        }

        toast.success(`Updated rule "${name}"`)
        onSuccess?.(res.data)
        onOpenChange(false)
      } else {
        const res = await createMaintenanceRule({
          vehicleId,
          name: name.trim(),
          category,
          intervalDistance: distNum,
          intervalMonths: monthsNum,
          lastServiceOdometer: finalLastOdo,
          lastServiceDate: finalLastDate,
          isActive,
        })

        if (!res.success || !res.data) {
          toast.error(res.error || 'Failed to create rule')
          setIsSubmitting(false)
          return
        }

        toast.success(`Created rule "${name}"`)
        onSuccess?.(res.data)
        onOpenChange(false)
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl max-h-[90vh] overflow-y-auto' showCloseButton>
        <DialogHeader>
          <div className='flex items-center gap-2.5'>
            <div className='flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-4 ring-primary/5'>
              <LuWrench className='size-5' aria-hidden='true' />
            </div>
            <div>
              <DialogTitle className='text-base sm:text-lg font-bold text-foreground'>
                {isEdit ? 'Edit Maintenance Rule' : 'Add Maintenance Rule'}
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                {isEdit
                  ? 'Update interval thresholds, category, and recorded service baseline.'
                  : 'Define a routine service item and interval schedule for this vehicle.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-5 pt-2'>
          {/* Collapsible Quick Suggestions Bank (Create Mode Only) */}
          {!isEdit && (
            <div className='rounded-xl border border-border/70 bg-muted/20 overflow-hidden transition-all'>
              <button
                type='button'
                onClick={() => setIsTemplatesExpanded((prev) => !prev)}
                aria-expanded={isTemplatesExpanded}
                aria-controls='common-templates-list'
                className='flex w-full items-center justify-between px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer'
              >
                <div className='flex items-center gap-2'>
                  <LuSparkles className='size-3.5 text-primary shrink-0' aria-hidden='true' />
                  <span className='font-semibold text-foreground/90'>Common Templates</span>
                  <span className='rounded-full bg-primary/10 px-2 py-0.5 text-[0.62rem] font-bold text-primary'>
                    {suggestions.length} presets
                  </span>
                </div>

                <div className='flex items-center gap-1 text-[0.7rem] font-medium text-muted-foreground hover:text-foreground'>
                  <span>{isTemplatesExpanded ? 'Hide' : 'Browse templates'}</span>
                  {isTemplatesExpanded ? (
                    <LuChevronUp className='size-3.5' aria-hidden='true' />
                  ) : (
                    <LuChevronDown className='size-3.5' aria-hidden='true' />
                  )}
                </div>
              </button>

              {isTemplatesExpanded && (
                <div id='common-templates-list' className='border-t border-border/60 p-3 space-y-2 bg-card/50'>
                  <p className='text-[0.7rem] text-muted-foreground leading-relaxed'>
                    Tap any preset below to auto-fill recommended service name, category, and intervals:
                  </p>
                  <div className='flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1'>
                    {suggestions.map((item) => (
                      <button
                        key={item.name}
                        type='button'
                        onClick={() => handleSuggestionClick(item)}
                        className='flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs text-foreground/90 hover:border-primary hover:text-primary hover:bg-primary/4 transition-all cursor-pointer'
                      >
                        <span className='text-primary font-bold'>+</span>
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rule Name */}
          <div className='space-y-1.5'>
            <Label htmlFor='rule-name' className='text-xs font-semibold'>
              Item Name <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='rule-name'
              placeholder='e.g. Engine Oil & Filter, Ferrox Air Filter, Front Brake Pads'
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              className='h-9.5 text-xs'
            />
            {errors.name && <p className='text-xs text-destructive'>{errors.name}</p>}
          </div>

          {/* Category */}
          <div className='space-y-1.5'>
            <Label htmlFor='rule-category' className='text-xs font-semibold'>
              Category
            </Label>
            <Select
              value={category}
              onValueChange={(val) => {
                if (isMaintenanceCategory(val)) {
                  setCategory(val)
                }
              }}
            >
              <SelectTrigger id='rule-category' className='w-full h-9.5 text-xs cursor-pointer'>
                <SelectValue placeholder='Select category' />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className='text-xs cursor-pointer'>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dual-Criterion Interval Inputs with Visual Connector */}
          <div className='rounded-xl border border-border/80 bg-muted/25 p-3.5 space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-bold text-foreground'>
                Service Interval Criteria
              </span>
              <Badge variant='outline' className='text-[0.62rem] font-mono uppercase bg-card'>
                Whichever Arrives First
              </Badge>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {/* Distance Input */}
              <div className='space-y-1.5'>
                <Label htmlFor='rule-distance' className='text-xs text-muted-foreground flex items-center gap-1'>
                  <LuGauge className='size-3 text-primary' /> Distance ({odometerUnit})
                </Label>
                <Input
                  id='rule-distance'
                  type='number'
                  min={1}
                  step='any'
                  placeholder={`e.g. ${isMiles ? '3000' : '5000'}`}
                  value={intervalDistance}
                  onChange={(e) => setIntervalDistance(e.target.value)}
                  className='h-9 font-mono text-xs'
                />
              </div>

              {/* Time Span Input */}
              <div className='space-y-1.5'>
                <Label htmlFor='rule-months' className='text-xs text-muted-foreground flex items-center gap-1'>
                  <LuCalendar className='size-3 text-amber-500' /> Time (Months)
                </Label>
                <Input
                  id='rule-months'
                  type='number'
                  min={1}
                  step={1}
                  placeholder='e.g. 6 or 12'
                  value={intervalMonths}
                  onChange={(e) => setIntervalMonths(e.target.value)}
                  className='h-9 font-mono text-xs'
                />
              </div>
            </div>

            {errors.interval && (
              <p className='text-xs text-destructive font-medium'>{errors.interval}</p>
            )}
          </div>

          {/* Baseline Guardrail: Interactive Selection Tiles (Create Mode Only) */}
          {!isEdit ? (
            <div className='rounded-xl border border-border/80 bg-card p-3.5 space-y-3'>
              <div className='flex items-center gap-1.5'>
                <span className='text-xs font-bold text-foreground'>
                  Starting Baseline
                </span>
              </div>

              <div className='grid grid-cols-1 gap-2'>
                {/* Option 1: Fresh Current Odometer */}
                <button
                  type='button'
                  onClick={() => setBaselineChoice('current')}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left cursor-pointer transition-all ${
                    baselineChoice === 'current'
                      ? 'border-primary bg-primary/6 shadow-xs ring-1 ring-primary/30'
                      : 'border-border/70 bg-card hover:border-border'
                  }`}
                >
                  <div className='mt-0.5 text-primary shrink-0'>
                    {baselineChoice === 'current' ? (
                      <LuCircleDot className='size-4' />
                    ) : (
                      <LuCircle className='size-4 text-muted-foreground/60' />
                    )}
                  </div>
                  <div className='min-w-0'>
                    <div className='flex items-center gap-1.5'>
                      <span className='text-xs font-semibold text-foreground'>
                        Start from current odometer ({currentOdometer.toLocaleString()}{' '}
                        {odometerUnit})
                      </span>
                      <span className='rounded bg-primary/20 px-1 py-0.2 text-[0.6rem] font-bold text-primary'>
                        Recommended
                      </span>
                    </div>
                    <p className='text-[0.68rem] text-muted-foreground mt-0.5'>
                      Assumes this item is in good standing right now. Countdown begins from today.
                    </p>
                  </div>
                </button>

                {/* Option 2: Custom Previous Record */}
                <button
                  type='button'
                  onClick={() => setBaselineChoice('custom')}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left cursor-pointer transition-all ${
                    baselineChoice === 'custom'
                      ? 'border-primary bg-primary/6 shadow-xs ring-1 ring-primary/30'
                      : 'border-border/70 bg-card hover:border-border'
                  }`}
                >
                  <div className='mt-0.5 text-primary shrink-0'>
                    {baselineChoice === 'custom' ? (
                      <LuCircleDot className='size-4' />
                    ) : (
                      <LuCircle className='size-4 text-muted-foreground/60' />
                    )}
                  </div>
                  <div className='min-w-0'>
                    <span className='text-xs font-semibold text-foreground block'>
                      Specify past service history
                    </span>
                    <p className='text-[0.68rem] text-muted-foreground mt-0.5'>
                      Enter the exact odometer reading and date when it was last serviced.
                    </p>
                  </div>
                </button>

                {/* Option 3: Leave Uninitialized */}
                <button
                  type='button'
                  onClick={() => setBaselineChoice('none')}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left cursor-pointer transition-all ${
                    baselineChoice === 'none'
                      ? 'border-primary bg-primary/6 shadow-xs ring-1 ring-primary/30'
                      : 'border-border/70 bg-card hover:border-border'
                  }`}
                >
                  <div className='mt-0.5 text-primary shrink-0'>
                    {baselineChoice === 'none' ? (
                      <LuCircleDot className='size-4' />
                    ) : (
                      <LuCircle className='size-4 text-muted-foreground/60' />
                    )}
                  </div>
                  <div className='min-w-0'>
                    <span className='text-xs font-semibold text-foreground block'>
                      Leave Uninitialized (Untracked)
                    </span>
                    <p className='text-[0.68rem] text-muted-foreground mt-0.5'>
                      Displays in neutral untracked status until you log your first service.
                    </p>
                  </div>
                </button>
              </div>

              {/* Reveal Inputs when Custom Selected */}
              {baselineChoice === 'custom' && (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-border'>
                  <div className='space-y-1'>
                    <Label htmlFor='baseline-odo' className='text-xs text-muted-foreground'>
                      Last Odometer ({odometerUnit})
                    </Label>
                    <Input
                      id='baseline-odo'
                      type='number'
                      min={0}
                      placeholder='e.g. 35000'
                      value={lastServiceOdometer}
                      onChange={(e) => setLastServiceOdometer(e.target.value)}
                      className='h-9 font-mono text-xs'
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label htmlFor='baseline-date' className='text-xs text-muted-foreground'>
                      Last Service Date
                    </Label>
                    <Input
                      id='baseline-date'
                      type='date'
                      value={lastServiceDate}
                      onChange={(e) => setLastServiceDate(e.target.value)}
                      className='h-9 text-xs'
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* In Edit Mode: Direct Inputs for Last Service */
            <div className='rounded-xl border border-border/80 bg-card p-3.5 space-y-3'>
              <span className='text-xs font-bold text-foreground block'>
                Last Recorded Service
              </span>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label htmlFor='edit-last-odo' className='text-xs text-muted-foreground'>
                    Last Odometer ({odometerUnit})
                  </Label>
                  <Input
                    id='edit-last-odo'
                    type='number'
                    min={0}
                    placeholder='Leave empty if unknown'
                    value={lastServiceOdometer}
                    onChange={(e) => setLastServiceOdometer(e.target.value)}
                    className='h-9 font-mono text-xs'
                  />
                </div>
                <div className='space-y-1'>
                  <Label htmlFor='edit-last-date' className='text-xs text-muted-foreground'>
                    Last Date
                  </Label>
                  <Input
                    id='edit-last-date'
                    type='date'
                    value={lastServiceDate}
                    onChange={(e) => setLastServiceDate(e.target.value)}
                    className='h-9 text-xs'
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Switch */}
          <div className='flex items-center justify-between rounded-xl border border-border/80 bg-card p-3.5'>
            <div>
              <Label htmlFor='rule-active' className='text-xs font-semibold cursor-pointer'>
                Enable Tracking
              </Label>
              <p className='text-[0.7rem] text-muted-foreground'>
                Inactive rules remain saved in your checklist without triggering alerts.
              </p>
            </div>
            <Switch
              id='rule-active'
              checked={isActive}
              onCheckedChange={setIsActive}
              className='cursor-pointer'
            />
          </div>

          <DialogFooter className='gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className='cursor-pointer'
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting} className='cursor-pointer font-semibold'>
              {isSubmitting ? (
                'Saving Rule...'
              ) : isEdit ? (
                <>
                  <LuSave className='size-4 mr-1.5' aria-hidden='true' />
                  Save Changes
                </>
              ) : (
                <>
                  <LuPlus className='size-4 mr-1.5' aria-hidden='true' />
                  Create Rule
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
