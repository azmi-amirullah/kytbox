'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import {
  LuPencil,
  LuStar,
  LuArchive,
  LuArchiveRestore,
  LuTrash2,
  LuGauge,
  LuFuel,
  LuWrench,
  LuFileText,
  LuCheck,
  LuHistory,
  LuCalendar,
} from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav'
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
import type { VehicleDTO, VehicleMonthlyOdometerDTO } from '@/types/dto'
import { VehicleTypeBadge } from './VehicleTypeBadge'
import { EditVehicleModal } from './EditVehicleModal'
import { UpdateOdometerModal } from './UpdateOdometerModal'
import { formatOdometer, calculateMonthlyVelocity, predictCurrentOdometer } from '../lib/odometer'
import { setDefaultVehicle, toggleArchiveVehicle, deleteVehicle } from '../actions'

type GarageTab = 'specs' | 'rules' | 'service' | 'tax' | 'fuel'

interface VehicleDetailProps {
  vehicle: VehicleDTO
  monthlyOdometers: VehicleMonthlyOdometerDTO[]
  cashflowBooks?: { id: string; title: string; currency: string }[]
}

export function VehicleDetail({
  vehicle: initialVehicle,
  monthlyOdometers: initialOdometers,
  cashflowBooks = [],
}: VehicleDetailProps) {
  const router = useRouter()
  const [vehicle, setVehicle] = useState<VehicleDTO>(initialVehicle)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isOdometerOpen, setIsOdometerOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<GarageTab>('specs')

  const velocity = calculateMonthlyVelocity(
    initialOdometers.map((m) => ({ yearMonth: m.year_month, odometer: m.odometer })),
    vehicle.estimated_monthly_km || 1000,
  )

  const prediction = predictCurrentOdometer(
    vehicle.current_odometer,
    vehicle.updated_at,
    velocity.monthlyVelocity,
  )

  const handleSetDefault = async () => {
    const res = await setDefaultVehicle({ id: vehicle.id })
    if (res.success) {
      setVehicle((prev) => ({ ...prev, is_default: true }))
      toast.success('Default vehicle updated')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to set default vehicle')
    }
  }

  const handleToggleArchive = async () => {
    const nextArchived = !vehicle.is_archived
    const res = await toggleArchiveVehicle({ id: vehicle.id, isArchived: nextArchived })
    if (res.success) {
      setVehicle((prev) => ({ ...prev, is_archived: nextArchived, is_default: false }))
      toast.success(nextArchived ? 'Vehicle moved to archive' : 'Vehicle restored to active garage')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to update vehicle')
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    if (vehicle.is_archived) {
      const res = await deleteVehicle({ id: vehicle.id })
      if (res.success) {
        toast.success('Vehicle permanently deleted')
        router.push('/garage')
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to delete vehicle')
        setIsDeleting(false)
      }
    } else {
      const res = await toggleArchiveVehicle({ id: vehicle.id, isArchived: true })
      if (res.success) {
        toast.success('Vehicle moved to archive')
        router.push('/garage')
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to archive vehicle')
        setIsDeleting(false)
      }
    }
  }

  const preferredBook = cashflowBooks.find((b) => b.id === vehicle.preferred_cashflow_id)

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:px-8'>
      {/* Navigation & Header */}
      <div className='space-y-2'>
        <BreadcrumbNav title={vehicle.name} />

        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
              {vehicle.name}
            </h1>

            <div className='mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
              <VehicleTypeBadge type={vehicle.type} />
              {vehicle.is_default && !vehicle.is_archived && (
                <span className='inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-primary'>
                  <LuStar className='size-3 shrink-0 fill-primary' aria-hidden='true' />
                  Default
                </span>
              )}
              {vehicle.is_archived && (
                <span className='inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted px-2.5 py-0.5 text-[0.68rem] font-medium text-muted-foreground'>
                  <LuArchive className='size-3 shrink-0' aria-hidden='true' />
                  Archived
                </span>
              )}
              {vehicle.license_plate && (
                <span className='font-mono font-semibold uppercase tracking-wider rounded border border-border/80 bg-secondary/60 px-2 py-0.5 text-foreground'>
                  {vehicle.license_plate}
                </span>
              )}
              {vehicle.year && (
                <>
                  <span className='text-border select-none'>•</span>
                  <span>{vehicle.year}</span>
                </>
              )}
              <span className='text-border select-none'>•</span>
              <span className='capitalize flex items-center gap-1'>
                <LuFuel className='size-3' aria-hidden='true' />
                {vehicle.fuel_type}
              </span>
              <span className='text-border select-none'>•</span>
              <span>Currency: {vehicle.currency}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className='flex flex-wrap items-center gap-2'>
            {!vehicle.is_archived && (
              <Button
                size='sm'
                onClick={() => setIsOdometerOpen(true)}
                className='min-h-9 text-xs gap-1.5 font-medium shadow-xs'
              >
                <LuGauge className='size-3.5' aria-hidden='true' />
                Update Odometer
              </Button>
            )}

            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsEditOpen(true)}
              className='min-h-9 text-xs gap-1.5'
            >
              <LuPencil className='size-3.5' aria-hidden='true' />
              Edit Vehicle
            </Button>

            {!vehicle.is_archived && !vehicle.is_default && (
              <Button
                variant='outline'
                size='sm'
                onClick={handleSetDefault}
                className='min-h-9 text-xs'
              >
                <LuCheck className='mr-1.5 size-3.5' aria-hidden='true' />
                Set Default
              </Button>
            )}

            {vehicle.is_archived && (
              <Button
                variant='outline'
                size='sm'
                onClick={handleToggleArchive}
                className='min-h-9 text-xs'
              >
                <LuArchiveRestore className='mr-1.5 size-3.5' aria-hidden='true' />
                Restore to Active
              </Button>
            )}

            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsDeleteOpen(true)}
              className='min-h-9 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive'
            >
              <LuTrash2 className='mr-1.5 size-3.5' aria-hidden='true' />
              {vehicle.is_archived ? 'Delete Permanently' : 'Delete Vehicle'}
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Navigation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          if (
            val === 'specs' ||
            val === 'rules' ||
            val === 'service' ||
            val === 'tax' ||
            val === 'fuel'
          ) {
            setActiveTab(val)
          }
        }}
        className='gap-6'
      >
        <TabsList variant='line'>
          <TabsTrigger value='specs'>
            Vehicle Specs & Odometer
          </TabsTrigger>

          <TabsTrigger value='rules'>
            <LuWrench className='size-3.5' aria-hidden='true' />
            Maintenance Rules
            <span className='rounded bg-secondary px-1 text-[0.65rem] text-muted-foreground'>Day 2</span>
          </TabsTrigger>

          <TabsTrigger value='service'>
            <LuHistory className='size-3.5' aria-hidden='true' />
            Service History
            <span className='rounded bg-secondary px-1 text-[0.65rem] text-muted-foreground'>Day 3</span>
          </TabsTrigger>

          <TabsTrigger value='tax'>
            <LuFileText className='size-3.5' aria-hidden='true' />
            Tax & Documents
            <span className='rounded bg-secondary px-1 text-[0.65rem] text-muted-foreground'>Day 4</span>
          </TabsTrigger>

          <TabsTrigger value='fuel'>
            <LuFuel className='size-3.5' aria-hidden='true' />
            Fuel Economy
            <span className='rounded bg-secondary px-1 text-[0.65rem] text-muted-foreground'>Day 5</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Specs & Odometer History */}
        <TabsContent value='specs' className='space-y-6'>
          {/* Key Metrics Bento */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Odometer Card */}
            <div className='rounded-xl border border-border/80 bg-card p-4'>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span className='font-medium flex items-center gap-1.5'>
                  <LuGauge className='size-3.5 text-primary' aria-hidden='true' />
                  Last Recorded
                </span>
                <div className='flex items-center gap-2'>
                  {!vehicle.is_archived && (
                    <button
                      type='button'
                      onClick={() => setIsOdometerOpen(true)}
                      className='text-[11px] font-semibold text-primary hover:underline cursor-pointer'
                    >
                      Update
                    </button>
                  )}
                  <span className='text-[0.68rem] uppercase font-mono'>
                    {vehicle.odometer_unit}
                  </span>
                </div>
              </div>
              <div className='mt-2 flex items-baseline gap-2 flex-wrap'>
                <span className='font-mono text-2xl font-bold tracking-tight text-foreground'>
                  {formatOdometer(vehicle.current_odometer, vehicle.odometer_unit)}
                </span>
                {prediction.hasPrediction && (
                  <span className='text-xs text-muted-foreground/80 font-normal'>
                    · {prediction.elapsedDays}d ago
                  </span>
                )}
              </div>
              {prediction.hasPrediction ? (
                <div className='mt-1.5 flex items-center gap-1.5 text-[0.72rem] text-muted-foreground'>
                  <span className='inline-block size-1.5 rounded-full bg-primary/70 shrink-0' />
                  <span>
                    Est. today:{' '}
                    <strong className='font-mono font-medium text-foreground'>
                      ~{formatOdometer(prediction.predictedOdometer, vehicle.odometer_unit)}
                    </strong>
                  </span>
                </div>
              ) : (
                <p className='mt-1 text-[0.72rem] text-muted-foreground'>
                  Last updated {vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleDateString() : 'recently'}
                </p>
              )}
            </div>

            {/* Monthly Velocity Card */}
            <div className='rounded-xl border border-border/80 bg-card p-4'>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span className='font-medium flex items-center gap-1.5'>
                  <LuCalendar className='size-3.5 text-primary' aria-hidden='true' />
                  Monthly Velocity
                </span>
              </div>
              <div className='mt-2 font-mono text-2xl font-bold tracking-tight text-foreground'>
                ~{velocity.monthlyVelocity.toLocaleString()} {vehicle.odometer_unit}
              </div>
              <p className='mt-1 text-[0.72rem] text-muted-foreground'>
                ~{velocity.dailyVelocity.toLocaleString()} {vehicle.odometer_unit}/day estimate
              </p>
            </div>

            {/* Powertrain & Fuel */}
            <div className='rounded-xl border border-border/80 bg-card p-4'>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span className='font-medium flex items-center gap-1.5'>
                  <LuFuel className='size-3.5 text-primary' aria-hidden='true' />
                  Powertrain
                </span>
              </div>
              <div className='mt-2 text-xl font-bold tracking-tight text-foreground capitalize'>
                {vehicle.fuel_type}
              </div>
              <p className='mt-1 text-[0.72rem] text-muted-foreground'>
                Cost currency: {vehicle.currency}
              </p>
            </div>

            {/* Sticky Cashflow Book */}
            <div className='rounded-xl border border-border/80 bg-card p-4'>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span className='font-medium'>Cashflow Sync</span>
              </div>
              <div className='mt-2 text-base font-semibold text-foreground truncate'>
                {preferredBook ? preferredBook.title : 'Not configured'}
              </div>
              <p className='mt-1 text-[0.72rem] text-muted-foreground truncate'>
                {preferredBook ? '1-click service & fuel logs' : 'Select a book in Edit Vehicle'}
              </p>
            </div>
          </div>

          {/* Rolling Monthly Odometers */}
          <div className='rounded-xl border border-border/80 bg-card p-5'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-sm font-semibold tracking-[-0.01em] text-foreground flex items-center gap-2'>
                  <LuHistory className='size-4 text-primary' aria-hidden='true' />
                  Rolling Monthly Odometer Snapshots
                </h3>
                <p className='mt-0.5 text-xs text-muted-foreground'>
                  Auto-updated whenever you log services, fuel fill-ups, or manual edits.
                </p>
              </div>
              <span className='font-mono text-xs text-muted-foreground'>
                {initialOdometers.length} snapshot{initialOdometers.length === 1 ? '' : 's'}
              </span>
            </div>

            {initialOdometers.length === 0 ? (
              <div className='mt-4 rounded-lg border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground'>
                No monthly odometer snapshots recorded yet.
              </div>
            ) : (
              <div className='mt-4 divide-y divide-border/60'>
                {initialOdometers.map((m, idx) => {
                  const nextRecord = initialOdometers[idx + 1]
                  const delta = nextRecord ? m.odometer - nextRecord.odometer : null
                  return (
                    <div
                      key={m.id}
                      className='flex items-center justify-between py-3 text-xs'
                    >
                      <div className='flex items-center gap-3'>
                        <span className='font-mono font-semibold text-foreground'>
                          {m.year_month}
                        </span>
                        <span className='font-mono text-muted-foreground'>
                          {formatOdometer(m.odometer, vehicle.odometer_unit)}
                        </span>
                      </div>
                      <div>
                        {delta !== null ? (
                          <span
                            className={`font-mono text-xs ${
                              delta >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-destructive'
                            }`}
                          >
                            {delta >= 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()}{' '}
                            {vehicle.odometer_unit}
                          </span>
                        ) : (
                          <span className='text-[0.68rem] text-muted-foreground'>
                            Initial Reading
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Maintenance Rules Placeholder (Day 2) */}
        <TabsContent value='rules'>
          <div className='rounded-xl border border-dashed border-border/80 p-8 text-center'>
            <LuWrench className='mx-auto size-8 text-muted-foreground/60' aria-hidden='true' />
            <h3 className='mt-3 text-sm font-semibold text-foreground'>
              Maintenance Checklist & Interval Engine
            </h3>
            <p className='mt-1 max-w-md mx-auto text-xs text-muted-foreground'>
              Coming in <strong>Day 2</strong>: Smart presets for {vehicle.name} ({vehicle.type === 'motorcycle' ? 'CVT Belt, Engine Oil, Gear Oil' : 'Synthetic Oil, Oil Filter, Cabin Filter, Brake Pads'}).
            </p>
          </div>
        </TabsContent>

        {/* Tab: Service History Placeholder (Day 3) */}
        <TabsContent value='service'>
          <div className='rounded-xl border border-dashed border-border/80 p-8 text-center'>
            <LuHistory className='mx-auto size-8 text-muted-foreground/60' aria-hidden='true' />
            <h3 className='mt-3 text-sm font-semibold text-foreground'>
              Service Logging & Due Predictor
            </h3>
            <p className='mt-1 max-w-md mx-auto text-xs text-muted-foreground'>
              Coming in <strong>Day 3</strong>: Timeline logging, receipt bookmarks, and real-time maintenance countdown badges (🟢 Good, 🟡 Due Soon, 🔴 Overdue).
            </p>
          </div>
        </TabsContent>

        {/* Tab: Tax & Documents Placeholder (Day 4) */}
        <TabsContent value='tax'>
          <div className='rounded-xl border border-dashed border-border/80 p-8 text-center'>
            <LuFileText className='mx-auto size-8 text-muted-foreground/60' aria-hidden='true' />
            <h3 className='mt-3 text-sm font-semibold text-foreground'>
              Vehicle Tax, Registration & Insurance Expiry
            </h3>
            <p className='mt-1 max-w-md mx-auto text-xs text-muted-foreground'>
              Coming in <strong>Day 4</strong>: Renewal countdown cards and 1-click Cashflow sync for annual road tax, registration, and insurance policies.
            </p>
          </div>
        </TabsContent>

        {/* Tab: Fuel Economy Placeholder (Day 5) */}
        <TabsContent value='fuel'>
          <div className='rounded-xl border border-dashed border-border/80 p-8 text-center'>
            <LuFuel className='mx-auto size-8 text-muted-foreground/60' aria-hidden='true' />
            <h3 className='mt-3 text-sm font-semibold text-foreground'>
              Fuel Log & Mileage Efficiency
            </h3>
            <p className='mt-1 max-w-md mx-auto text-xs text-muted-foreground'>
              Coming in <strong>Day 5</strong>: Gas station pump calculator, partial fill-up math, km/L economy tracking, and auto-odometer sync.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        vehicle={vehicle}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={(updated) => {
          setVehicle(updated)
          router.refresh()
        }}
        cashflowBooks={cashflowBooks}
      />

      {/* Update Odometer Modal */}
      <UpdateOdometerModal
        vehicle={vehicle}
        isOpen={isOdometerOpen}
        onClose={() => setIsOdometerOpen(false)}
        onSuccess={(updated) => {
          setVehicle(updated)
          router.refresh()
        }}
      />

      {/* Delete / Archive Confirmation Alert */}
      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setIsDeleteOpen(false)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-base font-semibold'>
              {vehicle.is_archived ? `Permanently delete ${vehicle.name}?` : `Delete ${vehicle.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs text-muted-foreground'>
              {vehicle.is_archived ? (
                <>
                  This action is irreversible. All vehicle specifications and rolling monthly odometer snapshots will be permanently erased.
                </>
              ) : (
                <>
                  This will remove this vehicle from your active garage. Its full odometer history and records will remain safely saved in your Archived tab.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='text-xs' disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant='destructive'
                size='sm'
                loading={isDeleting}
                onClick={async (e) => {
                  e.preventDefault()
                  await handleDelete()
                }}
              >
                {vehicle.is_archived ? 'Delete Forever' : 'Delete Vehicle'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
