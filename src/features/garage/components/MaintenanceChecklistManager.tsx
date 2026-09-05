'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import {
  LuWrench,
  LuPlus,
  LuSparkles,
  LuEllipsisVertical,
  LuPencil,
  LuRotateCcw,
  LuTrash2,
  LuDroplets,
  LuFilter,
  LuDisc,
  LuCircleDot,
  LuZap,
  LuSettings,
  LuGauge,
  LuCalendar,
  LuShieldCheck,
  LuShieldAlert,
  LuClock,
} from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import type {
  MaintenanceCategory,
  VehicleDTO,
  VehicleMaintenanceRuleDTO,
} from '@/types/dto'
import { calculateRuleDueStatus, sortRulesByUrgency } from '../lib/rules-math'
import {
  toggleRuleActive,
  deleteMaintenanceRule,
  resetRuleBaseline,
} from '../actions'
import { MaintenanceRuleModal } from './MaintenanceRuleModal'
import { ApplyPresetsDialog } from './ApplyPresetsDialog'

interface MaintenanceChecklistManagerProps {
  vehicle: VehicleDTO
  initialRules: VehicleMaintenanceRuleDTO[]
}

const CATEGORY_CONFIG: Record<
  MaintenanceCategory,
  {
    label: string
    icon: React.ElementType
    colorClass: string
    bgClass: string
  }
> = {
  fluids: {
    label: 'Fluids',
    icon: LuDroplets,
    colorClass: 'text-blue-500 dark:text-blue-400',
    bgClass: 'bg-blue-500/10 border-blue-500/20',
  },
  filters: {
    label: 'Filters',
    icon: LuFilter,
    colorClass: 'text-emerald-500 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
  },
  brakes: {
    label: 'Brakes',
    icon: LuDisc,
    colorClass: 'text-rose-500 dark:text-rose-400',
    bgClass: 'bg-rose-500/10 border-rose-500/20',
  },
  tires: {
    label: 'Tires',
    icon: LuCircleDot,
    colorClass: 'text-amber-500 dark:text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
  },
  powertrain: {
    label: 'Powertrain',
    icon: LuSettings,
    colorClass: 'text-purple-500 dark:text-purple-400',
    bgClass: 'bg-purple-500/10 border-purple-500/20',
  },
  electrical: {
    label: 'Electrical',
    icon: LuZap,
    colorClass: 'text-yellow-500 dark:text-yellow-400',
    bgClass: 'bg-yellow-500/10 border-yellow-500/20',
  },
  other: {
    label: 'Inspection',
    icon: LuShieldCheck,
    colorClass: 'text-indigo-500 dark:text-indigo-400',
    bgClass: 'bg-indigo-500/10 border-indigo-500/20',
  },
}

export function MaintenanceChecklistManager({
  vehicle,
  initialRules,
}: MaintenanceChecklistManagerProps) {
  const router = useRouter()
  const [rules, setRules] = useState<VehicleMaintenanceRuleDTO[]>(initialRules)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isPresetsOpen, setIsPresetsOpen] = useState(false)
  const [editingRule, setEditingRule] =
    useState<VehicleMaintenanceRuleDTO | null>(null)
  const [ruleToDelete, setRuleToDelete] =
    useState<VehicleMaintenanceRuleDTO | null>(null)
  const [isPending, startTransition] = useTransition()

  // Compute status for each rule and sort by lower % remaining first (urgency order)
  const rulesWithStatus = useMemo(() => {
    const computed = rules.map((rule) => {
      const status = calculateRuleDueStatus(rule, {
        currentOdometer: vehicle.current_odometer,
        unit: vehicle.odometer_unit,
      })
      return { rule, status }
    })
    return sortRulesByUrgency(computed)
  }, [rules, vehicle.current_odometer, vehicle.odometer_unit])

  // Vehicle Health Cockpit Metrics
  const summary = useMemo(() => {
    let overdueCount = 0
    let dueSoonCount = 0
    let goodCount = 0
    let activeCount = 0

    for (const { rule, status } of rulesWithStatus) {
      if (rule.is_active) {
        activeCount++
        if (status.status === 'overdue') overdueCount++
        else if (status.status === 'due_soon') dueSoonCount++
        else if (status.status === 'good') goodCount++
      }
    }

    // Health Score calculation (0 to 100%)
    let healthScore = 100
    if (activeCount > 0) {
      const deduction = (overdueCount * 35 + dueSoonCount * 15) / activeCount
      healthScore = Math.max(10, Math.round(100 - deduction))
    }

    return {
      overdueCount,
      dueSoonCount,
      goodCount,
      activeCount,
      total: rules.length,
      healthScore,
    }
  }, [rulesWithStatus, rules.length])

  // Filtered rules
  const filteredRules = useMemo(() => {
    if (activeCategory === 'all') return rulesWithStatus
    return rulesWithStatus.filter(
      ({ rule }) => rule.category === activeCategory,
    )
  }, [rulesWithStatus, activeCategory])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rules.length }
    for (const r of rules) {
      counts[r.category] = (counts[r.category] || 0) + 1
    }
    return counts
  }, [rules])

  // Quick toggle active
  const handleToggleActive = async (ruleId: string, currentActive: boolean) => {
    const nextActive = !currentActive
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, is_active: nextActive } : r)),
    )

    startTransition(async () => {
      const res = await toggleRuleActive(ruleId, nextActive)
      if (!res.success) {
        toast.error(res.error || 'Failed to update rule')
        setRules((prev) =>
          prev.map((r) =>
            r.id === ruleId ? { ...r, is_active: currentActive } : r,
          ),
        )
      } else {
        router.refresh()
      }
    })
  }

  // Reset baseline to current odometer
  const handleResetBaseline = async (rule: VehicleMaintenanceRuleDTO) => {
    startTransition(async () => {
      const res = await resetRuleBaseline(rule.id)
      if (!res.success || !res.data) {
        toast.error(res.error || 'Failed to reset baseline')
        return
      }

      toast.success(
        `Reset baseline for "${rule.name}" to ${vehicle.current_odometer.toLocaleString()} ${vehicle.odometer_unit}`,
      )
      setRules((prev) => prev.map((r) => (r.id === rule.id ? res.data! : r)))
      router.refresh()
    })
  }

  // Delete rule
  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!ruleToDelete) return
    const id = ruleToDelete.id
    const ruleName = ruleToDelete.name

    startTransition(async () => {
      const res = await deleteMaintenanceRule(id)
      if (!res.success) {
        toast.error(res.error || 'Failed to delete rule')
        return
      }

      toast.success(`Deleted rule "${ruleName}"`)
      setRules((prev) => prev.filter((r) => r.id !== id))
      setRuleToDelete(null)
      router.refresh()
    })
  }

  return (
    <div className='space-y-6'>
      {/* 1. Header & Primary Action Controls */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <h2 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
              Maintenance Checklist
            </h2>
          </div>
          <p className='text-xs text-muted-foreground'>
            Component service countdowns tailored for {vehicle.name} (
            {vehicle.type.toUpperCase()} · {vehicle.fuel_type.toUpperCase()}).
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2.5'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setIsPresetsOpen(true)}
            className='h-9 text-xs font-medium border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-pointer'
          >
            <LuSparkles
              className='size-3.5 mr-1.5 text-primary'
              aria-hidden='true'
            />
            Apply Presets
          </Button>

          <Button
            type='button'
            size='sm'
            onClick={() => {
              setEditingRule(null)
              setIsAddModalOpen(true)
            }}
            className='h-9 text-xs font-semibold shadow-xs cursor-pointer'
          >
            <LuPlus className='size-3.5 mr-1.5' aria-hidden='true' />
            Add Rule
          </Button>
        </div>
      </div>

      {/* 2. Operations Cockpit Telemetry Bento (ui-ux-pro-max standard) */}
      {rules.length > 0 && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5'>
          {/* Bento Card 1: Vehicle Health Readiness Score */}
          <div className='relative overflow-hidden rounded-xl border border-border/80 bg-linear-to-br from-card to-card/60 p-4 shadow-xs'>
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <span className='font-medium flex items-center gap-1.5'>
                <LuShieldCheck
                  className='size-3.5 text-primary'
                  aria-hidden='true'
                />
                Health Score
              </span>
              <span className='text-[0.65rem] font-mono uppercase tracking-wider text-muted-foreground'>
                {summary.activeCount} Active
              </span>
            </div>

            <div className='mt-2.5 flex items-baseline justify-between'>
              <div className='flex items-baseline gap-1'>
                <span
                  className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono ${
                    summary.overdueCount > 0
                      ? 'text-destructive'
                      : summary.dueSoonCount > 0
                        ? 'text-amber-500'
                        : 'text-emerald-500'
                  }`}
                >
                  {summary.healthScore}%
                </span>
                <span className='text-xs text-muted-foreground'>
                  operational
                </span>
              </div>

              <div
                className={`size-3 rounded-full ${
                  summary.overdueCount > 0
                    ? 'bg-destructive animate-ping'
                    : summary.dueSoonCount > 0
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-500'
                }`}
                aria-hidden='true'
              />
            </div>

            <div className='mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary'>
              <div
                className={`h-full transition-all duration-500 ${
                  summary.overdueCount > 0
                    ? 'bg-destructive'
                    : summary.dueSoonCount > 0
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${summary.healthScore}%` }}
              />
            </div>
          </div>

          {/* Bento Card 2: Good Standing Items */}
          <div className='rounded-xl border border-border/80 bg-card p-4 shadow-xs'>
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <span className='font-medium'>Good Standing</span>
              <span
                className='size-2 rounded-full bg-emerald-500'
                aria-hidden='true'
              />
            </div>
            <div className='mt-2.5 flex items-baseline gap-1.5'>
              <span className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono'>
                {summary.goodCount}
              </span>
              <span className='text-xs text-muted-foreground'>
                / {summary.activeCount} rules
              </span>
            </div>
            <p className='mt-2 text-[0.7rem] text-muted-foreground'>
              Intervals healthy and well within distance and time limits.
            </p>
          </div>

          {/* Bento Card 3: Due Soon Attention */}
          <div
            className={`rounded-xl border p-4 shadow-xs transition-colors ${
              summary.dueSoonCount > 0
                ? 'border-amber-500/40 bg-amber-500/4'
                : 'border-border/80 bg-card'
            }`}
          >
            <div className='flex items-center justify-between text-xs'>
              <span
                className={`font-medium ${
                  summary.dueSoonCount > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground'
                }`}
              >
                Due Soon
              </span>
              {summary.dueSoonCount > 0 && (
                <span
                  className='size-2 rounded-full bg-amber-500 animate-pulse'
                  aria-hidden='true'
                />
              )}
            </div>
            <div className='mt-2.5 flex items-baseline gap-1.5'>
              <span
                className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono ${
                  summary.dueSoonCount > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-foreground'
                }`}
              >
                {summary.dueSoonCount}
              </span>
              <span className='text-xs text-muted-foreground'>approaching</span>
            </div>
            <p className='mt-2 text-[0.7rem] text-muted-foreground'>
              Within 500 {vehicle.odometer_unit} or 14 days of scheduled
              service.
            </p>
          </div>

          {/* Bento Card 4: Overdue Critical Action */}
          <div
            className={`rounded-xl border p-4 shadow-xs transition-colors ${
              summary.overdueCount > 0
                ? 'border-destructive/40 bg-destructive/4'
                : 'border-border/80 bg-card'
            }`}
          >
            <div className='flex items-center justify-between text-xs'>
              <span
                className={`font-medium ${
                  summary.overdueCount > 0
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                Overdue
              </span>
              {summary.overdueCount > 0 && (
                <span
                  className='size-2 rounded-full bg-destructive animate-ping'
                  aria-hidden='true'
                />
              )}
            </div>
            <div className='mt-2.5 flex items-baseline gap-1.5'>
              <span
                className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono ${
                  summary.overdueCount > 0
                    ? 'text-destructive'
                    : 'text-foreground'
                }`}
              >
                {summary.overdueCount}
              </span>
              <span className='text-xs text-muted-foreground'>
                overdue items
              </span>
            </div>
            <p className='mt-2 text-[0.7rem] text-muted-foreground'>
              Immediate maintenance required to prevent component damage.
            </p>
          </div>
        </div>
      )}

      {/* 3. Subsystem Filter Navigation Pills */}
      {rules.length > 0 && (
        <div className='flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1 text-xs no-scrollbar'>
          {[
            { key: 'all', label: 'All Items', icon: LuWrench },
            { key: 'fluids', label: 'Fluids', icon: LuDroplets },
            { key: 'filters', label: 'Filters', icon: LuFilter },
            { key: 'brakes', label: 'Brakes', icon: LuDisc },
            { key: 'tires', label: 'Tires', icon: LuCircleDot },
            { key: 'powertrain', label: 'Powertrain', icon: LuSettings },
            { key: 'electrical', label: 'Electrical', icon: LuZap },
            { key: 'other', label: 'Other', icon: LuWrench },
          ].map((cat) => {
            const count = categoryCounts[cat.key] || 0
            if (cat.key !== 'all' && count === 0) return null
            const isActive = activeCategory === cat.key
            const Icon = cat.icon

            return (
              <button
                key={cat.key}
                type='button'
                onClick={() => setActiveCategory(cat.key)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className='size-3.5' aria-hidden='true' />
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[0.62rem] font-mono font-semibold ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* 4. Empty State Cockpit Onboarding */}
      {rules.length === 0 ? (
        <div className='relative overflow-hidden rounded-2xl border border-dashed border-border/90 bg-linear-to-b from-card/80 to-muted/20 p-8 text-center sm:p-12 shadow-xs'>
          <div className='mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5'>
            <LuWrench className='size-7' aria-hidden='true' />
          </div>

          <h3 className='mt-5 text-base sm:text-lg font-bold tracking-tight text-foreground'>
            No Maintenance Intervals Configured
          </h3>
          <p className='mx-auto mt-2 max-w-md text-xs text-muted-foreground leading-relaxed'>
            Protect your <strong>{vehicle.name}</strong> from costly breakdowns.
            Initialize with audited OEM interval templates for{' '}
            <strong>
              {vehicle.type.toUpperCase()} ({vehicle.fuel_type.toUpperCase()})
            </strong>{' '}
            or create custom rules.
          </p>

          <div className='mt-7 flex flex-wrap items-center justify-center gap-3'>
            <Button
              type='button'
              onClick={() => setIsPresetsOpen(true)}
              className='h-9.5 text-xs font-semibold shadow-sm cursor-pointer'
            >
              <LuSparkles className='size-3.5 mr-1.5' aria-hidden='true' />
              Apply Recommended Presets
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setEditingRule(null)
                setIsAddModalOpen(true)
              }}
              className='h-9.5 text-xs font-medium cursor-pointer'
            >
              <LuPlus className='size-3.5 mr-1.5' aria-hidden='true' />
              Add Rule
            </Button>
          </div>
        </div>
      ) : filteredRules.length === 0 ? (
        <div className='rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground'>
          No rules found in this category.
        </div>
      ) : (
        /* 5. Dual-Telemetry Rules Cards Grid (ui-ux-pro-max standard) */
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          {filteredRules.map(({ rule, status }) => {
            const config =
              CATEGORY_CONFIG[rule.category] || CATEGORY_CONFIG.other
            const Icon = config.icon

            const isOverdue = status.status === 'overdue'
            const isDueSoon = status.status === 'due_soon'
            const isGood = status.status === 'good'

            return (
              <div
                key={rule.id}
                className={`relative flex flex-col justify-between rounded-xl border p-4.5 transition-all duration-200 ${
                  !rule.is_active
                    ? 'border-border/50 bg-muted/15 opacity-60'
                    : isOverdue
                      ? 'border-destructive/40 bg-linear-to-br from-destructive/6 to-card ring-1 ring-destructive/20 shadow-xs'
                      : isDueSoon
                        ? 'border-amber-500/40 bg-linear-to-br from-amber-500/5 to-card ring-1 ring-amber-500/20 shadow-xs'
                        : 'border-border/80 bg-card hover:border-primary/40 shadow-xs hover:shadow-sm'
                }`}
              >
                {/* Top Section: Icon, Title, Trigger Tag & Actions */}
                <div>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-start gap-3 min-w-0'>
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${config.bgClass} ${config.colorClass}`}
                      >
                        <Icon className='size-4' aria-hidden='true' />
                      </div>

                      <div className='min-w-0'>
                        <div className='flex flex-wrap items-center gap-1.5'>
                          <h4 className='truncate text-sm font-semibold text-foreground'>
                            {rule.name}
                          </h4>
                          <span
                            className={`rounded-md px-1.5 py-0.2 text-[0.62rem] font-medium uppercase tracking-wider ${config.bgClass} ${config.colorClass}`}
                          >
                            {config.label}
                          </span>
                        </div>

                        <div className='mt-1 flex flex-wrap items-center gap-x-2 text-[0.7rem] text-muted-foreground'>
                          <span>
                            Every{' '}
                            {rule.interval_distance
                              ? `${rule.interval_distance.toLocaleString()} ${vehicle.odometer_unit}`
                              : ''}
                            {rule.interval_distance && rule.interval_months
                              ? ' or '
                              : ''}
                            {rule.interval_months
                              ? `${rule.interval_months} mo`
                              : ''}
                          </span>
                          {rule.is_active &&
                            status.primaryTrigger !== 'none' && (
                              <>
                                <span className='text-border select-none'>
                                  •
                                </span>
                                <span className='font-medium text-foreground/80 flex items-center gap-1'>
                                  {status.primaryTrigger === 'distance' ? (
                                    <>
                                      <LuGauge className='size-3 text-primary' />{' '}
                                      Mileage First
                                    </>
                                  ) : status.primaryTrigger === 'time' ? (
                                    <>
                                      <LuClock className='size-3 text-amber-500' />{' '}
                                      Time First
                                    </>
                                  ) : (
                                    <>
                                      <LuShieldAlert className='size-3 text-destructive' />{' '}
                                      Both Reached
                                    </>
                                  )}
                                </span>
                              </>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Active Switch & Overflow Dropdown */}
                    <div className='flex items-center gap-1 shrink-0'>
                      <div className='flex items-center justify-center size-9'>
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() =>
                            handleToggleActive(rule.id, rule.is_active)
                          }
                          aria-label={`Toggle active state for ${rule.name}`}
                          className='scale-85 cursor-pointer'
                        />
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8 text-muted-foreground hover:text-foreground cursor-pointer'
                            aria-label='Rule actions'
                          >
                            <LuEllipsisVertical className='size-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-48'>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingRule(rule)
                              setIsAddModalOpen(true)
                            }}
                            className='text-xs cursor-pointer'
                          >
                            <LuPencil className='size-3.5 mr-2' />
                            Edit Rule
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleResetBaseline(rule)}
                            className='text-xs cursor-pointer'
                          >
                            <LuRotateCcw className='size-3.5 mr-2' />
                            Reset to Today
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => setRuleToDelete(rule)}
                            className='text-xs text-destructive focus:text-destructive cursor-pointer'
                          >
                            <LuTrash2 className='size-3.5 mr-2' />
                            Delete Rule
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Dual Telemetry Matrix: Distance & Time Countdown Meters */}
                  {rule.is_active && (
                    <div className='mt-3.5 grid grid-cols-2 gap-2 text-xs'>
                      {/* Meter A: Distance Remaining */}
                      <div className='rounded-lg border border-border/60 bg-secondary/30 p-2.5'>
                        <div className='flex items-center justify-between text-[0.68rem] text-muted-foreground'>
                          <span className='flex items-center gap-1'>
                            <LuGauge className='size-3' /> Distance
                          </span>
                          {rule.interval_distance ? (
                            <span className='font-mono font-semibold'>
                              {rule.interval_distance.toLocaleString()}{' '}
                              {vehicle.odometer_unit}
                            </span>
                          ) : (
                            <span>N/A</span>
                          )}
                        </div>

                        <div className='mt-1.5'>
                          {status.remainingDistance !== null ? (
                            <span
                              className={`text-xs font-bold font-mono ${
                                status.remainingDistance <= 0
                                  ? 'text-destructive'
                                  : status.remainingDistance <= 500
                                    ? 'text-amber-500'
                                    : 'text-foreground'
                              }`}
                            >
                              {status.remainingDistance <= 0
                                ? `Overdue by ${Math.abs(status.remainingDistance).toLocaleString()} ${vehicle.odometer_unit}`
                                : `${status.remainingDistance.toLocaleString()} ${vehicle.odometer_unit} left`}
                            </span>
                          ) : (
                            <span className='text-xs text-muted-foreground italic'>
                              Untracked
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Meter B: Time Remaining */}
                      <div className='rounded-lg border border-border/60 bg-secondary/30 p-2.5'>
                        <div className='flex items-center justify-between text-[0.68rem] text-muted-foreground'>
                          <span className='flex items-center gap-1'>
                            <LuCalendar className='size-3' /> Time
                          </span>
                          {rule.interval_months ? (
                            <span className='font-mono font-semibold'>
                              {rule.interval_months} mo
                            </span>
                          ) : (
                            <span>N/A</span>
                          )}
                        </div>

                        <div className='mt-1.5'>
                          {status.remainingDays !== null ? (
                            <span
                              className={`text-xs font-bold font-mono ${
                                status.remainingDays <= 0
                                  ? 'text-destructive'
                                  : status.remainingDays <= 14
                                    ? 'text-amber-500'
                                    : 'text-foreground'
                              }`}
                            >
                              {status.remainingDays <= 0
                                ? `Overdue by ${Math.abs(status.remainingDays)}d`
                                : `${status.remainingDays} days left`}
                            </span>
                          ) : (
                            <span className='text-xs text-muted-foreground italic'>
                              Untracked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tactile Progress Gauge Bar */}
                  {rule.is_active && (
                    <div className='mt-3 space-y-1'>
                      <div className='flex items-center justify-between text-[0.68rem]'>
                        <div className='flex items-center gap-1.5'>
                          <span
                            className={`inline-block size-2 rounded-full ${
                              isOverdue
                                ? 'bg-destructive animate-pulse'
                                : isDueSoon
                                  ? 'bg-amber-500'
                                  : isGood
                                    ? 'bg-emerald-500'
                                    : 'bg-muted-foreground'
                            }`}
                          />
                          <span
                            className={`font-semibold capitalize ${
                              isOverdue
                                ? 'text-destructive'
                                : isDueSoon
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : isGood
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-muted-foreground'
                            }`}
                          >
                            {status.status.replace('_', ' ')}
                          </span>
                        </div>

                        {status.percentRemaining !== null && (
                          <span className='font-mono font-medium text-muted-foreground'>
                            {status.percentRemaining}% remaining
                          </span>
                        )}
                      </div>

                      <div className='h-2 w-full overflow-hidden rounded-full bg-secondary'>
                        <div
                          className={`h-full transition-all duration-300 ${
                            isOverdue
                              ? 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                              : isDueSoon
                                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                : isGood
                                  ? 'bg-emerald-500'
                                  : 'bg-muted-foreground/30'
                          }`}
                          style={{
                            width: `${Math.max(4, Math.min(100, status.percentRemaining ?? 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Micro-Bar: Last Service Stamp & Quick Inline Action */}
                <div className='mt-3.5 flex items-center justify-between border-t border-border/50 pt-2.5 text-[0.68rem] text-muted-foreground'>
                  <span>
                    Last recorded:{' '}
                    {rule.last_service_odometer !== null ? (
                      <span className='font-medium text-foreground'>
                        {rule.last_service_odometer.toLocaleString()}{' '}
                        {vehicle.odometer_unit}
                      </span>
                    ) : (
                      'Never'
                    )}
                    {rule.last_service_date && ` · ${rule.last_service_date}`}
                  </span>

                  {/* Inline Quick Action Button */}
                  {rule.is_active && (
                    <button
                      type='button'
                      onClick={() => handleResetBaseline(rule)}
                      className='text-primary hover:underline font-medium cursor-pointer'
                    >
                      {rule.last_service_odometer === null
                        ? 'Set Baseline'
                        : 'Reset to Today'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 6. Add / Edit Modal */}
      <MaintenanceRuleModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        vehicleId={vehicle.id}
        currentOdometer={vehicle.current_odometer}
        odometerUnit={vehicle.odometer_unit}
        vehicleType={vehicle.type}
        fuelType={vehicle.fuel_type}
        transmission={vehicle.transmission}
        ruleToEdit={editingRule}
        onSuccess={(savedRule) => {
          setRules((prev) => {
            const exists = prev.some((r) => r.id === savedRule.id)
            if (exists) {
              return prev.map((r) => (r.id === savedRule.id ? savedRule : r))
            }
            return [...prev, savedRule]
          })
          router.refresh()
        }}
      />

      {/* 7. Apply Presets Dialog */}
      <ApplyPresetsDialog
        open={isPresetsOpen}
        onOpenChange={setIsPresetsOpen}
        vehicle={vehicle}
        existingRules={rules}
        onSuccess={(resultRules) => {
          setRules((prev) => {
            const map = new Map(prev.map((r) => [r.id, r]))
            for (const r of resultRules) {
              map.set(r.id, r)
            }
            return Array.from(map.values())
          })
          router.refresh()
        }}
      />

      {/* 8. Delete Confirmation Alert */}
      <AlertDialog
        open={!!ruleToDelete}
        onOpenChange={(open) => !open && setRuleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Maintenance Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{ruleToDelete?.name}</strong>? Existing service history is
              preserved, but automated countdown tracking for this interval will
              cease.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className='cursor-pointer'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant='destructive'
                disabled={isPending}
                loading={isPending}
                onClick={handleDeleteConfirm}
                className='cursor-pointer'
              >
                {isPending ? 'Deleting...' : 'Delete Rule'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
