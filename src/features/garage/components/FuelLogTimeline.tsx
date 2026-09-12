'use client'

import { useState, useTransition } from 'react'
import { toast } from 'react-toastify'
import {
  LuFuel,
  LuPlus,
  LuPencil,
  LuCalendar,
  LuGauge,
  LuCoins,
  LuTrash2,
  LuHourglass,
  LuInfo,
  LuBatteryCharging,
  LuWallet,
  LuFlame,
} from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import type { VehicleDTO, VehicleFuelLogDTO } from '@/types/dto'
import { deleteVehicleFuelLog } from '../actions'
import { getFuelUnitLabels, calculateFuelStats } from '../lib/fuel-math'
import { formatOdometer } from '../lib/odometer'
import { formatCurrency } from '@/lib/currency'
import { AddFuelLogModal } from './AddFuelLogModal'

interface FuelLogTimelineProps {
  vehicle: VehicleDTO
  fuelLogs: VehicleFuelLogDTO[]
  predictedOdometer?: number
  isPredictedOdometer?: boolean
  cashflowBooks?: Array<{ id: string; title: string; currency?: string }>
  onLogsChanged?: (updated: VehicleFuelLogDTO[]) => void
}

export function FuelLogTimeline({
  vehicle,
  fuelLogs,
  predictedOdometer,
  isPredictedOdometer,
  cashflowBooks = [],
  onLogsChanged,
}: FuelLogTimelineProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<VehicleFuelLogDTO | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const unitLabels = getFuelUnitLabels(vehicle.fuel_type, vehicle.odometer_unit)
  const stats = calculateFuelStats(fuelLogs)
  const isElectric = vehicle.fuel_type === 'electric'

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteVehicleFuelLog({ id })
      if (res.success) {
        toast.success('Fuel log removed')
        const updated = fuelLogs.filter((l) => l.id !== id)
        onLogsChanged?.(updated)
      } else {
        toast.error(res.error || 'Failed to delete fuel log')
      }
      setDeletingId(null)
    })
  }

  return (
    <div className='space-y-6'>
      {/* Bento KPI Summary Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Average Fuel Economy */}
        <div className='rounded-xl border border-border/80 bg-card p-4'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-medium flex items-center gap-1.5'>
              <LuFlame className='size-3.5 text-primary' aria-hidden='true' />
              Average Economy
            </span>
            <span className='text-[0.68rem] font-mono uppercase'>
              {unitLabels.efficiencyUnit}
            </span>
          </div>
          <div className='mt-2 flex items-baseline gap-1.5'>
            <span className='font-mono text-2xl font-bold tracking-tight text-foreground'>
              {stats.averageEconomy !== null ? stats.averageEconomy.toFixed(1) : '—'}
            </span>
            {stats.averageEconomy !== null && (
              <span className='text-xs text-muted-foreground font-medium'>
                {unitLabels.efficiencyUnit}
              </span>
            )}
          </div>
          <p className='mt-1 text-[0.72rem] text-muted-foreground'>
            {stats.lastEconomy !== null
              ? `Latest fill-up: ${stats.lastEconomy.toFixed(1)} ${unitLabels.efficiencyUnit}`
              : 'Requires 2 consecutive full tanks'}
          </p>
        </div>

        {/* Total Spent */}
        <div className='rounded-xl border border-border/80 bg-card p-4'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-medium flex items-center gap-1.5'>
              <LuCoins className='size-3.5 text-primary' aria-hidden='true' />
              Total Fuel Spent
            </span>
            <span className='text-[0.68rem] font-mono'>
              {vehicle.currency}
            </span>
          </div>
          <div className='mt-2 font-mono text-2xl font-bold tracking-tight text-foreground truncate'>
            {formatCurrency(stats.totalCost, vehicle.currency)}
          </div>
          <p className='mt-1 text-[0.72rem] text-muted-foreground'>
            Across {stats.totalLogs} recorded {stats.totalLogs === 1 ? 'fill-up' : 'fill-ups'}
          </p>
        </div>

        {/* Total Volume */}
        <div className='rounded-xl border border-border/80 bg-card p-4'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-medium flex items-center gap-1.5'>
              <LuFuel className='size-3.5 text-primary' aria-hidden='true' />
              Volume Consumed
            </span>
            <span className='text-[0.68rem] font-mono'>
              {unitLabels.volumeUnit}
            </span>
          </div>
          <div className='mt-2 font-mono text-2xl font-bold tracking-tight text-foreground'>
            {stats.totalVolume.toLocaleString()} {unitLabels.volumeUnit}
          </div>
          <p className='mt-1 text-[0.72rem] text-muted-foreground'>
            {stats.fullTankCount} full · {stats.partialCount} partial
          </p>
        </div>

        {/* Cost per Distance Unit */}
        <div className='rounded-xl border border-border/80 bg-card p-4'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-medium flex items-center gap-1.5'>
              <LuGauge className='size-3.5 text-primary' aria-hidden='true' />
              Cost per {vehicle.odometer_unit.toUpperCase()}
            </span>
            <span className='text-[0.68rem] font-mono'>
              {vehicle.currency}/{vehicle.odometer_unit}
            </span>
          </div>
          <div className='mt-2 font-mono text-2xl font-bold tracking-tight text-foreground truncate'>
            {stats.costPerDistanceUnit !== null
              ? `${formatCurrency(stats.costPerDistanceUnit, vehicle.currency)}`
              : '—'}
          </div>
          <p className='mt-1 text-[0.72rem] text-muted-foreground'>
            {stats.totalTrackedDistance > 0
              ? `Tracked over ${stats.totalTrackedDistance.toLocaleString()} ${vehicle.odometer_unit}`
              : 'Add more logs to calculate'}
          </p>
        </div>
      </div>

      {/* Header & Add Button */}
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <h3 className='text-sm font-semibold text-foreground flex items-center gap-2'>
            <LuFuel className='size-4 text-primary' aria-hidden='true' />
            Fuel Log History
            {fuelLogs.length > 0 && (
              <Badge variant='secondary' className='text-[0.65rem] px-1.5 py-0'>
                {fuelLogs.length}
              </Badge>
            )}
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Pump receipts, mileage efficiency stamps, and Cashflow synchronizations.
          </p>
        </div>

        {!vehicle.is_archived && (
          <Button
            size='sm'
            onClick={() => setIsAddOpen(true)}
            className='flex items-center gap-1.5 text-xs'
          >
            <LuPlus className='size-3.5' aria-hidden='true' />
            <span>Log Fill-up</span>
          </Button>
        )}
      </div>

      {/* Fuel Logs Timeline */}
      {fuelLogs.length === 0 ? (
        <div className='rounded-xl border border-dashed border-border/80 p-8 text-center bg-card/30 space-y-3'>
          <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <LuFuel className='size-6' aria-hidden='true' />
          </div>
          <div className='space-y-1 max-w-sm mx-auto'>
            <h4 className='text-sm font-semibold text-foreground'>No Fuel Logs Recorded Yet</h4>
            <p className='text-xs text-muted-foreground'>
              Log your gas station pump receipts to monitor fuel economy ({unitLabels.efficiencyUnit}), spot engine anomalies, and sync costs to Cashflow.
            </p>
          </div>
          {!vehicle.is_archived && (
            <Button
              size='sm'
              onClick={() => setIsAddOpen(true)}
              className='text-xs'
            >
              <LuPlus className='size-3.5 mr-1.5' />
              Record First Fill-up
            </Button>
          )}
        </div>
      ) : (
        <div className='space-y-3'>
          {fuelLogs.map((log) => {
            const dateDisplay = new Date(log.log_date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })

            return (
              <div
                key={log.id}
                className='group rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-border hover:shadow-xs'
              >
                <div className='flex items-start justify-between gap-3 flex-wrap'>
                  {/* Left Column: Date, Odometer, Badges */}
                  <div className='space-y-1.5'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                        <LuCalendar className='size-3.5 text-muted-foreground' aria-hidden='true' />
                        {dateDisplay}
                      </span>
                      <span className='text-muted-foreground text-xs'>•</span>
                      <span className='font-mono text-xs font-medium text-foreground flex items-center gap-1'>
                        <LuGauge className='size-3.5 text-muted-foreground' aria-hidden='true' />
                        {formatOdometer(log.odometer, vehicle.odometer_unit)}
                      </span>

                      {/* Economy Badge */}
                      {log.calculated_kml !== null ? (
                        <Badge
                          variant='outline'
                          className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[0.68rem] font-mono font-semibold'
                        >
                          <LuFlame className='size-3 mr-1' aria-hidden='true' />
                          {log.calculated_kml.toFixed(1)} {unitLabels.efficiencyUnit}
                        </Badge>
                      ) : !log.is_full_tank ? (
                        <Badge
                          variant='secondary'
                          className='text-[0.68rem] text-muted-foreground'
                        >
                          <LuHourglass className='size-3 mr-1' aria-hidden='true' />
                          Pending Full Tank
                        </Badge>
                      ) : (
                        <Badge
                          variant='outline'
                          className='text-[0.68rem] text-muted-foreground'
                        >
                          <LuInfo className='size-3 mr-1' aria-hidden='true' />
                          {log.is_missed_previous ? 'Baseline Reset' : 'Baseline Fill-up'}
                        </Badge>
                      )}

                      {/* EV Battery Badge */}
                      {isElectric &&
                        log.battery_start_pct !== null &&
                        log.battery_end_pct !== null && (
                          <Badge
                            variant='outline'
                            className='bg-primary/10 text-primary border-primary/20 text-[0.68rem] font-mono'
                          >
                            <LuBatteryCharging className='size-3 mr-1' aria-hidden='true' />
                            {log.battery_start_pct}% → {log.battery_end_pct}%
                          </Badge>
                        )}

                      {/* Cashflow Synced Badge */}
                      {log.cashflow_entry_id && (
                        <Badge
                          variant='outline'
                          className='text-[0.68rem] text-primary/80 border-primary/25'
                        >
                          <LuWallet className='size-3 mr-1' aria-hidden='true' />
                          Cashflow
                        </Badge>
                      )}
                    </div>

                    {/* Fuel Volume & Price Details */}
                    <div className='flex items-center gap-3 text-xs text-muted-foreground flex-wrap'>
                      <span>
                        Volume:{' '}
                        <strong className='font-mono text-foreground font-semibold'>
                          {Number(log.fuel_amount).toLocaleString()} {unitLabels.volumeUnit}
                        </strong>
                      </span>
                      {log.price_per_unit !== null && (
                        <span>
                          Price:{' '}
                          <span className='font-mono'>
                            {formatCurrency(log.price_per_unit, vehicle.currency)}/{unitLabels.volumeUnit}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Optional Notes */}
                    {log.notes && (
                      <p className='text-xs text-muted-foreground/90 italic pt-0.5'>
                        &ldquo;{log.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Right Column: Total Cost & Delete Action */}
                  <div className='flex items-center gap-3 self-center sm:self-start'>
                    <div className='text-right'>
                      <div className='font-mono text-sm font-bold text-foreground'>
                        {formatCurrency(log.total_cost, vehicle.currency)}
                      </div>
                      <span className='text-[0.68rem] text-muted-foreground'>
                        {log.is_full_tank ? 'Full Tank' : 'Partial'}
                      </span>
                    </div>

                    {!vehicle.is_archived && (
                      <div className='flex items-center gap-1'>
                        <button
                          type='button'
                          onClick={() => setEditingLog(log)}
                          className='rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer opacity-80 group-hover:opacity-100'
                          title='Edit Fuel Log'
                          aria-label={`Edit fuel log from ${dateDisplay}`}
                        >
                          <LuPencil className='size-4' />
                        </button>

                        <button
                          type='button'
                          onClick={() => setDeletingId(log.id)}
                          className='rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer opacity-80 group-hover:opacity-100'
                          title='Delete Fuel Log'
                          aria-label={`Delete fuel log from ${dateDisplay}`}
                        >
                          <LuTrash2 className='size-4' />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Fuel Log Modal */}
      <AddFuelLogModal
        vehicle={vehicle}
        predictedOdometer={predictedOdometer}
        isPredictedOdometer={isPredictedOdometer}
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        cashflowBooks={cashflowBooks}
        onSuccess={(newLog) => {
          onLogsChanged?.([newLog, ...fuelLogs])
        }}
      />

      {/* Edit Fuel Log Modal */}
      {editingLog && (
        <AddFuelLogModal
          key={editingLog.id}
          vehicle={vehicle}
          isOpen={Boolean(editingLog)}
          onClose={() => setEditingLog(null)}
          cashflowBooks={cashflowBooks}
          logToEdit={editingLog}
          onSuccess={(updatedLog) => {
            setEditingLog(null)
            onLogsChanged?.(
              fuelLogs.map((l) => (l.id === updatedLog.id ? updatedLog : l)),
            )
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={Boolean(deletingId)} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-base font-semibold'>
              Delete Fuel Log?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs text-muted-foreground'>
              This will remove this fill-up entry and recalculate your historical fuel economy sequence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='text-xs'>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={isPending}
              className='bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs'
            >
              {isPending ? 'Deleting...' : 'Delete Log'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
