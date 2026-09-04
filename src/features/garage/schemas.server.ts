import { z } from 'zod'

export const vehicleTypeSchema = z.enum(['car', 'motorcycle', 'bicycle', 'other'])
export const fuelTypeSchema = z.enum(['petrol', 'diesel', 'electric', 'hybrid'])
export const odometerUnitSchema = z.enum(['km', 'miles'])

const currentYear = new Date().getFullYear()

export const createVehicleSchema = z.object({
  name: z.string().trim().min(1, 'Vehicle name is required').max(100, 'Vehicle name is too long'),
  type: vehicleTypeSchema.default('car'),
  licensePlate: z
    .string()
    .trim()
    .max(20, 'License plate is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val.toUpperCase() : null)),
  year: z
    .coerce
    .number()
    .int()
    .min(1900, 'Year must be after 1900')
    .max(currentYear + 2, `Year cannot exceed ${currentYear + 2}`)
    .optional()
    .nullable(),
  isDefault: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
  currentOdometer: z
    .coerce
    .number()
    .int()
    .min(0, 'Current odometer cannot be negative')
    .max(2000000, 'Odometer exceeds realistic bounds')
    .default(0),
  odometerUnit: odometerUnitSchema.default('km'),
  estimatedMonthlyKm: z
    .coerce
    .number()
    .int()
    .min(10, 'Estimated monthly usage must be at least 10')
    .max(50000, 'Estimated monthly usage cannot exceed 50,000')
    .optional()
    .nullable()
    .default(1000),
  fuelType: fuelTypeSchema.default('petrol'),
  currency: z
    .string()
    .trim()
    .min(3, 'Currency must be 3 characters')
    .max(10)
    .toUpperCase()
    .default('IDR'),
  vin: z
    .string()
    .trim()
    .max(50, 'VIN is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val.toUpperCase() : null)),
  preferredCashflowId: z
    .string()
    .uuid('Invalid cashflow book ID')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
})

export const updateVehicleSchema = z.object({
  id: z.string().uuid('Invalid vehicle ID'),
  name: z.string().trim().min(1, 'Vehicle name is required').max(100, 'Vehicle name is too long'),
  type: vehicleTypeSchema,
  licensePlate: z
    .string()
    .trim()
    .max(20, 'License plate is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val.toUpperCase() : null)),
  year: z
    .coerce
    .number()
    .int()
    .min(1900, 'Year must be after 1900')
    .max(currentYear + 2, `Year cannot exceed ${currentYear + 2}`)
    .optional()
    .nullable(),
  isDefault: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
  currentOdometer: z
    .coerce
    .number()
    .int()
    .min(0, 'Current odometer cannot be negative')
    .max(2000000, 'Odometer exceeds realistic bounds'),
  odometerUnit: odometerUnitSchema,
  estimatedMonthlyKm: z
    .coerce
    .number()
    .int()
    .min(10, 'Estimated monthly usage must be at least 10')
    .max(50000, 'Estimated monthly usage cannot exceed 50,000')
    .optional()
    .nullable()
    .default(1000),
  fuelType: fuelTypeSchema,
  currency: z
    .string()
    .trim()
    .min(3, 'Currency must be 3 characters')
    .max(10)
    .toUpperCase(),
  vin: z
    .string()
    .trim()
    .max(50, 'VIN is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val.toUpperCase() : null)),
  preferredCashflowId: z
    .string()
    .uuid('Invalid cashflow book ID')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  confirmOdometerJump: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
  convertOdometerUnit: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
})

export const toggleArchiveVehicleSchema = z.object({
  id: z.string().uuid('Invalid vehicle ID'),
  isArchived: z.boolean(),
})

export const deleteVehicleSchema = z.object({
  id: z.string().uuid('Invalid vehicle ID'),
})

export const setDefaultVehicleSchema = z.object({
  id: z.string().uuid('Invalid vehicle ID'),
})

export const updateOdometerSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  odometer: z
    .coerce
    .number()
    .int('Odometer must be an integer')
    .min(0, 'Odometer cannot be negative')
    .max(2000000, 'Odometer exceeds realistic bounds'),
  confirmOdometerJump: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
})
