'use client'

import { useState, useMemo, useEffect } from 'react'
import { toast } from 'react-toastify'
import {
  LuSparkles,
  LuCheck,
  LuSquareCheck,
  LuSquare,
  LuShieldCheck,
  LuDroplets,
  LuFilter,
  LuDisc,
  LuCircleDot,
  LuSettings,
  LuCircle,
  LuWrench,
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
import type { MaintenanceCategory, VehicleDTO, VehicleMaintenanceRuleDTO } from '@/types/dto'
import { getDefaultRulesForVehicle } from '../lib/presets'
import { applyDefaultMaintenancePresets } from '../actions'

interface ApplyPresetsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: VehicleDTO
  existingRules?: VehicleMaintenanceRuleDTO[]
  onSuccess?: (newRules: VehicleMaintenanceRuleDTO[]) => void
}

const CATEGORY_ICONS: Record<MaintenanceCategory, React.ElementType> = {
  fluids: LuDroplets,
  filters: LuFilter,
  brakes: LuDisc,
  tires: LuCircleDot,
  powertrain: LuSettings,
  electrical: LuSparkles,
  other: LuShieldCheck,
}

const CATEGORY_ORDER: MaintenanceCategory[] = [
  'fluids',
  'filters',
  'brakes',
  'tires',
  'powertrain',
  'electrical',
  'other',
]

const CATEGORY_TITLES: Record<MaintenanceCategory, string> = {
  fluids: 'Fluids & Lubrication',
  filters: 'Air & Cabin Filters',
  brakes: 'Brakes & Hydraulics',
  tires: 'Tires & Wheels',
  powertrain: 'Powertrain & Drivetrain',
  electrical: 'Electrical & Ignition',
  other: 'Inspection & Warranty',
}

export function ApplyPresetsDialog({
  open,
  onOpenChange,
  vehicle,
  existingRules = [],
  onSuccess,
}: ApplyPresetsDialogProps) {
  const existingMap = useMemo(() => {
    const map = new Map<string, VehicleMaintenanceRuleDTO>()
    for (const r of existingRules) {
      map.set(r.name.trim().toLowerCase(), r)
    }
    return map
  }, [existingRules])

  const presets = useMemo(() => {
    return getDefaultRulesForVehicle(
      vehicle.type,
      vehicle.fuel_type,
      vehicle.odometer_unit,
      vehicle.transmission
    )
  }, [vehicle.type, vehicle.fuel_type, vehicle.odometer_unit, vehicle.transmission])

  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set())
  const [baselineMode, setBaselineMode] = useState<'current_odometer' | 'none' | 'zero'>(
    'current_odometer'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-select recommended items whenever dialog opens
  useEffect(() => {
    if (open) {
      const initialSelected = new Set(
        presets.filter((p) => p.isRecommended !== false).map((p) => p.name)
      )
      setSelectedNames(initialSelected)
      setBaselineMode('current_odometer')
    }
  }, [open, presets])

  // Group presets by subsystem
  const groupedPresets = useMemo(() => {
    const groups: { category: MaintenanceCategory; items: typeof presets }[] = []
    const map = new Map<MaintenanceCategory, typeof presets>()

    for (const item of presets) {
      const existing = map.get(item.category) || []
      existing.push(item)
      map.set(item.category, existing)
    }

    for (const cat of CATEGORY_ORDER) {
      const items = map.get(cat)
      if (items && items.length > 0) {
        groups.push({ category: cat, items })
      }
    }

    return groups
  }, [presets])

  const toggleItem = (name: string) => {
    const next = new Set(selectedNames)
    if (next.has(name)) {
      next.delete(name)
    } else {
      next.add(name)
    }
    setSelectedNames(next)
  }

  const selectAll = () => {
    setSelectedNames(new Set(presets.map((p) => p.name)))
  }

  const selectRecommended = () => {
    setSelectedNames(new Set(presets.filter((p) => p.isRecommended !== false).map((p) => p.name)))
  }

  const deselectAll = () => {
    setSelectedNames(new Set())
  }

  const handleApply = async () => {
    if (selectedNames.size === 0) {
      toast.error('Select at least one checklist item to apply')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await applyDefaultMaintenancePresets({
        vehicleId: vehicle.id,
        baselineMode,
        selectedRuleNames: Array.from(selectedNames),
      })

      if (!res.success) {
        toast.error(res.error || 'Failed to apply presets')
        setIsSubmitting(false)
        return
      }

      toast.success(
        `Applied ${res.count || selectedNames.size} recommended maintenance rules`
      )
      onSuccess?.(res.data || [])
      onOpenChange(false)
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
              <LuSparkles className='size-5' aria-hidden='true' />
            </div>
            <div>
              <DialogTitle className='text-base sm:text-lg font-bold text-foreground'>
                Recommended Maintenance Checklist
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                Audited interval schedules tailored for {vehicle.name} ({vehicle.type.toUpperCase()} ·{' '}
                {vehicle.fuel_type.toUpperCase()}).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='space-y-5 pt-2'>
          {/* Quick Selection Toolbar */}
          <div className='flex items-center justify-between border-b border-border pb-2.5 text-xs'>
            <span className='font-mono font-medium text-muted-foreground'>
              {selectedNames.size} of {presets.length} items selected
            </span>

            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={selectRecommended}
                className='text-primary hover:underline font-semibold cursor-pointer'
              >
                Standard
              </button>
              <span className='text-border select-none'>•</span>
              <button
                type='button'
                onClick={selectAll}
                className='text-foreground hover:underline font-medium cursor-pointer'
              >
                All
              </button>
              <span className='text-border select-none'>•</span>
              <button
                type='button'
                onClick={deselectAll}
                className='text-muted-foreground hover:underline cursor-pointer'
              >
                None
              </button>
            </div>
          </div>

          {/* Grouped Subsystem Presets (ui-ux-pro-max standard) */}
          <div className='space-y-4 max-h-[38vh] overflow-y-auto pr-1 no-scrollbar'>
            {groupedPresets.map(({ category, items }) => {
              const Icon = CATEGORY_ICONS[category] || LuWrench

              return (
                <div key={category} className='space-y-1.5'>
                  <div className='flex items-center gap-1.5 px-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground'>
                    <Icon className='size-3 text-primary' aria-hidden='true' />
                    <span>{CATEGORY_TITLES[category] || category}</span>
                    <span className='font-mono text-[0.65rem] text-muted-foreground/80'>
                      ({items.length})
                    </span>
                  </div>

                  <div className='space-y-1.5'>
                    {items.map((item) => {
                      const isSelected = selectedNames.has(item.name)

                      return (
                        <button
                          key={item.name}
                          type='button'
                          onClick={() => toggleItem(item.name)}
                          className={`w-full text-left flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? 'border-primary/50 bg-primary/4 shadow-xs ring-1 ring-primary/20'
                              : 'border-border/70 bg-card opacity-70 hover:opacity-100 hover:border-border'
                          }`}
                        >
                          <div className='mt-0.5 text-primary shrink-0'>
                            {isSelected ? (
                              <LuSquareCheck className='size-4' />
                            ) : (
                              <LuSquare className='size-4 text-muted-foreground/60' />
                            )}
                          </div>

                          <div className='flex-1 min-w-0'>
                            <div className='flex flex-wrap items-center justify-between gap-1.5'>
                              <div className='flex items-center gap-1.5'>
                                <span className='text-xs font-semibold text-foreground'>
                                  {item.name}
                                </span>
                                {existingMap.has(item.name.trim().toLowerCase()) ? (
                                  <span className='rounded bg-muted px-1.5 py-0.2 text-[0.62rem] font-semibold text-muted-foreground border border-border/80'>
                                    Configured
                                  </span>
                                ) : item.isRecommended ? (
                                  <span className='rounded bg-primary/15 px-1.5 py-0.2 text-[0.62rem] font-semibold text-primary'>
                                    Standard
                                  </span>
                                ) : null}
                              </div>

                              <span className='font-mono text-[0.68rem] font-semibold text-foreground/90 bg-secondary/80 px-2 py-0.5 rounded-md'>
                                {item.intervalDistance?.toLocaleString()} {vehicle.odometer_unit}
                                {item.intervalMonths ? ` / ${item.intervalMonths}m` : ''}
                              </span>
                            </div>

                            {item.description && (
                              <p className='mt-1 text-[0.7rem] text-muted-foreground leading-relaxed'>
                                {item.description}
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Interactive Baseline Guardrail Selector (ui-ux-pro-max standard) */}
          <div className='rounded-xl border border-border/80 bg-muted/25 p-3.5 space-y-2.5'>
            <div className='flex items-center gap-1.5'>
              <LuShieldCheck className='size-4 text-primary' aria-hidden='true' />
              <span className='text-xs font-bold text-foreground'>
                Starting Baseline
              </span>
            </div>

            <p className='text-[0.7rem] text-muted-foreground leading-relaxed'>
              Choose where countdown timers begin for this vehicle:
            </p>

            <div className='grid grid-cols-1 gap-2 pt-1'>
              {/* Tile 1: Current Odometer (Recommended) */}
              <button
                type='button'
                onClick={() => setBaselineMode('current_odometer')}
                className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left cursor-pointer transition-all ${
                  baselineMode === 'current_odometer'
                    ? 'border-primary bg-primary/6 shadow-xs ring-1 ring-primary/30'
                    : 'border-border/70 bg-card hover:border-border'
                }`}
              >
                <div className='mt-0.5 text-primary shrink-0'>
                  {baselineMode === 'current_odometer' ? (
                    <LuCircleDot className='size-4' />
                  ) : (
                    <LuCircle className='size-4 text-muted-foreground/60' />
                  )}
                </div>
                <div className='min-w-0'>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-xs font-semibold text-foreground'>
                      Start from Current Odometer ({vehicle.current_odometer.toLocaleString()}{' '}
                      {vehicle.odometer_unit})
                    </span>
                    <span className='rounded bg-primary/20 px-1 py-0.2 text-[0.6rem] font-bold text-primary'>
                      Recommended
                    </span>
                  </div>
                  <p className='text-[0.68rem] text-muted-foreground mt-0.5'>
                    Fresh start from this moment forward. Assumes your vehicle is currently maintained.
                  </p>
                </div>
              </button>

              {/* Tile 2: Uninitialized */}
              <button
                type='button'
                onClick={() => setBaselineMode('none')}
                className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left cursor-pointer transition-all ${
                  baselineMode === 'none'
                    ? 'border-primary bg-primary/6 shadow-xs ring-1 ring-primary/30'
                    : 'border-border/70 bg-card hover:border-border'
                }`}
              >
                <div className='mt-0.5 text-primary shrink-0'>
                  {baselineMode === 'none' ? (
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
                    Checklist items remain in neutral Untracked standing until your first routine service
                    log.
                  </p>
                </div>
              </button>

              {/* Tile 3: Brand New Vehicle (Zero) */}
              <button
                type='button'
                onClick={() => setBaselineMode('zero')}
                className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left cursor-pointer transition-all ${
                  baselineMode === 'zero'
                    ? 'border-primary bg-primary/6 shadow-xs ring-1 ring-primary/30'
                    : 'border-border/70 bg-card hover:border-border'
                }`}
              >
                <div className='mt-0.5 text-primary shrink-0'>
                  {baselineMode === 'zero' ? (
                    <LuCircleDot className='size-4' />
                  ) : (
                    <LuCircle className='size-4 text-muted-foreground/60' />
                  )}
                </div>
                <div className='min-w-0'>
                  <span className='text-xs font-semibold text-foreground block'>
                    Start from 0 {vehicle.odometer_unit} (Brand New Showroom Vehicle)
                  </span>
                  <p className='text-[0.68rem] text-muted-foreground mt-0.5'>
                    Use only if vehicle was purchased brand new off the showroom floor with 0 mileage.
                  </p>
                </div>
              </button>
            </div>
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
            <Button
              type='button'
              onClick={handleApply}
              disabled={isSubmitting || selectedNames.size === 0}
              className='cursor-pointer font-semibold'
            >
              {isSubmitting ? (
                'Applying Presets...'
              ) : (
                <>
                  <LuCheck className='size-4 mr-1.5' aria-hidden='true' />
                  {(() => {
                    let updateCount = 0
                    let newCount = 0
                    for (const name of selectedNames) {
                      if (existingMap.has(name.trim().toLowerCase())) {
                        updateCount++
                      } else {
                        newCount++
                      }
                    }
                    if (updateCount > 0 && newCount > 0) {
                      return `Apply (${newCount} new, ${updateCount} update)`
                    }
                    if (updateCount > 0) {
                      return `Update Selected (${updateCount} items)`
                    }
                    return `Add Selected (${newCount} items)`
                  })()}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
