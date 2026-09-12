'use client'

import { useState, useTransition, useId, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import {
  LuCreditCard,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuCheck,
  LuCalendar,
  LuTriangleAlert,
  LuShieldAlert,
  LuShieldCheck,
  LuArrowLeft,
} from 'react-icons/lu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DriverLicenseDTO, DriverLicenseCategory } from '@/types/dto'
import { isDriverLicenseCategory } from '../types'
import {
  getDriverLicenses,
  createDriverLicense,
  updateDriverLicense,
  deleteDriverLicense,
} from '../actions'
import { calculateDocumentExpiry } from '../lib/document-math'

interface DriverLicenseModalProps {
  isOpen: boolean
  onClose: () => void
  initialLicenses?: DriverLicenseDTO[]
  onLicensesChange?: (licenses: DriverLicenseDTO[]) => void
}

const CATEGORY_CONFIG: Record<
  DriverLicenseCategory,
  { label: string; defaultTitle: string; desc: string }
> = {
  car: {
    label: 'SIM A (Car)',
    defaultTitle: 'SIM A (Mobil Pribadi)',
    desc: 'Passenger car & light vehicle license',
  },
  motorcycle: {
    label: 'SIM C (Motorcycle)',
    defaultTitle: 'SIM C (Sepeda Motor)',
    desc: 'Motorcycle & scooter rider license',
  },
  commercial: {
    label: 'SIM B (Commercial)',
    defaultTitle: 'SIM B (Komersial / Truk)',
    desc: 'Heavy cargo & commercial passenger transport',
  },
  other: {
    label: 'Other / International',
    defaultTitle: "Driver's License (SIM)",
    desc: 'International, SIM D, or regional driving permit',
  },
}

const EMPTY_LICENSES: DriverLicenseDTO[] = []

export function DriverLicenseModal({
  isOpen,
  onClose,
  initialLicenses = EMPTY_LICENSES,
  onLicensesChange,
}: DriverLicenseModalProps) {
  const [licenses, setLicenses] = useState<DriverLicenseDTO[]>(initialLicenses)
  const [isLoading, setIsLoading] = useState<boolean>(() => initialLicenses.length === 0)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [editingLicense, setEditingLicense] = useState<DriverLicenseDTO | null>(null)
  const [deletingLicense, setDeletingLicense] = useState<DriverLicenseDTO | null>(null)
  const [isPending, startTransition] = useTransition()

  const onLicensesChangeRef = useRef(onLicensesChange)
  useEffect(() => {
    onLicensesChangeRef.current = onLicensesChange
  }, [onLicensesChange])

  // Sync initialLicenses if prop changes
  const [prevInitialLicenses, setPrevInitialLicenses] = useState<DriverLicenseDTO[]>(initialLicenses)
  if (initialLicenses !== prevInitialLicenses) {
    setPrevInitialLicenses(initialLicenses)
    if (initialLicenses.length > 0 || prevInitialLicenses.length > 0) {
      setLicenses(initialLicenses)
      if (initialLicenses.length > 0) {
        setIsLoading(false)
      }
    }
  }

  // Form IDs
  const catId = useId()
  const titleId = useId()
  const numId = useId()
  const expId = useId()
  const notesId = useId()

  // Form state
  const [category, setCategory] = useState<DriverLicenseCategory>('car')
  const [title, setTitle] = useState<string>('SIM A (Mobil Pribadi)')
  const [licenseNumber, setLicenseNumber] = useState<string>('')
  const [expiryDate, setExpiryDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // Reset form when modal opens (render-phase adjustment per React guidelines)
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      if (licenses.length === 0) {
        setIsLoading(true)
      }
      setIsFormOpen(false)
      setEditingLicense(null)
    }
  }

  useEffect(() => {
    if (!isOpen) return

    let isSubscribed = true
    void getDriverLicenses().then((res) => {
      if (isSubscribed) {
        if (res.success) {
          setLicenses(res.data)
          onLicensesChangeRef.current?.(res.data)
        }
        setIsLoading(false)
      }
    })

    return () => {
      isSubscribed = false
    }
  }, [isOpen])

  const openAddForm = () => {
    setEditingLicense(null)
    setCategory('car')
    setTitle('SIM A (Mobil Pribadi)')
    setLicenseNumber('')
    setExpiryDate('')
    setNotes('')
    setIsFormOpen(true)
  }

  const openEditForm = (lic: DriverLicenseDTO) => {
    setEditingLicense(lic)
    setCategory(lic.category)
    setTitle(lic.license_name)
    setLicenseNumber(lic.license_number || '')
    setExpiryDate(lic.expiry_date)
    setNotes(lic.notes || '')
    setIsFormOpen(true)
  }

  const handleCategoryChange = (newCat: DriverLicenseCategory) => {
    setCategory(newCat)
    const currentDefault = CATEGORY_CONFIG[category]?.defaultTitle
    if (!title || title === currentDefault) {
      setTitle(CATEGORY_CONFIG[newCat]?.defaultTitle || "Driver's License")
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('License name is required')
      return
    }

    if (!expiryDate) {
      toast.error('Expiration date is required')
      return
    }

    startTransition(async () => {
      if (editingLicense) {
        const res = await updateDriverLicense({
          id: editingLicense.id,
          category,
          licenseName: title.trim(),
          licenseNumber: licenseNumber.trim() || undefined,
          expiryDate,
          notes: notes.trim() || undefined,
        })

        if (!res.success || !res.data) {
          toast.error(res.error || 'Failed to update license')
          return
        }

        toast.success(`Updated ${res.data.license_name}`)
        const updated = res.data
        const next = licenses.map((l) => (l.id === updated.id ? updated : l))
        setLicenses(next)
        onLicensesChangeRef.current?.(next)
        setIsFormOpen(false)
      } else {
        const res = await createDriverLicense({
          category,
          licenseName: title.trim(),
          licenseNumber: licenseNumber.trim() || undefined,
          expiryDate,
          notes: notes.trim() || undefined,
        })

        if (!res.success || !res.data) {
          toast.error(res.error || 'Failed to add license')
          return
        }

        toast.success(`Added ${res.data.license_name}`)
        const next = [...licenses, res.data]
        setLicenses(next)
        onLicensesChangeRef.current?.(next)
        setIsFormOpen(false)
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!deletingLicense) return

    startTransition(async () => {
      const res = await deleteDriverLicense({ id: deletingLicense.id })
      if (!res.success) {
        toast.error(res.error || 'Failed to delete license')
        return
      }
      toast.success(`Deleted ${deletingLicense.license_name}`)
      const next = licenses.filter((l) => l.id !== deletingLicense.id)
      setLicenses(next)
      onLicensesChangeRef.current?.(next)
      setDeletingLicense(null)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
        {isFormOpen ? (
          /* Add / Edit Form */
          <>
            <DialogHeader>
              <button
                type='button'
                onClick={() => setIsFormOpen(false)}
                className='group -ml-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs'
              >
                <LuArrowLeft className='size-3.5 transition-transform group-hover:-translate-x-0.5' aria-hidden='true' />
                <span>Back to all licenses</span>
              </button>
              <DialogTitle className='text-lg font-bold'>
                {editingLicense ? `Edit ${editingLicense.license_name}` : "Add Driver's License"}
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                {editingLicense
                  ? 'Update license information and renewal expiration date.'
                  : 'Enter license details to enable automated 30-day expiration alerts.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className='space-y-4 py-2'>
              <div className='space-y-1.5'>
                <Label htmlFor={catId} className='text-xs font-medium'>
                  License Category
                </Label>
                <Select
                  value={category}
                  onValueChange={(val) => {
                    if (isDriverLicenseCategory(val)) {
                      handleCategoryChange(val)
                    }
                  }}
                >
                  <SelectTrigger id={catId} className='min-h-11 text-xs'>
                    <SelectValue placeholder='Select license category' />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key} className='text-xs'>
                        <span className='font-medium'>{cfg.label}</span>
                        <span className='text-muted-foreground text-[0.7rem] ml-1.5'>
                          — {cfg.desc}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor={titleId} className='text-xs font-medium'>
                  Title / Label <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id={titleId}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='e.g. SIM A (Mobil Pribadi)'
                  className='min-h-11 text-xs'
                  required
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor={numId} className='text-xs font-medium flex items-center justify-between'>
                  <span>License Number (Nomor SIM)</span>
                  <span className='text-[0.68rem] text-muted-foreground'>Optional</span>
                </Label>
                <Input
                  id={numId}
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder='e.g. 941012384910'
                  className='min-h-11 text-xs font-mono'
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor={expId} className='text-xs font-medium'>
                  Expiration Date <span className='text-destructive'>*</span>
                </Label>
                <DatePicker
                  id={expId}
                  value={expiryDate}
                  onChange={setExpiryDate}
                  className='min-h-11 text-xs'
                  placeholder='Select expiration date'
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor={notesId} className='text-xs font-medium flex items-center justify-between'>
                  <span>Notes</span>
                  <span className='text-[0.68rem] text-muted-foreground'>Optional</span>
                </Label>
                <Input
                  id={notesId}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='e.g. Satpas Jakarta Selatan, Golongan Darah O'
                  className='min-h-11 text-xs'
                />
              </div>

              <DialogFooter className='gap-2 pt-3'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsFormOpen(false)}
                  disabled={isPending}
                  className='min-h-11'
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isPending} className='min-h-11 gap-1.5 font-medium'>
                  {isPending ? (
                    'Saving...'
                  ) : (
                    <>
                      <LuCheck className='size-4' aria-hidden='true' />
                      {editingLicense ? 'Save Changes' : 'Save License'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          /* Licenses List */
          <>
            <DialogHeader>
              <div className='flex items-center gap-2 text-primary'>
                <LuCreditCard className='size-5' aria-hidden='true' />
                <span className='text-xs font-semibold uppercase tracking-wider'>
                  Driver Identification
                </span>
              </div>
              <DialogTitle className='text-lg font-bold'>Driver&apos;s Licenses (SIM)</DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                Track your driver license expirations (SIM A, SIM C, International) independently of your vehicles.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-3 py-2'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-medium text-muted-foreground'>
                  {licenses.length} License{licenses.length === 1 ? '' : 's'} Tracked
                </span>
                <Button
                  size='sm'
                  onClick={openAddForm}
                  className='h-8 text-xs gap-1.5 font-medium shadow-xs'
                >
                  <LuPlus className='size-3.5' aria-hidden='true' />
                  Add License
                </Button>
              </div>

              {isLoading ? (
                <div className='rounded-lg border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground'>
                  Loading driver licenses...
                </div>
              ) : licenses.length === 0 ? (
                <div className='rounded-lg border border-dashed border-border/80 p-8 text-center'>
                  <LuCreditCard className='mx-auto size-8 text-muted-foreground/60' aria-hidden='true' />
                  <h4 className='mt-3 text-xs font-semibold text-foreground'>
                    No Driver&apos;s Licenses Added Yet
                  </h4>
                  <p className='mt-1 text-[0.72rem] text-muted-foreground max-w-xs mx-auto'>
                    Add your SIM A or SIM C so you get alerted 30 days before expiration to renew on time.
                  </p>
                  <Button
                    size='sm'
                    onClick={openAddForm}
                    className='mt-4 h-8 text-xs gap-1 font-medium'
                  >
                    <LuPlus className='size-3.5' aria-hidden='true' />
                    Add First License
                  </Button>
                </div>
              ) : (
                <div className='divide-y divide-border/60 rounded-lg border border-border/80 bg-card overflow-hidden'>
                  {licenses.map((lic) => {
                    const expiry = calculateDocumentExpiry(lic.expiry_date)
                    return (
                      <div
                        key={lic.id}
                        className='p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors'
                      >
                        <div className='space-y-1.5 min-w-0'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <Badge
                              variant='secondary'
                              className='text-[0.68rem] font-bold uppercase font-mono px-2 py-0.5'
                            >
                              {lic.category.toUpperCase()}
                            </Badge>
                            <span className='text-xs font-semibold text-foreground truncate'>
                              {lic.license_name}
                            </span>
                            {expiry.status === 'expired' && (
                              <Badge
                                variant='destructive'
                                className='gap-1 text-[0.68rem] px-2 py-0.5 font-semibold'
                              >
                                <LuShieldAlert className='size-3' />
                                Expired ({Math.abs(expiry.daysRemaining)}d ago)
                              </Badge>
                            )}
                            {expiry.status === 'expiring_soon' && (
                              <Badge
                                variant='outline'
                                className='gap-1 text-[0.68rem] px-2 py-0.5 font-semibold border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              >
                                <LuTriangleAlert className='size-3' />
                                {expiry.daysRemaining} days left
                              </Badge>
                            )}
                            {expiry.status === 'valid' && (
                              <Badge
                                variant='outline'
                                className='gap-1 text-[0.68rem] px-2 py-0.5 font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              >
                                <LuShieldCheck className='size-3' />
                                Valid
                              </Badge>
                            )}
                          </div>

                          <div className='flex items-center gap-3 text-[0.72rem] text-muted-foreground flex-wrap'>
                            {lic.license_number && (
                              <span className='font-mono'>No: {lic.license_number}</span>
                            )}
                            <span className='flex items-center gap-1'>
                              <LuCalendar className='size-3 text-muted-foreground' />
                              Expires:{' '}
                              <span className='font-mono font-medium text-foreground'>
                                {lic.expiry_date}
                              </span>
                            </span>
                            {lic.notes && <span className='italic truncate max-w-xs'>{lic.notes}</span>}
                          </div>
                        </div>

                        <div className='flex items-center gap-1 self-end sm:self-center shrink-0'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => openEditForm(lic)}
                            className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
                            title='Edit License'
                          >
                            <LuPencil className='size-3.5' aria-hidden='true' />
                            <span className='sr-only'>Edit</span>
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setDeletingLicense(lic)}
                            className='h-8 w-8 p-0 text-muted-foreground hover:text-destructive'
                            title='Delete License'
                          >
                            <LuTrash2 className='size-3.5' aria-hidden='true' />
                            <span className='sr-only'>Delete</span>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <DialogFooter className='pt-2 sm:justify-end'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                className='min-h-11 w-full sm:w-auto'
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(deletingLicense)}
        onOpenChange={(open) => !open && !isPending && setDeletingLicense(null)}
      >
        <AlertDialogContent className='sm:max-w-sm'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-base font-bold text-destructive flex items-center gap-2'>
              <LuTrash2 className='size-4' />
              Delete Driver&apos;s License
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs text-muted-foreground'>
              Are you sure you want to remove <strong>{deletingLicense?.license_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='gap-2 pt-2'>
            <AlertDialogCancel disabled={isPending} className='min-h-11'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant='destructive'
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className='min-h-11'
              >
                {isPending ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
