'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import {
  LuWrench,
  LuHistory,
  LuCalendar,
  LuGauge,
  LuPlus,
  LuSearch,
  LuTrash2,
  LuPencil,
  LuReceipt,
  LuExternalLink,
  LuShieldAlert,
  LuShieldCheck,
  LuClock,
  LuFileText,
  LuSparkles,
  LuX,
} from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type {
  VehicleDTO,
  VehicleMaintenanceRuleDTO,
  VehicleServiceDTO,
  ServiceType,
} from '@/types/dto'
import { formatCurrency } from '@/lib/currency'
import { formatOdometer } from '../lib/odometer'
import { predictNextMaintenance } from '../lib/rules-math'
import { sanitizeInvoiceUrl } from '../lib/invoice-url'
import { deleteVehicleService } from '../actions'
import { EditServiceModal } from './EditServiceModal'

interface ServiceLogTimelineProps {
  vehicle: VehicleDTO
  maintenanceRules: VehicleMaintenanceRuleDTO[]
  services?: VehicleServiceDTO[]
  initialServices?: VehicleServiceDTO[]
  onDeleteService?: (serviceId: string) => void
  onUpdateService?: (service: VehicleServiceDTO) => void
  onOpenLogModal: () => void
}

const SERVICE_TYPE_BADGES: Record<
  ServiceType,
  { label: string; colorClass: string; bgClass: string; icon: React.ElementType }
> = {
  routine: {
    label: 'Routine Service',
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/10 border-blue-500/20',
    icon: LuWrench,
  },
  repair: {
    label: 'Repair / Fix',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    icon: LuWrench,
  },
  inspection: {
    label: 'Inspection',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    icon: LuShieldCheck,
  },
  upgrade: {
    label: 'Upgrade / Mod',
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-500/10 border-purple-500/20',
    icon: LuSparkles,
  },
}

const SERVICE_TYPES: readonly ServiceType[] = ['routine', 'repair', 'inspection', 'upgrade']

export function ServiceLogTimeline({
  vehicle,
  maintenanceRules,
  services: controlledServices,
  initialServices = [],
  onDeleteService,
  onUpdateService,
  onOpenLogModal,
}: ServiceLogTimelineProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [internalServices, setInternalServices] = useState<VehicleServiceDTO[]>(initialServices)
  const isControlled = controlledServices !== undefined
  const services = isControlled ? controlledServices : internalServices
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [serviceToDelete, setServiceToDelete] = useState<VehicleServiceDTO | null>(null)
  const [deleteCashflowEntry, setDeleteCashflowEntry] = useState<boolean>(true)
  const [zoomReceiptUrl, setZoomReceiptUrl] = useState<string | null>(null)
  const [editingService, setEditingService] = useState<VehicleServiceDTO | null>(null)

  const handleUpdateServiceSuccess = (updated: VehicleServiceDTO) => {
    if (onUpdateService) {
      onUpdateService(updated)
    } else {
      setInternalServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    }
  }

  // Real-time maintenance predictor
  const prediction = predictNextMaintenance(maintenanceRules, {
    currentOdometer: vehicle.current_odometer,
    unit: vehicle.odometer_unit,
  })

  // Summary Metrics
  const totalCost = services.reduce((sum, s) => sum + (Number(s.cost) || 0), 0)
  const avgCost = services.length > 0 ? totalCost / services.length : 0
  const latestService = services[0] || null

  // Filtered Services
  const filteredServices = services.filter((s) => {
    if (filterType !== 'all' && s.service_type !== filterType) {
      return false
    }
    if (!searchQuery.trim()) {
      return true
    }
    const q = searchQuery.toLowerCase().trim()
    const matchesWorkshop = s.workshop_name?.toLowerCase().includes(q)
    const matchesInvoice = s.invoice_number?.toLowerCase().includes(q)
    const matchesNotes = s.notes?.toLowerCase().includes(q)
    const matchesItems = s.items_serviced.some((item) => item.toLowerCase().includes(q))
    return matchesWorkshop || matchesInvoice || matchesNotes || matchesItems
  })

  const handleDeleteService = (service: VehicleServiceDTO) => {
    startTransition(async () => {
      const res = await deleteVehicleService({
        id: service.id,
        vehicleId: vehicle.id,
        deleteCashflowEntry: Boolean(service.cashflow_entry_id && deleteCashflowEntry),
      })

      if (res.success) {
        if (isControlled) {
          onDeleteService?.(service.id)
        } else {
          setInternalServices((prev) => prev.filter((item) => item.id !== service.id))
        }
        toast.success('Service record deleted')
        setServiceToDelete(null)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to delete service record')
      }
    })
  }

  return (
    <div className='space-y-6'>
      {/* 1. Real-time Due Predictor Banner */}
      <div
        className={`rounded-xl border p-4 sm:p-5 transition-all ${
          prediction.status === 'overdue'
            ? 'border-destructive/30 bg-destructive/5'
            : prediction.status === 'due_soon'
              ? 'border-amber-500/30 bg-amber-500/5'
              : prediction.status === 'good'
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-border/80 bg-card'
        }`}
      >
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-start gap-3'>
            <div
              className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
                prediction.status === 'overdue'
                  ? 'bg-destructive/15 text-destructive'
                  : prediction.status === 'due_soon'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : prediction.status === 'good'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
              }`}
            >
              {prediction.status === 'overdue' ? (
                <LuShieldAlert className='size-5' aria-hidden='true' />
              ) : prediction.status === 'due_soon' ? (
                <LuClock className='size-5' aria-hidden='true' />
              ) : prediction.status === 'good' ? (
                <LuShieldCheck className='size-5' aria-hidden='true' />
              ) : (
                <LuWrench className='size-5' aria-hidden='true' />
              )}
            </div>

            <div>
              <div className='flex items-center gap-2 flex-wrap'>
                <h3 className='text-sm font-semibold text-foreground'>
                  {prediction.status === 'overdue'
                    ? `Maintenance Overdue (${prediction.overdueCount} item${prediction.overdueCount > 1 ? 's' : ''})`
                    : prediction.status === 'due_soon'
                      ? `Service Due Soon (${prediction.dueSoonCount} item${prediction.dueSoonCount > 1 ? 's' : ''})`
                      : prediction.status === 'good'
                        ? 'All Maintenance Up to Date'
                        : 'No Maintenance Intervals Configured'}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    prediction.status === 'overdue'
                      ? 'bg-destructive/20 text-destructive'
                      : prediction.status === 'due_soon'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        : prediction.status === 'good'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {prediction.status}
                </span>
              </div>

              <p className='mt-0.5 text-xs text-muted-foreground'>
                {prediction.mostUrgentRule ? (
                  <>
                    Next priority:{' '}
                    <strong className='font-medium text-foreground'>
                      {prediction.mostUrgentRule.rule.name}
                    </strong>
                    {prediction.nextDueDistance !== null && (
                      <>
                        {' • '}
                        {prediction.nextDueDistance <= 0 ? (
                          <span className='text-destructive font-medium'>
                            {Math.abs(prediction.nextDueDistance).toLocaleString()}{' '}
                            {vehicle.odometer_unit} overdue
                          </span>
                        ) : (
                          <span>
                            due in {prediction.nextDueDistance.toLocaleString()}{' '}
                            {vehicle.odometer_unit}
                          </span>
                        )}
                      </>
                    )}
                    {prediction.nextDueDate && (
                      <>
                        {' • '}
                        <span>due date: {prediction.nextDueDate}</span>
                      </>
                    )}
                  </>
                ) : (
                  'Configure vehicle rules in the Maintenance Rules tab to activate proactive service countdowns.'
                )}
              </p>
            </div>
          </div>

          <Button
            size='sm'
            onClick={onOpenLogModal}
            className='self-start sm:self-center text-xs gap-1.5 shrink-0'
          >
            <LuPlus className='size-3.5' aria-hidden='true' />
            Log Service Visit
          </Button>
        </div>
      </div>

      {/* 2. Key Maintenance Metrics */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <div className='rounded-xl border border-border/80 bg-card p-3.5'>
          <span className='text-xs text-muted-foreground font-medium flex items-center gap-1.5'>
            <LuHistory className='size-3.5 text-primary' aria-hidden='true' />
            Services Logged
          </span>
          <p className='mt-1 text-xl font-bold font-mono text-foreground'>{services.length}</p>
          <span className='text-[10px] text-muted-foreground'>Total records</span>
        </div>

        <div className='rounded-xl border border-border/80 bg-card p-3.5'>
          <span className='text-xs text-muted-foreground font-medium flex items-center gap-1.5'>
            <LuReceipt className='size-3.5 text-emerald-500' aria-hidden='true' />
            Lifetime Spend
          </span>
          <p className='mt-1 text-xl font-bold font-mono text-foreground truncate'>
            {formatCurrency(totalCost, vehicle.currency)}
          </p>
          <span className='text-[10px] text-muted-foreground'>Maintenance & repairs</span>
        </div>

        <div className='rounded-xl border border-border/80 bg-card p-3.5'>
          <span className='text-xs text-muted-foreground font-medium flex items-center gap-1.5'>
            <LuWrench className='size-3.5 text-blue-500' aria-hidden='true' />
            Average Cost
          </span>
          <p className='mt-1 text-xl font-bold font-mono text-foreground truncate'>
            {formatCurrency(avgCost, vehicle.currency)}
          </p>
          <span className='text-[10px] text-muted-foreground'>Per service visit</span>
        </div>

        <div className='rounded-xl border border-border/80 bg-card p-3.5'>
          <span className='text-xs text-muted-foreground font-medium flex items-center gap-1.5'>
            <LuCalendar className='size-3.5 text-amber-500' aria-hidden='true' />
            Last Serviced
          </span>
          <p className='mt-1 text-base font-bold font-mono text-foreground truncate'>
            {latestService ? latestService.service_date : 'Never'}
          </p>
          <span className='text-[10px] text-muted-foreground truncate'>
            {latestService
              ? `@ ${formatOdometer(latestService.odometer, vehicle.odometer_unit)}`
              : 'No service logged'}
          </span>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0'>
          <Button
            variant={filterType === 'all' ? 'secondary' : 'ghost'}
            size='sm'
            onClick={() => setFilterType('all')}
            className='h-8 text-xs font-medium'
          >
            All ({services.length})
          </Button>

          {SERVICE_TYPES.map((type) => {
            const count = services.filter((s) => s.service_type === type).length
            return (
              <Button
                key={type}
                variant={filterType === type ? 'secondary' : 'ghost'}
                size='sm'
                onClick={() => setFilterType(type)}
                className='h-8 text-xs font-medium'
              >
                {SERVICE_TYPE_BADGES[type].label} ({count})
              </Button>
            )
          })}
        </div>

        <div className='relative w-full sm:w-64'>
          <LuSearch
            className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground'
            aria-hidden='true'
          />
          <Input
            type='search'
            placeholder='Search workshop, part, invoice...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='h-8 pl-8 text-xs'
          />
          {searchQuery && (
            <button
              type='button'
              onClick={() => setSearchQuery('')}
              className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer'
            >
              <LuX className='size-3' aria-hidden='true' />
            </button>
          )}
        </div>
      </div>

      {/* 4. Service Timeline Records */}
      {filteredServices.length === 0 ? (
        <div className='rounded-xl border border-dashed border-border/80 p-10 text-center'>
          <LuHistory className='mx-auto size-10 text-muted-foreground/50' aria-hidden='true' />
          <h4 className='mt-3 text-sm font-semibold text-foreground'>
            {searchQuery || filterType !== 'all'
              ? 'No matching service records'
              : 'No service history recorded yet'}
          </h4>
          <p className='mt-1 max-w-sm mx-auto text-xs text-muted-foreground'>
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search query or switching to all service types.'
              : 'Keep your vehicle roadworthy, avoid breakdown surprises, and protect resale value by logging regular service visits.'}
          </p>
          {!searchQuery && filterType === 'all' && (
            <Button
              size='sm'
              onClick={onOpenLogModal}
              className='mt-4 text-xs gap-1.5'
            >
              <LuPlus className='size-3.5' aria-hidden='true' />
              Log First Service
            </Button>
          )}
        </div>
      ) : (
        <div className='relative space-y-4 before:absolute before:left-4 sm:before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60'>
          {filteredServices.map((service) => {
            const badge =
              SERVICE_TYPE_BADGES[service.service_type] || SERVICE_TYPE_BADGES.routine
            const Icon = badge.icon
            const invoiceSanitized = sanitizeInvoiceUrl(service.external_invoice_url)

            return (
              <div
                key={service.id}
                className='relative pl-10 sm:pl-12'
              >
                {/* Timeline node icon */}
                <div
                  className={`absolute left-2 sm:left-3 top-4 size-5 -translate-x-1/2 flex items-center justify-center rounded-full border border-background ring-2 ring-border/50 ${badge.bgClass} ${badge.colorClass}`}
                >
                  <Icon className='size-2.5' aria-hidden='true' />
                </div>

                {/* Service Card */}
                <div className='rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-border hover:shadow-xs space-y-3'>
                  {/* Card Header */}
                  <div className='flex flex-wrap items-start justify-between gap-2'>
                    <div>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='font-mono text-sm font-bold text-foreground'>
                          {service.service_date}
                        </span>
                        <Badge
                          variant='outline'
                          className='inline-flex items-center gap-1 border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] font-medium text-foreground'
                        >
                          <LuGauge className='size-3 text-muted-foreground' aria-hidden='true' />
                          {formatOdometer(service.odometer, vehicle.odometer_unit)}
                        </Badge>
                        <Badge
                          variant='outline'
                          className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-semibold ${badge.bgClass} ${badge.colorClass}`}
                        >
                          <Icon className='size-3' aria-hidden='true' />
                          {badge.label}
                        </Badge>
                      </div>

                      {(service.workshop_name || service.invoice_number) && (
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {service.workshop_name && (
                            <span className='font-medium text-foreground'>
                              {service.workshop_name}
                            </span>
                          )}
                          {service.workshop_name && service.invoice_number && ' • '}
                          {service.invoice_number && (
                            <span className='font-mono'>#{service.invoice_number}</span>
                          )}
                        </p>
                      )}
                    </div>

                    <div className='flex items-center gap-3'>
                      <span className='font-mono text-base font-bold text-foreground'>
                        {formatCurrency(Number(service.cost) || 0, vehicle.currency)}
                      </span>
                      <div className='flex items-center gap-0.5'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => setEditingService(service)}
                          className='size-8 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer'
                          aria-label='Edit service record'
                        >
                          <LuPencil className='size-3.5' aria-hidden='true' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => setServiceToDelete(service)}
                          className='size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer'
                          aria-label='Delete service record'
                        >
                          <LuTrash2 className='size-3.5' aria-hidden='true' />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Serviced Checklist Items */}
                  {service.items_serviced.length > 0 && (
                    <div className='flex flex-wrap gap-1.5 pt-1'>
                      {service.items_serviced.map((item, idx) => (
                        <Badge
                          key={idx}
                          variant='outline'
                          className='inline-flex items-center gap-1 border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-foreground'
                        >
                          <span className='size-1 rounded-full bg-primary/70' />
                          {item}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Service Notes */}
                  {service.notes && (
                    <p className='text-xs text-muted-foreground bg-muted/20 rounded-lg p-2.5 border border-border/40'>
                      {service.notes}
                    </p>
                  )}

                  {/* Cloud Receipt Attachment with Drive Thumbnail Sanitizer */}
                  {invoiceSanitized.isValid && (
                    <div className='flex items-center gap-3 rounded-lg border border-border/80 bg-muted/20 p-2.5'>
                      {invoiceSanitized.thumbnailUrl ? (
                        <button
                          type='button'
                          onClick={() => setZoomReceiptUrl(invoiceSanitized.thumbnailUrl)}
                          className='relative size-12 shrink-0 overflow-hidden rounded-md border border-border/80 bg-background hover:opacity-90 transition-opacity cursor-pointer group'
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={invoiceSanitized.thumbnailUrl}
                            alt='Receipt thumbnail'
                            className='size-full object-cover'
                          />
                        </button>
                      ) : (
                        <div className='flex size-10 shrink-0 items-center justify-center rounded-md border border-border/80 bg-background text-muted-foreground'>
                          <LuFileText className='size-4' aria-hidden='true' />
                        </div>
                      )}

                      <div className='min-w-0 flex-1'>
                        <p className='text-xs font-medium text-foreground truncate'>
                          {invoiceSanitized.isDrive
                            ? 'Google Drive Receipt Document'
                            : invoiceSanitized.isDropbox
                              ? 'Dropbox Receipt File'
                              : 'Workshop Invoice Receipt'}
                        </p>
                        <a
                          href={invoiceSanitized.viewUrl || service.external_invoice_url || '#'}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center gap-1 text-[11px] text-primary hover:underline'
                        >
                          View external receipt
                          <LuExternalLink className='size-2.5' aria-hidden='true' />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Zoom Receipt Image Modal */}
      {zoomReceiptUrl && (
        <Dialog open={!!zoomReceiptUrl} onOpenChange={() => setZoomReceiptUrl(null)}>
          <DialogContent className='max-w-2xl p-2'>
            <DialogHeader className='p-2 pb-0'>
              <DialogTitle className='text-sm font-semibold'>Receipt Preview</DialogTitle>
            </DialogHeader>
            <div className='overflow-hidden rounded-lg bg-black/5 p-1'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomReceiptUrl}
                alt='Enlarged receipt'
                className='max-h-[80vh] w-full rounded object-contain'
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Service Confirmation Dialog */}
      <AlertDialog
        open={!!serviceToDelete}
        onOpenChange={(open) => !isPending && !open && setServiceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-base font-semibold'>
              Delete Service Record?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs text-muted-foreground'>
              Are you sure you want to delete the service record logged on{' '}
              <strong>{serviceToDelete?.service_date}</strong> (
              {serviceToDelete &&
                formatOdometer(serviceToDelete.odometer, vehicle.odometer_unit)}
              )? This action cannot be undone.
            </AlertDialogDescription>
            {serviceToDelete?.cashflow_entry_id && (
              <div className='mt-3 flex items-start gap-2.5 rounded-lg border border-border/80 bg-muted/40 p-2.5 text-left'>
                <Checkbox
                  id='delete-service-cf'
                  checked={deleteCashflowEntry}
                  onCheckedChange={(val) => setDeleteCashflowEntry(Boolean(val))}
                  className='mt-0.5'
                />
                <label htmlFor='delete-service-cf' className='text-xs text-foreground cursor-pointer'>
                  Also remove linked expense from Cashflow ledger
                </label>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='text-xs' disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant='destructive'
                size='sm'
                loading={isPending}
                onClick={(e) => {
                  e.preventDefault()
                  if (serviceToDelete) handleDeleteService(serviceToDelete)
                }}
                className='text-xs'
              >
                Delete Record
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Service Modal */}
      <EditServiceModal
        open={editingService !== null}
        onOpenChange={(open) => {
          if (!open) setEditingService(null)
        }}
        service={editingService}
        vehicle={vehicle}
        onSuccess={handleUpdateServiceSuccess}
      />
    </div>
  )
}
