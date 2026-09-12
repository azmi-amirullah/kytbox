'use client'

import { useState, useTransition, useId } from 'react'
import { toast } from 'react-toastify'
import {
  LuFileText,
  LuCheck,
  LuPlus,
  LuPencil,
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
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { VehicleDTO, VehicleDocumentDTO, VehicleDocumentType } from '@/types/dto'
import { isVehicleDocumentType } from '../types'
import { createVehicleDocument, updateVehicleDocument } from '../actions'

interface VehicleDocumentModalProps {
  vehicle: VehicleDTO
  documentToEdit: VehicleDocumentDTO | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (doc: VehicleDocumentDTO) => void
}

const DOCUMENT_TYPES: {
  type: VehicleDocumentType
  label: string
  defaultTitle: string
  description: string
}[] = [
  {
    type: 'road_tax_annual',
    label: 'Annual Road Tax',
    defaultTitle: 'Pajak Tahunan (PKB)',
    description: 'Yearly vehicle tax renewal reminder',
  },
  {
    type: 'registration_renewal',
    label: '5-Year Registration / Plate',
    defaultTitle: 'STNK & Plat 5 Tahunan',
    description: 'Vehicle registration certificate and license plate renewal',
  },
  {
    type: 'insurance',
    label: 'Insurance Policy',
    defaultTitle: 'Asuransi Kendaraan',
    description: 'Comprehensive, TLO, or third-party vehicle policy',
  },
  {
    type: 'inspection',
    label: 'Periodic Inspection',
    defaultTitle: 'Uji Berkala (KIR)',
    description: 'Commercial or safety vehicle roadworthiness inspection',
  },
  {
    type: 'other',
    label: 'Other Document',
    defaultTitle: 'Dokumen Kendaraan',
    description: 'Custom permits, warranties, or transport documents',
  },
]

export function VehicleDocumentModal({
  vehicle,
  documentToEdit,
  isOpen,
  onClose,
  onSuccess,
}: VehicleDocumentModalProps) {
  const [isPending, startTransition] = useTransition()
  const isEditing = Boolean(documentToEdit)

  // Form IDs for accessibility
  const typeId = useId()
  const titleId = useId()
  const numberId = useId()
  const expiryId = useId()
  const costId = useId()
  const notesId = useId()

  const [documentType, setDocumentType] = useState<VehicleDocumentType>(
    documentToEdit?.document_type || 'road_tax_annual'
  )
  const [title, setTitle] = useState<string>(documentToEdit?.title || 'Pajak Tahunan (PKB)')
  const [documentNumber, setDocumentNumber] = useState<string>(
    documentToEdit?.document_number || ''
  )
  const [expiryDate, setExpiryDate] = useState<string>(documentToEdit?.expiry_date || '')
  const [cost, setCost] = useState<string>(
    documentToEdit?.cost && documentToEdit.cost > 0 ? String(documentToEdit.cost) : ''
  )
  const [notes, setNotes] = useState<string>(documentToEdit?.notes || '')

  // Reset form when documentToEdit or isOpen changes (render-phase state adjustment per React guidelines)
  const [prevDocId, setPrevDocId] = useState<string | null | undefined>(documentToEdit?.id)
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen)

  if (documentToEdit?.id !== prevDocId || isOpen !== prevIsOpen) {
    setPrevDocId(documentToEdit?.id)
    setPrevIsOpen(isOpen)
    if (documentToEdit) {
      setDocumentType(documentToEdit.document_type)
      setTitle(documentToEdit.title)
      setDocumentNumber(documentToEdit.document_number || '')
      setExpiryDate(documentToEdit.expiry_date)
      setCost(documentToEdit.cost && documentToEdit.cost > 0 ? String(documentToEdit.cost) : '')
      setNotes(documentToEdit.notes || '')
    } else {
      setDocumentType('road_tax_annual')
      setTitle('Pajak Tahunan (PKB)')
      setDocumentNumber('')
      setExpiryDate('')
      setCost('')
      setNotes('')
    }
  }

  const handleTypeChange = (newType: VehicleDocumentType) => {
    setDocumentType(newType)
    // Only auto-update title if user hasn't typed a custom title
    const currentDefault = DOCUMENT_TYPES.find((d) => d.type === documentType)?.defaultTitle
    if (!title || title === currentDefault) {
      const nextDefault = DOCUMENT_TYPES.find((d) => d.type === newType)?.defaultTitle
      if (nextDefault) setTitle(nextDefault)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Document title is required')
      return
    }

    if (!expiryDate) {
      toast.error('Expiration date is required')
      return
    }

    const numericCost = cost.trim() ? Number(cost) : undefined
    if (numericCost !== undefined && (isNaN(numericCost) || numericCost < 0)) {
      toast.error('Please enter a valid document cost')
      return
    }

    startTransition(async () => {
      if (isEditing && documentToEdit) {
        const res = await updateVehicleDocument({
          id: documentToEdit.id,
          vehicleId: vehicle.id,
          documentType,
          title: title.trim(),
          documentNumber: documentNumber.trim() || undefined,
          expiryDate,
          cost: numericCost,
          notes: notes.trim() || undefined,
        })

        if (!res.success || !res.data) {
          toast.error(res.error || 'Failed to update document')
          return
        }

        toast.success(`Updated ${res.data.title}`)
        onSuccess(res.data)
        onClose()
      } else {
        const res = await createVehicleDocument({
          vehicleId: vehicle.id,
          documentType,
          title: title.trim(),
          documentNumber: documentNumber.trim() || undefined,
          expiryDate,
          cost: numericCost,
          notes: notes.trim() || undefined,
        })

        if (!res.success || !res.data) {
          toast.error(res.error || 'Failed to track document')
          return
        }

        toast.success(`Document ${res.data.title} added!`)
        onSuccess(res.data)
        onClose()
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-md max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center gap-2 text-primary mb-1'>
            {isEditing ? (
              <LuPencil className='size-5' aria-hidden='true' />
            ) : (
              <LuFileText className='size-5' aria-hidden='true' />
            )}
            <span className='text-xs font-semibold uppercase tracking-wider'>
              {isEditing ? 'Edit Document' : 'Track New Document'}
            </span>
          </div>
          <DialogTitle className='text-lg font-bold'>
            {isEditing ? `Edit ${documentToEdit?.title}` : 'Add Vehicle Document'}
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Never miss a tax deadline, STNK renewal, or insurance policy expiration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          {/* Document Type Selector */}
          <div className='space-y-1.5'>
            <Label htmlFor={typeId} className='text-xs font-medium'>
              Document Type
            </Label>
            <Select
              value={documentType}
              onValueChange={(val) => {
                if (isVehicleDocumentType(val)) {
                  handleTypeChange(val)
                }
              }}
            >
              <SelectTrigger id={typeId} className='min-h-11 text-xs'>
                <SelectValue placeholder='Select document type' />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((dt) => (
                  <SelectItem key={dt.type} value={dt.type} className='text-xs'>
                    <span className='font-medium'>{dt.label}</span>
                    <span className='text-muted-foreground text-[0.7rem] ml-1.5'>
                      — {dt.description}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className='space-y-1.5'>
            <Label htmlFor={titleId} className='text-xs font-medium'>
              Document Name / Title <span className='text-destructive'>*</span>
            </Label>
            <Input
              id={titleId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. Pajak Tahunan (PKB)'
              className='min-h-10 text-xs'
              required
            />
          </div>

          {/* Document Number */}
          <div className='space-y-1.5'>
            <Label htmlFor={numberId} className='text-xs font-medium flex items-center justify-between'>
              <span>Document / Policy Number</span>
              <span className='text-[0.68rem] text-muted-foreground'>Optional</span>
            </Label>
            <Input
              id={numberId}
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder='e.g. 08291038 / POL-2026-X8'
              className='min-h-10 text-xs font-mono'
            />
          </div>

          {/* Expiration Date */}
          <div className='space-y-1.5'>
            <Label htmlFor={expiryId} className='text-xs font-medium'>
              Expiration Date <span className='text-destructive'>*</span>
            </Label>
            <DatePicker
              id={expiryId}
              value={expiryDate}
              onChange={setExpiryDate}
              className='min-h-10 text-xs'
              placeholder='Select expiration date'
            />
          </div>

          {/* Cost */}
          <div className='space-y-1.5'>
            <Label htmlFor={costId} className='text-xs font-medium flex items-center justify-between'>
              <span>Typical Tax / Renewal Cost</span>
              <span className='text-[0.68rem] text-muted-foreground'>Optional</span>
            </Label>
            <InputGroup prefix={vehicle.currency}>
              <Input
                id={costId}
                type='number'
                min='0'
                step='any'
                placeholder='e.g. 3500000'
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className='min-h-10 text-xs font-mono'
              />
            </InputGroup>
          </div>

          {/* Notes */}
          <div className='space-y-1.5'>
            <Label htmlFor={notesId} className='text-xs font-medium flex items-center justify-between'>
              <span>Notes & Details</span>
              <span className='text-[0.68rem] text-muted-foreground'>Optional</span>
            </Label>
            <Textarea
              id={notesId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Add Samsat location, agent contact, or deductible notes...'
              rows={2}
              className='text-xs resize-none'
            />
          </div>

          <DialogFooter className='gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isPending}
              className='min-h-11'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isPending}
              className='min-h-11 gap-1.5 font-medium'
            >
              {isPending ? (
                'Saving...'
              ) : isEditing ? (
                <>
                  <LuCheck className='size-4' aria-hidden='true' />
                  Save Changes
                </>
              ) : (
                <>
                  <LuPlus className='size-4' aria-hidden='true' />
                  Track Document
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
