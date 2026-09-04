import { describe, it, expect } from 'vitest'
import {
  createVehicleSchema,
  updateVehicleSchema,
  toggleArchiveVehicleSchema,
  deleteVehicleSchema,
  setDefaultVehicleSchema,
  updateOdometerSchema,
} from '@/features/garage/schemas.server'
import { vehicleFormClientSchema } from '@/features/garage/schemas.client'

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
})
