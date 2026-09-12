'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-toastify'
import {
  LuPlus,
  LuCar,
  LuSearch,
  LuShieldCheck,
  LuShieldAlert,
  LuTriangleAlert,
  LuArchive,
  LuStar,
  LuCreditCard,
} from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import type { VehicleDTO, DriverLicenseDTO } from '@/types/dto'
import { calculateDocumentExpiry } from '../lib/document-math'
import { VehicleCard } from './VehicleCard'
import { AddVehicleModal } from './AddVehicleModal'
import { EditVehicleModal } from './EditVehicleModal'
import { DriverLicenseModal } from './DriverLicenseModal'
import { QuickFuelFab } from './QuickFuelFab'
import { setDefaultVehicle, toggleArchiveVehicle, deleteVehicle } from '../actions'

interface GarageDashboardProps {
  vehicles: VehicleDTO[]
  cashflowBooks?: { id: string; title: string; currency: string }[]
  driverLicenses?: DriverLicenseDTO[]
}

const EMPTY_BOOKS: { id: string; title: string; currency: string }[] = []
const EMPTY_LICENSES: DriverLicenseDTO[] = []

export function GarageDashboard({
  vehicles,
  cashflowBooks = EMPTY_BOOKS,
  driverLicenses = EMPTY_LICENSES,
}: GarageDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [licenses, setLicenses] = useState<DriverLicenseDTO[]>(driverLicenses)
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<VehicleDTO | null>(null)
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(
    () => searchParams.get('tab') === 'licenses'
  )
  const [prevTab, setPrevTab] = useState(() => searchParams.get('tab'))
  const currentTab = searchParams.get('tab')

  // Sync licenses if prop changes from SSR
  const [prevDriverLicenses, setPrevDriverLicenses] = useState<DriverLicenseDTO[]>(driverLicenses)
  if (driverLicenses !== prevDriverLicenses) {
    setPrevDriverLicenses(driverLicenses)
    if (driverLicenses.length > 0 || prevDriverLicenses.length > 0) {
      setLicenses(driverLicenses)
    }
  }

  if (currentTab !== prevTab) {
    setPrevTab(currentTab)
    if (currentTab === 'licenses') {
      setIsLicenseModalOpen(true)
    }
  }

  // Derived license expiration status
  const licenseStats = useMemo(() => {
    if (licenses.length === 0) {
      return {
        status: 'empty' as const,
        title: 'No SIM Logged',
        subtitle: 'Tap to track driver licenses',
        color: 'text-muted-foreground',
        badge: 'Not Set',
        badgeColor: 'text-muted-foreground',
      }
    }

    const sorted = [...licenses].sort((a, b) => a.expiry_date.localeCompare(b.expiry_date))
    const mostUrgent = sorted[0]
    const expiry = calculateDocumentExpiry(mostUrgent.expiry_date)

    if (expiry.status === 'expired') {
      return {
        status: 'expired' as const,
        title: mostUrgent.license_name,
        subtitle: `Expired ${expiry.formattedDays} — Renew immediately!`,
        color: 'text-destructive',
        badge: 'Expired',
        badgeColor: 'text-destructive',
      }
    }

    if (expiry.status === 'expiring_soon') {
      return {
        status: 'expiring_soon' as const,
        title: mostUrgent.license_name,
        subtitle: `Expires in ${expiry.formattedDays} (${mostUrgent.expiry_date})`,
        color: 'text-amber-600 dark:text-amber-400',
        badge: 'Expiring Soon',
        badgeColor: 'text-amber-600 dark:text-amber-400',
      }
    }

    return {
      status: 'valid' as const,
      title: `${licenses.length} License${licenses.length === 1 ? '' : 's'} Active`,
      subtitle: `Next renewal in ${expiry.formattedDays} (${mostUrgent.license_name})`,
      color: 'text-emerald-600 dark:text-emerald-400',
      badge: 'All Valid',
      badgeColor: 'text-emerald-600 dark:text-emerald-400',
    }
  }, [licenses])

  const handleCloseLicenseModal = () => {
    setIsLicenseModalOpen(false)
    if (typeof window !== 'undefined' && window.location.search) {
      const url = new URL(window.location.href)
      let changed = false
      if (url.searchParams.has('tab')) {
        url.searchParams.delete('tab')
        changed = true
      }
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

  // Derived counts and statistics
  const activeVehicles = useMemo(
    () => vehicles.filter((v) => !v.is_archived),
    [vehicles],
  )
  const archivedVehicles = useMemo(
    () => vehicles.filter((v) => v.is_archived),
    [vehicles],
  )


  const defaultVehicle = useMemo(() => {
    return activeVehicles.find((v) => v.is_default) || null
  }, [activeVehicles])

  // Filtered vehicles based on search and active tab
  const displayedVehicles = useMemo(() => {
    const list = activeTab === 'active' ? activeVehicles : archivedVehicles
    if (!searchQuery.trim()) return list

    const q = searchQuery.toLowerCase().trim()
    return list.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.license_plate && v.license_plate.toLowerCase().includes(q)) ||
        v.type.toLowerCase().includes(q),
    )
  }, [activeTab, activeVehicles, archivedVehicles, searchQuery])

  // Handlers
  const handleAddSuccess = () => {
    router.refresh()
  }

  const handleEditSuccess = () => {
    router.refresh()
  }

  const deletingVehicle = vehicles.find((v) => v.id === deletingVehicleId)

  const handleSetDefault = async (vehicleId: string) => {
    const res = await setDefaultVehicle({ id: vehicleId })
    if (res.success) {
      toast.success('Default vehicle updated')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to set default vehicle')
    }
  }

  const handleToggleArchive = async (vehicleId: string, isArchived: boolean) => {
    const res = await toggleArchiveVehicle({ id: vehicleId, isArchived })
    if (res.success) {
      toast.success(isArchived ? 'Vehicle moved to archive' : 'Vehicle restored to active garage')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to update vehicle')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingVehicle) return
    setIsDeleting(true)

    if (deletingVehicle.is_archived) {
      const res = await deleteVehicle({ id: deletingVehicle.id })
      if (res.success) {
        toast.success('Vehicle permanently deleted')
        setDeletingVehicleId(null)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to delete vehicle')
      }
    } else {
      const res = await toggleArchiveVehicle({ id: deletingVehicle.id, isArchived: true })
      if (res.success) {
        toast.success('Vehicle moved to archive')
        setDeletingVehicleId(null)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to archive vehicle')
      }
    }

    setIsDeleting(false)
  }

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:px-8'>
      {/* Header Section */}
      <div className='space-y-2'>
        <BreadcrumbNav />
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-[-0.03em] sm:text-3xl text-foreground'>
              Vehicle Garage
            </h1>
            <p className='mt-0.5 text-xs text-muted-foreground sm:text-sm'>
              Manage vehicles, track forward mileage, and schedule asset maintenance.
            </p>
          </div>

        <div className='flex items-center gap-2.5 shrink-0'>
          <Button
            variant='outline'
            onClick={() => setIsLicenseModalOpen(true)}
            className='flex items-center gap-1.5 min-h-11 rounded-lg px-3.5 text-xs font-semibold'
          >
            <LuCreditCard className='size-4 text-primary' aria-hidden='true' />
            <span>Driver&apos;s Licenses (SIM)</span>
          </Button>

          <Button
            onClick={() => setIsAddOpen(true)}
            className='flex items-center gap-2 min-h-11 rounded-lg px-4 text-xs font-semibold'
          >
            <LuPlus className='size-4' aria-hidden='true' />
            <span>Add Vehicle</span>
          </Button>
        </div>
      </div>
    </div>

      {/* Stats Banner */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4'>
        <div className='rounded-xl border border-border/80 bg-card p-4 sm:p-5'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-medium flex items-center gap-1.5'>
              <LuCar className='size-4 text-primary' aria-hidden='true' />
              Active Vehicles
            </span>
            <span className='font-mono text-[0.68rem] uppercase'>
              {archivedVehicles.length > 0 ? `${archivedVehicles.length} archived` : 'In Service'}
            </span>
          </div>
          <div className='mt-2 font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
            {activeVehicles.length}
          </div>
          <p className='mt-0.5 text-[0.72rem] text-muted-foreground truncate'>
            {activeVehicles.length === 1 ? '1 vehicle in active fleet' : `${activeVehicles.length} vehicles in active fleet`}
          </p>
        </div>

        {/* Dynamic Regulatory & Driver License Health KPI */}
        <div
          onClick={() => setIsLicenseModalOpen(true)}
          role='button'
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsLicenseModalOpen(true)
            }
          }}
          className='group rounded-xl border border-border/80 bg-card p-4 sm:p-5 text-left cursor-pointer transition-all hover:border-primary/50 hover:shadow-xs'
        >
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-medium flex items-center gap-1.5'>
              {licenseStats.status === 'expired' ? (
                <LuShieldAlert className='size-4 text-destructive' aria-hidden='true' />
              ) : licenseStats.status === 'expiring_soon' ? (
                <LuTriangleAlert className='size-4 text-amber-600 dark:text-amber-400' aria-hidden='true' />
              ) : (
                <LuShieldCheck className='size-4 text-emerald-600 dark:text-emerald-400' aria-hidden='true' />
              )}
              Regulatory & License Health
            </span>
            <span
              className={`font-mono text-[0.68rem] uppercase font-semibold ${licenseStats.badgeColor}`}
            >
              {licenseStats.badge}
            </span>
          </div>
          <div
            className={`mt-2 text-xl sm:text-2xl font-bold tracking-tight truncate ${licenseStats.color}`}
          >
            {licenseStats.title}
          </div>
          <p className='mt-0.5 text-[0.72rem] text-muted-foreground truncate'>
            {licenseStats.subtitle}
          </p>
        </div>

        <div className='rounded-xl border border-border/80 bg-card p-4 sm:p-5'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-medium flex items-center gap-1.5'>
              <LuStar className='size-4 text-primary fill-primary/20' aria-hidden='true' />
              Default Vehicle
            </span>
            <span className='font-mono text-[0.68rem] uppercase'>1-Tap Target</span>
          </div>
          <div className='mt-2 text-base sm:text-lg font-bold tracking-tight text-foreground truncate'>
            {defaultVehicle ? defaultVehicle.name : 'None selected'}
          </div>
          <p className='mt-0.5 text-[0.72rem] text-muted-foreground truncate flex items-center gap-1.5'>
            {defaultVehicle ? (
              <>
                <span>{defaultVehicle.license_plate || 'No plate'}</span>
                <span>•</span>
                <span className='capitalize'>{defaultVehicle.fuel_type}</span>
              </>
            ) : (
              'Set one as default for quick logs'
            )}
          </p>
        </div>
      </div>

      {/* Filter Strip & Search */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4'>
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            if (val === 'active' || val === 'archived') {
              setActiveTab(val)
            }
          }}
        >
          <TabsList className='h-auto p-1 bg-secondary/40 border border-border/80 rounded-lg gap-1.5'>
            <TabsTrigger
              value='active'
              className='rounded-md px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground border-0'
            >
              Active ({activeVehicles.length})
            </TabsTrigger>
            <TabsTrigger
              value='archived'
              className='rounded-md px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground border-0'
            >
              Archived ({archivedVehicles.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className='relative w-full sm:w-64'>
          <LuSearch className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground' aria-hidden='true' />
          <Input
            type='search'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search vehicle or plate...'
            className='h-9 pl-9 text-xs rounded-lg'
          />
        </div>
      </div>

      {/* Vehicles Grid */}
      {displayedVehicles.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 sm:p-12 text-center'>
          <div className='rounded-full border border-border/80 bg-secondary/40 p-3'>
            {activeTab === 'archived' ? (
              <LuArchive className='size-6 text-muted-foreground' aria-hidden='true' />
            ) : (
              <LuCar className='size-6 text-primary' aria-hidden='true' />
            )}
          </div>

          <h3 className='mt-3 text-sm sm:text-base font-semibold text-foreground'>
            {activeTab === 'archived'
              ? 'No archived vehicles'
              : searchQuery.trim()
                ? 'No matching vehicles found'
                : 'Your garage is empty'}
          </h3>

          <p className='mt-1 max-w-sm text-xs text-muted-foreground'>
            {activeTab === 'archived'
              ? 'Vehicles you sell or retire can be archived here to preserve maintenance history for resale proof.'
              : searchQuery.trim()
                ? `No vehicles found matching "${searchQuery}". Try a different search term.`
                : 'Add your car, motorcycle, scooter, or bicycle to start tracking odometer updates and maintenance intervals.'}
          </p>

          {activeTab === 'active' && !searchQuery.trim() && (
            <Button
              onClick={() => setIsAddOpen(true)}
              className='mt-4 flex items-center gap-2 min-h-10 text-xs'
            >
              <LuPlus className='size-4' aria-hidden='true' />
              <span>Add your first vehicle</span>
            </Button>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {displayedVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={(v) => setEditingVehicle(v)}
              onSetDefault={handleSetDefault}
              onToggleArchive={handleToggleArchive}
              onDelete={(id) => setDeletingVehicleId(id)}
            />
          ))}
        </div>
      )}

      {/* Mobile Quick Fuel FAB */}
      <QuickFuelFab vehicles={activeVehicles} />

      {/* Modals */}
      <AddVehicleModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleAddSuccess}
        cashflowBooks={cashflowBooks}
      />

      <EditVehicleModal
        vehicle={editingVehicle}
        isOpen={!!editingVehicle}
        onClose={() => setEditingVehicle(null)}
        onSuccess={handleEditSuccess}
        cashflowBooks={cashflowBooks}
      />

      <DriverLicenseModal
        isOpen={isLicenseModalOpen}
        onClose={handleCloseLicenseModal}
        initialLicenses={licenses}
        onLicensesChange={setLicenses}
      />

      {/* Delete / Archive Confirmation Alert */}
      <AlertDialog
        open={!!deletingVehicleId}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingVehicleId(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-base font-semibold'>
              {deletingVehicle?.is_archived
                ? `Permanently delete ${deletingVehicle.name}?`
                : `Delete ${deletingVehicle?.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs text-muted-foreground'>
              {deletingVehicle?.is_archived
                ? 'This action is irreversible. All vehicle specifications and rolling monthly odometer snapshots will be permanently erased.'
                : 'This will remove this vehicle from your active garage and move it to your Archived tab. You can restore it anytime or delete it permanently from there.'}
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
                  await handleDeleteConfirm()
                }}
              >
                {deletingVehicle?.is_archived ? 'Delete Forever' : 'Delete Vehicle'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
