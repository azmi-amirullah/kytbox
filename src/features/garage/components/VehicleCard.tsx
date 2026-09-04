'use client'

import Link from 'next/link'
import {
  LuStar,
  LuEllipsisVertical,
  LuPencil,
  LuArchive,
  LuArchiveRestore,
  LuTrash2,
  LuArrowRight,
  LuFuel,
  LuGauge,
  LuCheck,
} from 'react-icons/lu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { VehicleDTO } from '@/types/dto'
import { VehicleTypeBadge } from './VehicleTypeBadge'
import { formatOdometer, predictCurrentOdometer } from '../lib/odometer'

interface VehicleCardProps {
  vehicle: VehicleDTO
  onEdit: (vehicle: VehicleDTO) => void
  onSetDefault: (vehicleId: string) => void
  onToggleArchive: (vehicleId: string, isArchived: boolean) => void
  onDelete: (vehicleId: string) => void
}

export function VehicleCard({
  vehicle,
  onEdit,
  onSetDefault,
  onToggleArchive,
  onDelete,
}: VehicleCardProps) {
  const isArchived = vehicle.is_archived
  const prediction = predictCurrentOdometer(
    vehicle.current_odometer,
    vehicle.updated_at,
    vehicle.estimated_monthly_km ?? 1000,
  )

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border bg-card p-4 sm:p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm ${
        isArchived
          ? 'border-border/60 bg-muted/20 opacity-80'
          : vehicle.is_default
            ? 'border-primary/50 shadow-sm ring-1 ring-primary/20'
            : 'border-border/80'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <VehicleTypeBadge type={vehicle.type} />
            {vehicle.is_default && !isArchived && (
              <span className='inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-primary'>
                <LuStar className='size-3 shrink-0 fill-primary' aria-hidden='true' />
                Default
              </span>
            )}
            {isArchived && (
              <span className='inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted px-2 py-0.5 text-[0.68rem] font-medium text-muted-foreground'>
                <LuArchive className='size-3 shrink-0' aria-hidden='true' />
                Archived
              </span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='size-8 shrink-0 text-muted-foreground hover:text-foreground'
                aria-label={`Options for ${vehicle.name}`}
              >
                <LuEllipsisVertical className='size-4' aria-hidden='true' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem onClick={() => onEdit(vehicle)}>
                <LuPencil className='mr-2 size-4' aria-hidden='true' />
                Edit vehicle
              </DropdownMenuItem>

              {!isArchived && !vehicle.is_default && (
                <DropdownMenuItem onClick={() => onSetDefault(vehicle.id)}>
                  <LuCheck className='mr-2 size-4' aria-hidden='true' />
                  Set as default
                </DropdownMenuItem>
              )}

              {isArchived && (
                <DropdownMenuItem
                  onClick={() => onToggleArchive(vehicle.id, false)}
                >
                  <LuArchiveRestore className='mr-2 size-4' aria-hidden='true' />
                  Restore vehicle
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onDelete(vehicle.id)}
                className='text-destructive focus:bg-destructive/10 focus:text-destructive'
              >
                <LuTrash2 className='mr-2 size-4' aria-hidden='true' />
                {isArchived ? 'Delete forever' : 'Delete vehicle'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Vehicle Title & License Plate */}
        <div className='mt-3'>
          <h3 className='text-base sm:text-lg font-semibold tracking-[-0.02em] text-foreground group-hover:text-primary transition-colors'>
            <Link href={`/garage/${vehicle.id}`} className='focus-visible:outline-none focus-visible:underline'>
              {vehicle.name}
            </Link>
          </h3>

          <div className='mt-1.5 flex flex-wrap items-center gap-2'>
            {vehicle.license_plate && (
              <span className='font-mono text-xs font-semibold uppercase tracking-wider rounded border border-border/80 bg-secondary/60 px-2 py-0.5 text-foreground'>
                {vehicle.license_plate}
              </span>
            )}
            {vehicle.year && (
              <span className='text-xs text-muted-foreground'>
                {vehicle.year}
              </span>
            )}
            <span className='inline-flex items-center gap-1 text-xs text-muted-foreground capitalize'>
              <LuFuel className='size-3' aria-hidden='true' />
              {vehicle.fuel_type}
            </span>
          </div>
        </div>

        {/* Odometer Metric */}
        <div className='mt-4 rounded-lg border border-border/60 bg-secondary/30 p-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-muted-foreground flex items-center gap-1.5'>
              <LuGauge className='size-3.5 text-primary' aria-hidden='true' />
              Last Recorded
            </span>
            {vehicle.estimated_monthly_km ? (
              <span className='font-mono text-[0.68rem] text-muted-foreground'>
                ~{vehicle.estimated_monthly_km} {vehicle.odometer_unit}/mo
              </span>
            ) : null}
          </div>
          <div className='mt-1 flex items-baseline gap-2 flex-wrap'>
            <span className='font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
              {formatOdometer(vehicle.current_odometer, vehicle.odometer_unit)}
            </span>
            {prediction.hasPrediction && (
              <span className='text-xs text-muted-foreground/80 font-normal'>
                · {prediction.elapsedDays}d ago
              </span>
            )}
          </div>
          {prediction.hasPrediction && (
            <div className='mt-1.5 flex items-center gap-1.5 text-[0.72rem] text-muted-foreground'>
              <span className='inline-block size-1.5 rounded-full bg-primary/70 shrink-0' />
              <span>
                Est. today:{' '}
                <strong className='font-mono font-medium text-foreground'>
                  ~{formatOdometer(prediction.predictedOdometer, vehicle.odometer_unit)}
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className='mt-4 pt-3 border-t border-border/60 flex items-center justify-between'>
        <span className='text-xs text-muted-foreground'>
          {vehicle.currency}
        </span>
        <Link
          href={`/garage/${vehicle.id}`}
          className='inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-2 py-1'
        >
          View details
          <LuArrowRight className='size-3.5' aria-hidden='true' />
        </Link>
      </div>
    </div>
  )
}
