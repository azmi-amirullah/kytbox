'use client'

import { useState, useId, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import {
  LuWrench,
  LuCalendar,
  LuGauge,
  LuLock,
  LuExternalLink,
  LuFileText,
  LuReceipt,
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
import { InputGroup } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { updateVehicleService } from '../actions'
import { sanitizeInvoiceUrl } from '../lib/invoice-url'
import type { VehicleDTO, VehicleServiceDTO } from '@/types/dto'

interface EditServiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: VehicleServiceDTO | null
  vehicle: VehicleDTO
  onSuccess?: (updatedService: VehicleServiceDTO) => void
}

interface EditServiceFormProps {
  service: VehicleServiceDTO
  vehicle: VehicleDTO
  onOpenChange: (open: boolean) => void
  onSuccess?: (updatedService: VehicleServiceDTO) => void
}

function EditServiceForm({
  service,
  vehicle,
  onOpenChange,
  onSuccess,
}: EditServiceFormProps) {
  const router = useRouter()
  const baseId = useId()
  const [isPending, startTransition] = useTransition()

  // Form initialized directly from props without useEffect cascading renders
  const [cost, setCost] = useState<string>(service.cost > 0 ? String(service.cost) : '')
  const [workshopName, setWorkshopName] = useState<string>(service.workshop_name || '')
  const [invoiceNumber, setInvoiceNumber] = useState<string>(service.invoice_number || '')
  const [externalInvoiceUrl, setExternalInvoiceUrl] = useState<string>(service.external_invoice_url || '')
  const [notes, setNotes] = useState<string>(service.notes || '')

  const sanitizedInvoice = sanitizeInvoiceUrl(externalInvoiceUrl)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const costNum = cost.trim() === '' ? 0 : Number(cost)
    if (isNaN(costNum) || costNum < 0) {
      toast.error('Please enter a valid cost')
      return
    }

    startTransition(async () => {
      const res = await updateVehicleService({
        id: service.id,
        vehicleId: vehicle.id,
        cost: costNum,
        workshopName: workshopName.trim() || null,
        invoiceNumber: invoiceNumber.trim() || null,
        externalInvoiceUrl: externalInvoiceUrl.trim() || null,
        notes: notes.trim() || null,
      })

      if (!res.success || !res.data) {
        toast.error(res.error || 'Failed to update service record')
        return
      }

      toast.success('Service record updated successfully')
      onSuccess?.(res.data)
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
      {/* Read-only Immutable Historical Header */}
      <div className='rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2.5'>
        <div className='flex items-center justify-between'>
          <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5'>
            <LuLock className='size-3 text-muted-foreground' aria-hidden='true' />
            Immutable Log Attributes
          </span>
          <Badge variant='outline' className='text-[10px] capitalize'>
            {service.service_type}
          </Badge>
        </div>

        <div className='grid grid-cols-2 gap-2 text-xs'>
          <div className='flex items-center gap-1.5 text-muted-foreground'>
            <LuCalendar className='size-3.5 shrink-0' aria-hidden='true' />
            <span className='font-mono text-foreground'>
              {new Date(service.service_date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className='flex items-center gap-1.5 text-muted-foreground'>
            <LuGauge className='size-3.5 shrink-0' aria-hidden='true' />
            <span className='font-mono text-foreground'>
              {service.odometer.toLocaleString()} {vehicle.odometer_unit}
            </span>
          </div>
        </div>

        {service.items_serviced && service.items_serviced.length > 0 && (
          <div className='pt-1 border-t border-border/40'>
            <p className='text-[10px] text-muted-foreground mb-1'>Serviced Checklist Items:</p>
            <div className='flex flex-wrap gap-1'>
              {service.items_serviced.map((item, idx) => (
                <Badge key={idx} variant='secondary' className='text-[10px] py-0 px-1.5 font-normal'>
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editable Cost */}
      <div className='space-y-1.5'>
        <Label htmlFor={`${baseId}-cost`} className='text-xs font-medium'>
          Total Service Cost ({vehicle.currency})
        </Label>
        <InputGroup prefix={vehicle.currency}>
          <Input
            id={`${baseId}-cost`}
            type='number'
            min='0'
            step='any'
            placeholder='0'
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className='font-mono text-sm'
          />
        </InputGroup>
        {service.cashflow_entry_id && (
          <p className='text-[10px] text-muted-foreground'>
            Updating cost will automatically sync to the linked Cashflow entry.
          </p>
        )}
      </div>

      {/* Workshop & Invoice Number */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        <div className='space-y-1.5'>
          <Label htmlFor={`${baseId}-workshop`} className='text-xs font-medium'>
            Workshop / Mechanic
          </Label>
          <Input
            id={`${baseId}-workshop`}
            placeholder='e.g., Honda Authorized Shop'
            value={workshopName}
            onChange={(e) => setWorkshopName(e.target.value)}
            maxLength={100}
            className='text-xs'
          />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor={`${baseId}-invoice-no`} className='text-xs font-medium'>
            Invoice / Receipt #
          </Label>
          <Input
            id={`${baseId}-invoice-no`}
            placeholder='e.g., INV-2026-0812'
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            maxLength={100}
            className='text-xs font-mono'
          />
        </div>
      </div>

      {/* External Invoice / Cloud Drive URL */}
      <div className='space-y-1.5'>
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
          value={externalInvoiceUrl}
          onChange={(e) => setExternalInvoiceUrl(e.target.value)}
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
                href={sanitizedInvoice.viewUrl || externalInvoiceUrl}
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

      {/* Notes */}
      <div className='space-y-1.5'>
        <Label htmlFor={`${baseId}-notes`} className='text-xs font-medium'>
          Notes & Remarks
        </Label>
        <Textarea
          id={`${baseId}-notes`}
          placeholder='Add any technician notes, part brands, oil viscosity used, etc.'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          className='text-xs resize-none'
        />
      </div>

      <DialogFooter className='gap-2 pt-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type='submit' size='sm' loading={isPending}>
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  )
}

export function EditServiceModal({
  open,
  onOpenChange,
  service,
  vehicle,
  onSuccess,
}: EditServiceModalProps) {
  if (!service) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-base font-semibold'>
            <LuWrench className='size-4 text-primary' aria-hidden='true' />
            Edit Service Record
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Update workshop details, invoices, receipts, and maintenance costs.
          </DialogDescription>
        </DialogHeader>

        <EditServiceForm
          key={service.id}
          service={service}
          vehicle={vehicle}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
