import * as z from 'zod/mini'

export const vehicleTypeClientSchema = z.catch(
  z.enum(['car', 'motorcycle', 'bicycle', 'other']),
  'car',
)
export const fuelTypeClientSchema = z.catch(
  z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  'petrol',
)
export const odometerUnitClientSchema = z.catch(
  z.enum(['km', 'miles']),
  'km',
)

export const vehicleFormClientSchema = z.object({
  name: z.string(),
  type: vehicleTypeClientSchema,
  licensePlate: z.optional(z.nullable(z.string())),
  year: z.optional(z.nullable(z.number())),
  isDefault: z.catch(z.boolean(), false),
  currentOdometer: z.catch(z.number(), 0),
  odometerUnit: odometerUnitClientSchema,
  estimatedMonthlyKm: z.optional(z.nullable(z.number())),
  fuelType: fuelTypeClientSchema,
  currency: z.catch(z.string(), 'IDR'),
  vin: z.optional(z.nullable(z.string())),
  preferredCashflowId: z.optional(z.nullable(z.string())),
})

export const updateOdometerClientSchema = z.object({
  odometer: z.number(),
  confirmOdometerJump: z.optional(z.boolean()),
})
