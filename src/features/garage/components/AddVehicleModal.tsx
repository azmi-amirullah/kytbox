'use client'

import { useState } from 'react'
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
import type { VehicleDTO, VehicleType, FuelType, OdometerUnit } from '@/types/dto'
import { isVehicleType, isFuelType, isOdometerUnit } from '../types'
import { createVehicle } from '../actions'

interface AddVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (vehicle: VehicleDTO) => void
  cashflowBooks?: { id: string; title: string; currency: string }[]
}

export function AddVehicleModal({
  isOpen,
  onClose,
  onSuccess,
  cashflowBooks = [],
}: AddVehicleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState<VehicleType>('car')
  const [licensePlate, setLicensePlate] = useState('')
  const [year, setYear] = useState<string>(new Date().getFullYear().toString())
  const [currentOdometer, setCurrentOdometer] = useState<string>('0')
  const [odometerUnit, setOdometerUnit] = useState<OdometerUnit>('km')
  const [estimatedMonthlyKm, setEstimatedMonthlyKm] = useState<string>('1000')
  const [fuelType, setFuelType] = useState<FuelType>('petrol')
  const [currency, setCurrency] = useState('IDR')
  const [vin, setVin] = useState('')
  const [preferredCashflowId, setPreferredCashflowId] = useState<string>('')
  const [isDefault, setIsDefault] = useState(false)

  const resetForm = () => {
    setName('')
    setType('car')
    setLicensePlate('')
    setYear(new Date().getFullYear().toString())
    setCurrentOdometer('0')
    setOdometerUnit('km')
    setEstimatedMonthlyKm('1000')
    setFuelType('petrol')
    setCurrency('IDR')
    setVin('')
    setPreferredCashflowId('')
    setIsDefault(false)
    setErrorMessage(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage('Vehicle name is required')
      return
    }

    const parsedOdometer = parseInt(currentOdometer, 10)
    if (isNaN(parsedOdometer) || parsedOdometer < 0) {
      setErrorMessage('Current odometer must be a positive number')
      return
    }

    const parsedYear = year ? parseInt(year, 10) : undefined
    const parsedMonthlyKm = estimatedMonthlyKm
      ? parseInt(estimatedMonthlyKm, 10)
      : 1000

    setIsSubmitting(true)

    try {
      const payload = {
        name: name.trim(),
        type,
        licensePlate: licensePlate.trim() ? licensePlate.trim() : null,
        year: parsedYear && !isNaN(parsedYear) ? parsedYear : null,
        currentOdometer: parsedOdometer,
        odometerUnit,
        estimatedMonthlyKm: parsedMonthlyKm && !isNaN(parsedMonthlyKm) ? parsedMonthlyKm : 1000,
        fuelType,
        currency: currency.trim() ? currency.trim().toUpperCase() : 'IDR',
        vin: vin.trim() ? vin.trim() : null,
        preferredCashflowId: preferredCashflowId || null,
        isDefault,
      }

      const res = await createVehicle(payload)

      if (!res.success || !res.data) {
        setErrorMessage(res.error || 'Failed to create vehicle')
        setIsSubmitting(false)
        return
      }

      onSuccess(res.data)
      handleClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleClose() : null)}>
      <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-lg font-semibold tracking-[-0.02em]'>
            Add Vehicle to Garage
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Register a car, motorcycle, scooter, or bicycle to begin tracking mileage and service intervals.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className='rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive' role='alert'>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          {/* Section 1: Basic Identity */}
          <div className='space-y-3 rounded-lg border border-border/70 bg-secondary/20 p-3'>
            <div className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Vehicle Details
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='vehicle-type' className='text-xs font-medium'>
                  Type
                </Label>
                <Select
                  value={type}
                  onValueChange={(val) => {
                    if (isVehicleType(val)) setType(val)
                  }}
                >
                  <SelectTrigger id='vehicle-type' className='min-h-10 text-xs'>
                    <SelectValue placeholder='Select type' />
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
                <Label htmlFor='vehicle-year' className='text-xs font-medium'>
                  Model Year
                </Label>
                <Input
                  id='vehicle-year'
                  type='number'
                  min='1900'
                  max={new Date().getFullYear() + 2}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder='2023'
                  className='min-h-10 text-xs'
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='vehicle-name' className='gap-0.5 text-xs font-medium'>
                Vehicle Name<span className='text-destructive'>*</span>
              </Label>
              <Input
                id='vehicle-name'
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Honda Civic Turbo, Yamaha NMAX'
                className='min-h-10 text-xs'
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='vehicle-plate' className='text-xs font-medium'>
                  License Plate
                </Label>
                <Input
                  id='vehicle-plate'
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder='e.g. B 1234 ABC'
                  className='min-h-10 text-xs font-mono uppercase'
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='vehicle-vin' className='text-xs font-medium'>
                  VIN / Chassis No. (Optional)
                </Label>
                <Input
                  id='vehicle-vin'
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  placeholder='17-digit VIN'
                  className='min-h-10 text-xs font-mono'
                />
              </div>
            </div>
          </div>

          {/* Section 2: Odometer & Usage */}
          <div className='space-y-3 rounded-lg border border-border/70 bg-secondary/20 p-3'>
            <div className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Mileage & Cold-Start Velocity
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              <div className='sm:col-span-2 space-y-1.5'>
                <Label htmlFor='vehicle-odometer' className='gap-0.5 text-xs font-medium'>
                  Current Odometer<span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='vehicle-odometer'
                  type='number'
                  required
                  min='0'
                  value={currentOdometer}
                  onChange={(e) => setCurrentOdometer(e.target.value)}
                  className='min-h-10 text-xs font-mono'
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='vehicle-unit' className='text-xs font-medium'>
                  Unit
                </Label>
                <Select
                  value={odometerUnit}
                  onValueChange={(val) => {
                    if (isOdometerUnit(val)) setOdometerUnit(val)
                  }}
                >
                  <SelectTrigger id='vehicle-unit' className='min-h-10 text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='km'>km</SelectItem>
                    <SelectItem value='miles'>miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='vehicle-monthly-km' className='text-xs font-medium'>
                  Est. Monthly Driving ({odometerUnit}/month)
                </Label>
                <span className='text-[0.68rem] text-muted-foreground'>
                  Cold-start fallback
                </span>
              </div>
              <Input
                id='vehicle-monthly-km'
                type='number'
                min='10'
                max='50000'
                value={estimatedMonthlyKm}
                onChange={(e) => setEstimatedMonthlyKm(e.target.value)}
                placeholder='1000'
                className='min-h-10 text-xs font-mono'
              />
            </div>
          </div>

          {/* Section 3: Fuel & Accounting */}
          <div className='space-y-3 rounded-lg border border-border/70 bg-secondary/20 p-3'>
            <div className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Fuel & Financials
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='vehicle-fuel' className='text-xs font-medium'>
                  Fuel / Powertrain
                </Label>
                <Select
                  value={fuelType}
                  onValueChange={(val) => {
                    if (isFuelType(val)) setFuelType(val)
                  }}
                >
                  <SelectTrigger id='vehicle-fuel' className='min-h-10 text-xs capitalize'>
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
                <Label htmlFor='vehicle-currency' className='text-xs font-medium'>
                  Currency
                </Label>
                <Select value={currency} onValueChange={(val) => setCurrency(val)}>
                  <SelectTrigger id='vehicle-currency' className='min-h-10 text-xs'>
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
                <Label htmlFor='vehicle-cashflow' className='text-xs font-medium'>
                  Default Cashflow Book (Sticky Sync)
                </Label>
                <Select
                  value={preferredCashflowId || 'none'}
                  onValueChange={(val) => setPreferredCashflowId(val === 'none' ? '' : val)}
                >
                  <SelectTrigger id='vehicle-cashflow' className='min-h-10 text-xs'>
                    <SelectValue placeholder='None (Optional)' />
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

          {/* Default Toggle */}
          <div className='flex items-center justify-between rounded-lg border border-border/70 p-3'>
            <div className='space-y-0.5'>
              <Label htmlFor='is-default' className='text-xs font-medium cursor-pointer'>
                Set as Default Vehicle
              </Label>
              <p className='text-[0.68rem] text-muted-foreground'>
                Quick logging shortcuts will default to this vehicle.
              </p>
            </div>
            <Switch
              id='is-default'
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>

          <DialogFooter className='gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
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
              Add Vehicle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
