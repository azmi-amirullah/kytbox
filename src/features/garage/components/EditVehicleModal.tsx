'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { CURRENCIES } from '@/lib/currency'
import type { VehicleDTO, VehicleType, FuelType, TransmissionType, OdometerUnit } from '@/types/dto'
import { isVehicleType, isFuelType, isOdometerUnit } from '../types'
import { updateVehicle } from '../actions'
import { convertOdometerUnit } from '../lib/odometer'

interface EditVehicleModalProps {
  vehicle: VehicleDTO | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (vehicle: VehicleDTO) => void
  cashflowBooks?: { id: string; title: string; currency: string }[]
}

export function EditVehicleModal({
  vehicle,
  isOpen,
  onClose,
  onSuccess,
  cashflowBooks = [],
}: EditVehicleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Typo guard confirmation modal state
  const [showTypoConfirmation, setShowTypoConfirmation] = useState(false)
  const [pendingOdoJump, setPendingOdoJump] = useState<number>(0)

  // Form states
  const [name, setName] = useState('')
  const [type, setType] = useState<VehicleType>('car')
  const [licensePlate, setLicensePlate] = useState('')
  const [year, setYear] = useState<string>('')
  const [currentOdometer, setCurrentOdometer] = useState<string>('0')
  const [odometerUnit, setOdometerUnit] = useState<OdometerUnit>('km')
  const [estimatedMonthlyKm, setEstimatedMonthlyKm] = useState<string>('1000')
  const [fuelType, setFuelType] = useState<FuelType>('petrol')
  const [transmission, setTransmission] = useState<TransmissionType>('automatic')
  const [currency, setCurrency] = useState('IDR')
  const [vin, setVin] = useState('')
  const [preferredCashflowId, setPreferredCashflowId] = useState<string>('')
  const [isDefault, setIsDefault] = useState(false)
  const [convertUnitMath, setConvertUnitMath] = useState(true)

  useEffect(() => {
    if (vehicle) {
      setName(vehicle.name)
      setType(vehicle.type)
      setLicensePlate(vehicle.license_plate || '')
      setYear(vehicle.year ? vehicle.year.toString() : '')
      setCurrentOdometer(vehicle.current_odometer.toString())
      setOdometerUnit(vehicle.odometer_unit)
      setEstimatedMonthlyKm(
        vehicle.estimated_monthly_km ? vehicle.estimated_monthly_km.toString() : '1000',
      )
      setFuelType(vehicle.fuel_type)
      setTransmission(vehicle.transmission || 'automatic')
      setCurrency(vehicle.currency)
      setVin(vehicle.vin || '')
      setPreferredCashflowId(vehicle.preferred_cashflow_id || '')
      setIsDefault(vehicle.is_default)
      setErrorMessage(null)
    }
  }, [vehicle])

  if (!vehicle) return null

  const handleUnitChange = (newUnit: OdometerUnit) => {
    if (newUnit !== odometerUnit && convertUnitMath) {
      const current = parseInt(currentOdometer, 10) || 0
      const converted = convertOdometerUnit(current, odometerUnit, newUnit)
      setCurrentOdometer(converted.toString())
    }
    setOdometerUnit(newUnit)
  }

  const executeUpdate = async (confirmJump = false) => {
    if (!name.trim()) {
      setErrorMessage('Vehicle name is required')
      return
    }

    const parsedOdometer = parseInt(currentOdometer, 10)
    if (isNaN(parsedOdometer) || parsedOdometer < 0) {
      setErrorMessage('Current odometer must be a positive number')
      return
    }

    // Check client-side typo guard before sending if not yet confirmed
    if (!confirmJump && parsedOdometer - vehicle.current_odometer > 3000) {
      setPendingOdoJump(parsedOdometer - vehicle.current_odometer)
      setShowTypoConfirmation(true)
      return
    }

    const parsedYear = year ? parseInt(year, 10) : undefined
    const parsedMonthlyKm = estimatedMonthlyKm
      ? parseInt(estimatedMonthlyKm, 10)
      : 1000

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const payload = {
        id: vehicle.id,
        name: name.trim(),
        type,
        licensePlate: licensePlate.trim() ? licensePlate.trim() : null,
        year: parsedYear && !isNaN(parsedYear) ? parsedYear : null,
        currentOdometer: parsedOdometer,
        odometerUnit,
        estimatedMonthlyKm: parsedMonthlyKm && !isNaN(parsedMonthlyKm) ? parsedMonthlyKm : 1000,
        fuelType,
        transmission,
        currency: currency.trim() ? currency.trim().toUpperCase() : 'IDR',
        vin: vin.trim() ? vin.trim() : null,
        preferredCashflowId: preferredCashflowId || null,
        isDefault,
        confirmOdometerJump: confirmJump,
        convertOdometerUnit: convertUnitMath,
      }

      const res = await updateVehicle(payload)

      if (!res.success) {
        if (res.isTypoWarning) {
          setPendingOdoJump(parsedOdometer - vehicle.current_odometer)
          setShowTypoConfirmation(true)
        } else {
          setErrorMessage(res.error || 'Failed to update vehicle')
        }
        setIsSubmitting(false)
        return
      }

      if (res.data) {
        onSuccess(res.data)
        onClose()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    executeUpdate(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
        <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-lg font-semibold tracking-[-0.02em]'>
              Edit Vehicle Profile
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Update vehicle specifications, current mileage reading, or sync settings.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className='rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive' role='alert'>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
            {/* Basic Details */}
            <div className='space-y-3 rounded-lg border border-border/70 bg-secondary/20 p-3'>
              <div className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Vehicle Details
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div className='space-y-1.5'>
                  <Label htmlFor='edit-vehicle-type' className='text-xs font-medium'>
                    Type
                  </Label>
                <Select
                  value={type}
                  onValueChange={(val) => {
                    if (isVehicleType(val)) setType(val)
                  }}
                >
                    <SelectTrigger id='edit-vehicle-type' className='min-h-10 text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='car'>Car</SelectItem>
                      <SelectItem value='motorcycle'>Motorcycle</SelectItem>
                      <SelectItem value='bicycle'>Bicycle</SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='edit-vehicle-year' className='text-xs font-medium'>
                    Model Year
                  </Label>
                  <Input
                    id='edit-vehicle-year'
                    type='number'
                    min='1900'
                    max={new Date().getFullYear() + 2}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className='min-h-10 text-xs'
                  />
                </div>
              </div>

              {(type === 'car' || type === 'motorcycle') && (
                <div className='space-y-1.5'>
                  <Label className='gap-0.5 text-xs font-medium'>
                    Transmission<span className='text-destructive'>*</span>
                  </Label>
                  <div className='grid grid-cols-2 gap-2'>
                    <button
                      type='button'
                      onClick={() => setTransmission('automatic')}
                      className={`flex items-center justify-center rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                        transmission === 'automatic'
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                          : 'border-border bg-background text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      }`}
                    >
                      {type === 'motorcycle' ? 'Automatic (Scooter / CVT)' : 'Automatic (AT / CVT)'}
                    </button>
                    <button
                      type='button'
                      onClick={() => setTransmission('manual')}
                      className={`flex items-center justify-center rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                        transmission === 'manual'
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                          : 'border-border bg-background text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      }`}
                    >
                      {type === 'motorcycle' ? 'Manual (Clutch / Chain)' : 'Manual (MT / Clutch)'}
                    </button>
                  </div>
                </div>
              )}

              <div className='space-y-1.5'>
                <Label htmlFor='edit-vehicle-name' className='gap-0.5 text-xs font-medium'>
                  Vehicle Name<span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='edit-vehicle-name'
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='min-h-10 text-xs'
                />
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div className='space-y-1.5'>
                  <Label htmlFor='edit-vehicle-plate' className='text-xs font-medium'>
                    License Plate
                  </Label>
                  <Input
                    id='edit-vehicle-plate'
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className='min-h-10 text-xs font-mono uppercase'
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='edit-vehicle-vin' className='text-xs font-medium'>
                    VIN / Chassis No.
                  </Label>
                  <Input
                    id='edit-vehicle-vin'
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    className='min-h-10 text-xs font-mono'
                  />
                </div>
              </div>
            </div>

            {/* Odometer & Usage */}
            <div className='space-y-3 rounded-lg border border-border/70 bg-secondary/20 p-3'>
              <div className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Mileage & Odometer
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <div className='sm:col-span-2 space-y-1.5'>
                  <Label htmlFor='edit-vehicle-odometer' className='gap-0.5 text-xs font-medium'>
                    Current Odometer<span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    id='edit-vehicle-odometer'
                    type='number'
                    required
                    min='0'
                    value={currentOdometer}
                    onChange={(e) => setCurrentOdometer(e.target.value)}
                    className='min-h-10 text-xs font-mono'
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='edit-vehicle-unit' className='text-xs font-medium'>
                    Unit
                  </Label>
                  <Select
                    value={odometerUnit}
                    onValueChange={(val) => {
                      if (isOdometerUnit(val)) handleUnitChange(val)
                    }}
                  >
                    <SelectTrigger id='edit-vehicle-unit' className='min-h-10 text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='km'>km</SelectItem>
                      <SelectItem value='miles'>miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {vehicle.odometer_unit !== odometerUnit && (
                <div className='flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300'>
                  <span className='pr-2'>Convert odometer value mathematically ({odometerUnit})</span>
                  <Switch
                    checked={convertUnitMath}
                    onCheckedChange={setConvertUnitMath}
                  />
                </div>
              )}

              <div className='space-y-1.5'>
                <Label htmlFor='edit-vehicle-monthly-km' className='text-xs font-medium'>
                  Est. Monthly Driving ({odometerUnit}/month)
                </Label>
                <Input
                  id='edit-vehicle-monthly-km'
                  type='number'
                  min='10'
                  max='50000'
                  value={estimatedMonthlyKm}
                  onChange={(e) => setEstimatedMonthlyKm(e.target.value)}
                  className='min-h-10 text-xs font-mono'
                />
              </div>
            </div>

            {/* Fuel & Financials */}
            <div className='space-y-3 rounded-lg border border-border/70 bg-secondary/20 p-3'>
              <div className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Fuel & Financials
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div className='space-y-1.5'>
                  <Label htmlFor='edit-vehicle-fuel' className='text-xs font-medium'>
                    Fuel / Powertrain
                  </Label>
                  <Select
                    value={fuelType}
                    onValueChange={(val) => {
                      if (isFuelType(val)) setFuelType(val)
                    }}
                  >
                    <SelectTrigger id='edit-vehicle-fuel' className='min-h-10 text-xs capitalize'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='petrol'>Petrol / Gasoline</SelectItem>
                      <SelectItem value='diesel'>Diesel</SelectItem>
                      <SelectItem value='electric'>Electric (EV)</SelectItem>
                      <SelectItem value='hybrid'>Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='edit-vehicle-currency' className='text-xs font-medium'>
                    Currency
                  </Label>
                  <Select value={currency} onValueChange={(val) => setCurrency(val)}>
                    <SelectTrigger id='edit-vehicle-currency' className='min-h-10 text-xs'>
                      <SelectValue placeholder='Select currency'>
                        {(() => {
                          const cur = CURRENCIES.find((c) => c.code === currency)
                          return cur ? `${cur.code} (${cur.symbol})` : currency
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {!CURRENCIES.some((c) => c.code === currency) && currency && (
                        <SelectItem value={currency}>{currency}</SelectItem>
                      )}
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} ({c.symbol}) – {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {cashflowBooks.length > 0 && (
                <div className='space-y-1.5'>
                  <Label htmlFor='edit-vehicle-cashflow' className='text-xs font-medium'>
                    Default Cashflow Book
                  </Label>
                  <Select
                    value={preferredCashflowId || 'none'}
                    onValueChange={(val) => setPreferredCashflowId(val === 'none' ? '' : val)}
                  >
                    <SelectTrigger id='edit-vehicle-cashflow' className='min-h-10 text-xs'>
                      <SelectValue placeholder='None' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>None</SelectItem>
                      {cashflowBooks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Default Vehicle Switch */}
            <div className='flex items-center justify-between rounded-lg border border-border/70 p-3'>
              <div className='space-y-0.5'>
                <Label htmlFor='edit-is-default' className='text-xs font-medium cursor-pointer'>
                  Set as Default Vehicle
                </Label>
                <p className='text-[0.68rem] text-muted-foreground'>
                  Active vehicle for quick logging shortcuts.
                </p>
              </div>
              <Switch
                id='edit-is-default'
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>

            <DialogFooter className='gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={isSubmitting}
                className='min-h-10 text-xs'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                loading={isSubmitting}
                className='min-h-10 text-xs'
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fat-Finger Typo Confirmation Dialog */}
      <AlertDialog open={showTypoConfirmation} onOpenChange={setShowTypoConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-base font-semibold'>
              Confirm Large Odometer Jump
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs text-muted-foreground'>
              You entered a reading of <strong className='text-foreground'>{currentOdometer} {odometerUnit}</strong>, which is a jump of <strong className='text-foreground'>{pendingOdoJump} {odometerUnit}</strong> from the previous reading ({vehicle.current_odometer} {vehicle.odometer_unit}).
              <br /><br />
              Did you mean this value, or was it a typo (e.g. extra zero)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='text-xs'>
              No, Let Me Fix It
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowTypoConfirmation(false)
                executeUpdate(true)
              }}
              className='text-xs'
            >
              Yes, Confirm Odometer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
