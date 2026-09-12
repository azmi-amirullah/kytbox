'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import {
  LuFileText,
  LuCalendar,
  LuShield,
  LuShieldAlert,
  LuShieldCheck,
  LuTriangleAlert,
  LuRefreshCw,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuCreditCard,
  LuFileCheck,
  LuCircleCheck,
} from 'react-icons/lu'
import { Button } from '@/components/ui/button'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import type {
  VehicleDTO,
  VehicleDocumentDTO,
  VehicleDocumentType,
} from '@/types/dto'
import { deleteVehicleDocument } from '../actions'
import { calculateDocumentExpiry } from '../lib/document-math'
import { VehicleDocumentModal } from './VehicleDocumentModal'
import { DocumentRenewalModal } from './DocumentRenewalModal'
import { DriverLicenseModal } from './DriverLicenseModal'

interface VehicleDocumentsManagerProps {
  vehicle: VehicleDTO
  initialDocuments?: VehicleDocumentDTO[]
  cashflowBooks?: { id: string; title: string; currency: string }[]
  targetDocId?: string | null
}

const TYPE_METADATA: Record<
  VehicleDocumentType,
  { label: string; icon: React.ElementType; badgeColor: string }
> = {
  road_tax_annual: {
    label: 'Annual Road Tax',
    icon: LuCalendar,
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  registration_renewal: {
    label: '5-Year Registration / Plate',
    icon: LuFileCheck,
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  insurance: {
    label: 'Insurance Policy',
    icon: LuShield,
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  inspection: {
    label: 'Inspection / KIR',
    icon: LuCircleCheck,
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  other: {
    label: 'Other Document',
    icon: LuFileText,
    badgeColor: 'bg-muted text-muted-foreground border-border',
  },
}

const EMPTY_DOCS: VehicleDocumentDTO[] = []
const EMPTY_BOOKS: { id: string; title: string; currency: string }[] = []

export function VehicleDocumentsManager({
  vehicle,
  initialDocuments = EMPTY_DOCS,
  cashflowBooks = EMPTY_BOOKS,
  targetDocId,
}: VehicleDocumentsManagerProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState<VehicleDocumentDTO[]>(initialDocuments)
  const [isPending, startTransition] = useTransition()

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false)
  const [editingDoc, setEditingDoc] = useState<VehicleDocumentDTO | null>(null)
  const [renewingDoc, setRenewingDoc] = useState<VehicleDocumentDTO | null>(null)
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState<boolean>(false)
  const [deletingDoc, setDeletingDoc] = useState<VehicleDocumentDTO | null>(null)
  const [deleteCashflowEntry, setDeleteCashflowEntry] = useState<boolean>(true)

  // Target document deep-link auto-open or highlight
  const [openedTargetDocId, setOpenedTargetDocId] = useState<string | null>(null)

  if (targetDocId && targetDocId !== openedTargetDocId) {
    setOpenedTargetDocId(targetDocId)
    const matchingDoc = documents.find((d) => d.id === targetDocId)
    if (matchingDoc) {
      setRenewingDoc(matchingDoc)
    }
  }

  const cleanupDocumentUrlParams = () => {
    if (typeof window !== 'undefined' && window.location.search) {
      const url = new URL(window.location.href)
      let changed = false
      if (url.searchParams.has('doc')) {
        url.searchParams.delete('doc')
        changed = true
      }
      if (url.searchParams.has('alert')) {
        url.searchParams.delete('alert')
        changed = true
      }
      if (changed) {
        window.history.replaceState(
          {},
          '',
          `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''}`
        )
      }
    }
  }

  // Metrics
  const sortedDocs = [...documents].sort((a, b) => a.expiry_date.localeCompare(b.expiry_date))
  const nextExpiringDoc = sortedDocs[0]
  const nextExpiry = nextExpiringDoc ? calculateDocumentExpiry(nextExpiringDoc.expiry_date) : null

  const totalAnnualCost = documents.reduce((sum, doc) => {
    // Include road tax and insurance
    if (doc.cost && doc.cost > 0) {
      if (doc.document_type === 'registration_renewal') {
        // Amortize 5-year plate
        return sum + Math.round(doc.cost / 5)
      }
      return sum + doc.cost
    }
    return sum
  }, 0)

  const handleDeleteConfirm = () => {
    if (!deletingDoc) return

    startTransition(async () => {
      const res = await deleteVehicleDocument({
        id: deletingDoc.id,
        vehicleId: vehicle.id,
        deleteCashflowEntry: Boolean(deletingDoc.cashflow_entry_id && deleteCashflowEntry),
      })

      if (!res.success) {
        toast.error(res.error || 'Failed to delete document')
        return
      }

      toast.success(`Removed ${deletingDoc.title}`)
      setDocuments((prev) => prev.filter((d) => d.id !== deletingDoc.id))
      setDeletingDoc(null)
      router.refresh()
    })
  }

  return (
    <div className='space-y-6'>
      {/* Top Action Toolbar */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-xs text-muted-foreground'>
          Track annual road tax (PKB), 5-year registration (STNK & Plat), and insurance policies with expiry alerts.
        </p>

        <div className='flex items-center gap-2 shrink-0 self-end sm:self-auto'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsLicenseModalOpen(true)}
            className='text-xs gap-1.5 font-medium'
          >
            <LuCreditCard className='size-3.5 text-primary' aria-hidden='true' />
            Driver&apos;s Licenses (SIM)
          </Button>

          {!vehicle.is_archived && (
            <Button
              size='sm'
              onClick={() => {
                setEditingDoc(null)
                setIsAddModalOpen(true)
              }}
              className='text-xs gap-1.5 font-medium shadow-xs'
            >
              <LuPlus className='size-3.5' aria-hidden='true' />
              Add Document
            </Button>
          )}
        </div>
      </div>

      {/* Overview Bento Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4'>
        {/* Total Documents */}
        <div className='rounded-xl border border-border/80 bg-card p-4'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-medium flex items-center gap-1.5'>
              <LuFileText className='size-3.5 text-primary' aria-hidden='true' />
              Tracked Documents
            </span>
          </div>
          <div className='mt-2 text-2xl font-bold tracking-tight text-foreground font-mono'>
            {documents.length}
          </div>
          <p className='mt-1 text-[0.72rem] text-muted-foreground'>
            Taxes, registrations & warranties
          </p>
        </div>

        {/* Next Expiry */}
        <div className='rounded-xl border border-border/80 bg-card p-4'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-medium flex items-center gap-1.5'>
              <LuCalendar className='size-3.5 text-primary' aria-hidden='true' />
              Next Deadline
            </span>
            {nextExpiry && (
              <Badge
                variant='outline'
                className={`text-[0.65rem] font-semibold px-1.5 py-0.5 ${
                  nextExpiry.status === 'expired'
                    ? 'border-destructive/30 bg-destructive/10 text-destructive'
                    : nextExpiry.status === 'expiring_soon'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {nextExpiry.status === 'expired'
                  ? 'Expired'
                  : nextExpiry.status === 'expiring_soon'
                    ? 'Due Soon'
                    : 'Valid'}
              </Badge>
            )}
          </div>
          <div className='mt-2 text-base font-bold text-foreground truncate'>
            {nextExpiringDoc ? nextExpiringDoc.title : 'None tracked'}
          </div>
          <p className='mt-1 text-[0.72rem] text-muted-foreground font-mono'>
            {nextExpiringDoc
              ? `${nextExpiringDoc.expiry_date} (${nextExpiry?.daysRemaining}d left)`
              : 'Add your vehicle tax to track deadlines'}
          </p>
        </div>

        {/* Estimated Annual Fixed Cost */}
        <div className='col-span-2 sm:col-span-1 rounded-xl border border-border/80 bg-card p-4'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-medium'>Estimated Annual Taxes</span>
          </div>
          <div className='mt-2 text-xl font-bold tracking-tight text-foreground font-mono'>
            {vehicle.currency} {totalAnnualCost.toLocaleString()}
          </div>
          <p className='mt-1 text-[0.72rem] text-muted-foreground'>
            Annualized road tax + insurance
          </p>
        </div>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className='rounded-xl border border-dashed border-border/80 p-8 text-center bg-card/40'>
          <LuFileText className='mx-auto size-10 text-muted-foreground/60' aria-hidden='true' />
          <h4 className='mt-3 text-sm font-semibold text-foreground'>
            No Documents Tracked for {vehicle.name}
          </h4>
          <p className='mt-1 max-w-md mx-auto text-xs text-muted-foreground leading-relaxed'>
            Keep your vehicle road-legal! Track your annual vehicle tax (Pajak Tahunan / PKB), 5-year license plate renewal (Ganti Kaleng), and insurance policies to receive alerts 30 days before deadlines.
          </p>

          {!vehicle.is_archived && (
            <div className='mt-5 flex flex-wrap items-center justify-center gap-2'>
              <Button
                size='sm'
                onClick={() => {
                  setEditingDoc(null)
                  setIsAddModalOpen(true)
                }}
                className='h-9 text-xs gap-1.5 font-medium'
              >
                <LuPlus className='size-3.5' aria-hidden='true' />
                Track Annual Tax (PKB)
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {sortedDocs.map((doc) => {
            const typeMeta = TYPE_METADATA[doc.document_type] || TYPE_METADATA.other
            const TypeIcon = typeMeta.icon
            const expiry = calculateDocumentExpiry(doc.expiry_date)
            const isTarget = doc.id === targetDocId

            return (
              <div
                key={doc.id}
                className={`rounded-xl border bg-card p-5 transition-all flex flex-col justify-between gap-4 ${
                  isTarget
                    ? 'border-primary ring-2 ring-primary/60 shadow-md'
                    : expiry.status === 'expired'
                      ? 'border-destructive/60 ring-1 ring-destructive/20 shadow-xs'
                      : expiry.status === 'expiring_soon'
                        ? 'border-amber-500/50 shadow-xs'
                        : 'border-border/80 hover:border-border'
                }`}
              >
                {/* Card Header: Type Badge & Expiry Badge */}
                <div className='space-y-2.5'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <Badge
                        variant='outline'
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[0.68rem] font-semibold ${typeMeta.badgeColor}`}
                      >
                        <TypeIcon className='size-3 shrink-0' aria-hidden='true' />
                        {typeMeta.label}
                      </Badge>
                      {isTarget && (
                        <Badge
                          variant='outline'
                          className='inline-flex items-center border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary'
                        >
                          Target Alert
                        </Badge>
                      )}
                    </div>

                    {/* Expiration Status Pill */}
                    {expiry.status === 'expired' && (
                      <Badge
                        variant='outline'
                        className='inline-flex items-center gap-1 border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-[0.68rem] font-semibold text-destructive shrink-0'
                      >
                        <LuShieldAlert className='size-3' />
                        Expired ({Math.abs(expiry.daysRemaining)}d ago)
                      </Badge>
                    )}
                    {expiry.status === 'expiring_soon' && (
                      <Badge
                        variant='outline'
                        className='inline-flex items-center gap-1 border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[0.68rem] font-semibold text-amber-600 dark:text-amber-400 shrink-0'
                      >
                        <LuTriangleAlert className='size-3' />
                        {expiry.daysRemaining} days left
                      </Badge>
                    )}
                    {expiry.status === 'valid' && (
                      <Badge
                        variant='outline'
                        className='inline-flex items-center gap-1 border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[0.68rem] font-medium text-emerald-600 dark:text-emerald-400 shrink-0'
                      >
                        <LuShieldCheck className='size-3' />
                        Valid
                      </Badge>
                    )}
                  </div>

                  {/* Title & Document Number */}
                  <div>
                    <h4 className='text-sm font-bold text-foreground'>{doc.title}</h4>
                    {doc.document_number ? (
                      <p className='font-mono text-xs text-muted-foreground mt-0.5'>
                        No: {doc.document_number}
                      </p>
                    ) : (
                      <p className='text-xs text-muted-foreground/60 italic mt-0.5'>
                        No document number recorded
                      </p>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className='rounded-lg border border-border/60 bg-muted/30 p-3 text-xs space-y-1.5'>
                  <div className='flex justify-between items-center'>
                    <span className='text-muted-foreground flex items-center gap-1'>
                      <LuCalendar className='size-3' />
                      Expires:
                    </span>
                    <span className='font-mono font-semibold text-foreground'>
                      {doc.expiry_date}
                    </span>
                  </div>

                  {doc.cost && doc.cost > 0 ? (
                    <div className='flex justify-between items-center'>
                      <span className='text-muted-foreground'>Last Renewal Cost:</span>
                      <span className='font-mono font-medium text-foreground'>
                        {vehicle.currency} {doc.cost.toLocaleString()}
                      </span>
                    </div>
                  ) : null}

                  {doc.notes && (
                    <div className='pt-1 border-t border-border/40 text-[0.72rem] text-muted-foreground italic line-clamp-2'>
                      {doc.notes}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!vehicle.is_archived && (
                  <div className='flex items-center justify-between pt-1 border-t border-border/60'>
                    <Button
                      size='sm'
                      onClick={() => setRenewingDoc(doc)}
                      className='h-8 text-xs gap-1.5 font-medium shadow-xs min-h-11 sm:min-h-8'
                    >
                      <LuRefreshCw className='size-3.5' aria-hidden='true' />
                      1-Tap Renew
                    </Button>

                    <div className='flex items-center gap-1'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setEditingDoc(doc)
                          setIsAddModalOpen(true)
                        }}
                        className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
                        title='Edit Document'
                      >
                        <LuPencil className='size-3.5' aria-hidden='true' />
                        <span className='sr-only'>Edit</span>
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setDeletingDoc(doc)}
                        className='h-8 w-8 p-0 text-muted-foreground hover:text-destructive'
                        title='Delete Document'
                      >
                        <LuTrash2 className='size-3.5' aria-hidden='true' />
                        <span className='sr-only'>Delete</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Document Modal */}
      <VehicleDocumentModal
        vehicle={vehicle}
        documentToEdit={editingDoc}
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingDoc(null)
        }}
        onSuccess={(updated) => {
          setDocuments((prev) => {
            const index = prev.findIndex((d) => d.id === updated.id)
            if (index >= 0) {
              const clone = [...prev]
              clone[index] = updated
              return clone
            }
            return [...prev, updated]
          })
          router.refresh()
        }}
      />

      {/* 1-Tap Document Renewal Modal */}
      <DocumentRenewalModal
        vehicle={vehicle}
        document={renewingDoc}
        isOpen={Boolean(renewingDoc)}
        onClose={() => {
          setRenewingDoc(null)
          cleanupDocumentUrlParams()
        }}
        cashflowBooks={cashflowBooks}
        onSuccess={(updated) => {
          setDocuments((prev) =>
            prev.map((d) => (d.id === updated.id ? updated : d))
          )
          cleanupDocumentUrlParams()
          router.refresh()
        }}
      />

      {/* Driver's License Modal */}
      <DriverLicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => {
          setIsLicenseModalOpen(false)
          cleanupDocumentUrlParams()
        }}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(deletingDoc)}
        onOpenChange={(open) => !open && !isPending && setDeletingDoc(null)}
      >
        <AlertDialogContent className='sm:max-w-sm'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-base font-bold text-destructive flex items-center gap-2'>
              <LuTrash2 className='size-4' />
              Delete Document Record
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs text-muted-foreground'>
              Are you sure you want to remove <strong>{deletingDoc?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
            {deletingDoc?.cashflow_entry_id && (
              <div className='mt-3 flex items-start gap-2.5 rounded-lg border border-border/80 bg-muted/40 p-2.5 text-left'>
                <Checkbox
                  id='delete-doc-cf'
                  checked={deleteCashflowEntry}
                  onCheckedChange={(checked) => setDeleteCashflowEntry(Boolean(checked))}
                  className='mt-0.5'
                />
                <label htmlFor='delete-doc-cf' className='text-xs text-foreground cursor-pointer'>
                  Also remove linked expense from Cashflow ledger
                </label>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className='gap-2 pt-2'>
            <AlertDialogCancel
              onClick={() => setDeletingDoc(null)}
              disabled={isPending}
              className='min-h-11 sm:min-h-9 text-xs'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type='button'
                variant='destructive'
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className='min-h-11 sm:min-h-9 text-xs'
              >
                {isPending ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
