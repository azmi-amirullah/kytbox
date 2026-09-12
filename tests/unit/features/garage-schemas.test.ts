import { describe, it, expect } from 'vitest'
import {
  createVehicleSchema,
  updateVehicleSchema,
  toggleArchiveVehicleSchema,
  deleteVehicleSchema,
  setDefaultVehicleSchema,
  updateOdometerSchema,
  createVehicleFuelLogSchema,
  updateVehicleFuelLogSchema,
  deleteVehicleFuelLogSchema,
} from '@/features/garage/schemas.server'
import { vehicleFormClientSchema, fuelLogFormClientSchema } from '@/features/garage/schemas.client'

describe('Garage Server Schemas', () => {
  it('parses valid createVehicle payload with smart defaults', () => {
    const raw = {
      name: '  Honda Civic Turbo  ',
      type: 'car',
      licensePlate: 'b 1234 abc',
      year: '2022',
      currentOdometer: '42000',
      odometerUnit: 'km',
      estimatedMonthlyKm: '1200',
      fuelType: 'petrol',
      currency: 'idr',
      isDefault: 'true',
    }

    const parsed = createVehicleSchema.parse(raw)
    expect(parsed.name).toBe('Honda Civic Turbo')
    expect(parsed.licensePlate).toBe('B 1234 ABC')
    expect(parsed.year).toBe(2022)
    expect(parsed.currentOdometer).toBe(42000)
    expect(parsed.currency).toBe('IDR')
    expect(parsed.isDefault).toBe(true)
    expect(parsed.estimatedMonthlyKm).toBe(1200)
    expect(parsed.transmission).toBe('automatic')
  })

  it('parses createVehicle with manual transmission explicitly', () => {
    const raw = {
      name: 'Kawasaki Ninja ZX-25R',
      type: 'motorcycle',
      transmission: 'manual',
    }

    const parsed = createVehicleSchema.parse(raw)
    expect(parsed.name).toBe('Kawasaki Ninja ZX-25R')
    expect(parsed.transmission).toBe('manual')
  })

  it('rejects empty vehicle name', () => {
    expect(() =>
      createVehicleSchema.parse({
        name: '   ',
      }),
    ).toThrow('Vehicle name is required')
  })

  it('rejects negative odometer', () => {
    expect(() =>
      createVehicleSchema.parse({
        name: 'Yamaha NMAX',
        currentOdometer: -500,
      }),
    ).toThrow('Current odometer cannot be negative')
  })

  it('rejects unrealistic year', () => {
    expect(() =>
      createVehicleSchema.parse({
        name: 'Vintage Car',
        year: 1850,
      }),
    ).toThrow('Year must be after 1900')
  })

  it('parses updateVehicle with valid uuid and confirmOdometerJump flag', () => {
    const raw = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Yamaha NMAX 155',
      type: 'motorcycle',
      currentOdometer: 15000,
      odometerUnit: 'km',
      estimatedMonthlyKm: 800,
      fuelType: 'petrol',
      currency: 'IDR',
      confirmOdometerJump: true,
    }

    const parsed = updateVehicleSchema.parse(raw)
    expect(parsed.id).toBe('123e4567-e89b-12d3-a456-426614174000')
    expect(parsed.name).toBe('Yamaha NMAX 155')
    expect(parsed.confirmOdometerJump).toBe(true)
    expect(parsed.transmission).toBe('automatic')
  })

  it('validates toggleArchiveVehicleSchema and deleteVehicleSchema', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000'
    expect(
      toggleArchiveVehicleSchema.parse({
        id: validId,
        isArchived: true,
      }),
    ).toEqual({ id: validId, isArchived: true })

    expect(deleteVehicleSchema.parse({ id: validId })).toEqual({ id: validId })
    expect(setDefaultVehicleSchema.parse({ id: validId })).toEqual({ id: validId })
  })

  it('validates createVehicleFuelLogSchema with coerced types', () => {
    const validVehicleId = '123e4567-e89b-12d3-a456-426614174000'
    const raw = {
      vehicleId: validVehicleId,
      logDate: '2026-09-05',
      odometer: '45000',
      fuelAmount: '35.5',
      pricePerUnit: '12500',
      totalCost: '443750',
      isFullTank: 'true',
      isMissedPrevious: 'false',
      notes: '  Full tank Shell V-Power  ',
      confirmTypoJump: 'false',
      recordToCashflow: 'true',
      cashflowId: '223e4567-e89b-12d3-a456-426614174000',
      cashflowCategory: 'Fuel',
    }

    const parsed = createVehicleFuelLogSchema.parse(raw)
    expect(parsed.vehicleId).toBe(validVehicleId)
    expect(parsed.logDate).toBe('2026-09-05')
    expect(parsed.odometer).toBe(45000)
    expect(parsed.fuelAmount).toBe(35.5)
    expect(parsed.pricePerUnit).toBe(12500)
    expect(parsed.totalCost).toBe(443750)
    expect(parsed.isFullTank).toBe(true)
    expect(parsed.isMissedPrevious).toBe(false)
    expect(parsed.notes).toBe('Full tank Shell V-Power')
    expect(parsed.recordToCashflow).toBe(true)
  })

  it('rejects invalid fuel logs with negative numbers or invalid dates', () => {
    const validVehicleId = '123e4567-e89b-12d3-a456-426614174000'
    expect(() =>
      createVehicleFuelLogSchema.parse({
        vehicleId: validVehicleId,
        logDate: '05-09-2026', // invalid date format
        odometer: 1000,
        fuelAmount: 10,
        totalCost: 100000,
      }),
    ).toThrow('Invalid date format')

    expect(() =>
      createVehicleFuelLogSchema.parse({
        vehicleId: validVehicleId,
        logDate: '2026-09-05',
        odometer: -1,
        fuelAmount: 10,
        totalCost: 100000,
      }),
    ).toThrow('Odometer cannot be negative')

    expect(() =>
      createVehicleFuelLogSchema.parse({
        vehicleId: validVehicleId,
        logDate: '2026-09-05',
        odometer: 1000,
        fuelAmount: 0,
        totalCost: 100000,
      }),
    ).toThrow('Fuel volume must be greater than 0')
  })

  it('validates updateVehicleFuelLogSchema and deleteVehicleFuelLogSchema', () => {
    const validLogId = '323e4567-e89b-12d3-a456-426614174000'
    const validVehicleId = '123e4567-e89b-12d3-a456-426614174000'

    const parsed = updateVehicleFuelLogSchema.parse({
      id: validLogId,
      vehicleId: validVehicleId,
      logDate: '2026-09-05',
      odometer: 45200,
      fuelAmount: 36,
      totalCost: 450000,
    })
    expect(parsed.id).toBe(validLogId)
    expect(parsed.odometer).toBe(45200)

    expect(deleteVehicleFuelLogSchema.parse({ id: validLogId })).toEqual({
      id: validLogId,
    })
  })
})

describe('Garage Client Schemas', () => {
  it('parses valid client form data', () => {
    const data = {
      name: 'Brompton Bicycle',
      type: 'bicycle',
      currentOdometer: 350,
      odometerUnit: 'km',
      fuelType: 'other',
      currency: 'IDR',
      isDefault: false,
    }

    const res = vehicleFormClientSchema.safeParse(data)
    expect(res.success).toBe(true)
  })

  it('validates updateOdometerSchema and updateOdometerClientSchema', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000'
    const parsed = updateOdometerSchema.parse({
      vehicleId: validId,
      odometer: '18500',
      confirmOdometerJump: 'true',
    })
    expect(parsed.vehicleId).toBe(validId)
    expect(parsed.odometer).toBe(18500)
    expect(parsed.confirmOdometerJump).toBe(true)

    expect(() =>
      updateOdometerSchema.parse({
        vehicleId: validId,
        odometer: -50,
      }),
    ).toThrow('Odometer cannot be negative')
  })

  it('validates fuelLogFormClientSchema with gas pump dual calculation constraints', () => {
    const res = fuelLogFormClientSchema.safeParse({
      logDate: '2026-09-05',
      odometer: 50000,
      fuelAmount: 40,
      pricePerUnit: 14000,
      totalCost: 560000,
      isFullTank: true,
      isMissedPrevious: false,
      recordToCashflow: false,
    })
    expect(res.success).toBe(true)

    const invalidRes = fuelLogFormClientSchema.safeParse({
      logDate: 12345, // invalid type: expects string
      odometer: 'not-a-number', // invalid type: expects number
      fuelAmount: null, // invalid type: expects number
      totalCost: 'expensive', // invalid type: expects number
    })
    expect(invalidRes.success).toBe(false)
  })
})
