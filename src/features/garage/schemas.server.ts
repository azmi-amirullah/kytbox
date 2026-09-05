import { z } from 'zod'

export const vehicleTypeSchema = z.enum(['car', 'motorcycle', 'bicycle', 'other'])
export const fuelTypeSchema = z.enum(['petrol', 'diesel', 'electric', 'hybrid'])
export const transmissionTypeSchema = z.enum(['automatic', 'manual']).default('automatic')
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
  transmission: transmissionTypeSchema,
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
  transmission: transmissionTypeSchema,
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

export const maintenanceCategorySchema = z.enum([
  'fluids',
  'filters',
  'brakes',
  'tires',
  'powertrain',
  'electrical',
  'other',
])

export const createMaintenanceRuleSchema = z
  .object({
    vehicleId: z.string().uuid('Invalid vehicle ID'),
    name: z.string().trim().min(1, 'Rule name is required').max(100, 'Rule name is too long'),
    category: maintenanceCategorySchema,
    intervalDistance: z
      .coerce
      .number()
      .int()
      .positive('Interval distance must be greater than 0')
      .max(500000, 'Interval distance is too large')
      .optional()
      .nullable(),
    intervalMonths: z
      .coerce
      .number()
      .int()
      .positive('Interval months must be greater than 0')
      .max(120, 'Interval months cannot exceed 10 years')
      .optional()
      .nullable(),
    lastServiceOdometer: z
      .coerce
      .number()
      .int()
      .min(0, 'Last service odometer cannot be negative')
      .max(2000000, 'Odometer exceeds realistic bounds')
      .optional()
      .nullable(),
    lastServiceDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    isActive: z
      .preprocess((val) => val === 'true' || val === true, z.boolean())
      .optional()
      .default(true),
  })
  .refine(
    (data) =>
      (data.intervalDistance != null && data.intervalDistance > 0) ||
      (data.intervalMonths != null && data.intervalMonths > 0),
    {
      message: 'At least one interval (distance or months) must be specified',
      path: ['intervalDistance'],
    }
  )

export const updateMaintenanceRuleSchema = z
  .object({
    id: z.string().uuid('Invalid rule ID'),
    name: z.string().trim().min(1, 'Rule name is required').max(100, 'Rule name is too long'),
    category: maintenanceCategorySchema,
    intervalDistance: z
      .coerce
      .number()
      .int()
      .positive('Interval distance must be greater than 0')
      .max(500000, 'Interval distance is too large')
      .optional()
      .nullable(),
    intervalMonths: z
      .coerce
      .number()
      .int()
      .positive('Interval months must be greater than 0')
      .max(120, 'Interval months cannot exceed 10 years')
      .optional()
      .nullable(),
    lastServiceOdometer: z
      .coerce
      .number()
      .int()
      .min(0, 'Last service odometer cannot be negative')
      .max(2000000, 'Odometer exceeds realistic bounds')
      .optional()
      .nullable(),
    lastServiceDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    isActive: z
      .preprocess((val) => val === 'true' || val === true, z.boolean())
      .optional()
      .default(true),
  })
  .refine(
    (data) =>
      (data.intervalDistance != null && data.intervalDistance > 0) ||
      (data.intervalMonths != null && data.intervalMonths > 0),
    {
      message: 'At least one interval (distance or months) must be specified',
      path: ['intervalDistance'],
    }
  )

export const applyDefaultPresetsSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  baselineMode: z.enum(['current_odometer', 'zero', 'none']).default('current_odometer'),
  selectedRuleNames: z.array(z.string().trim().min(1)).optional(),
})

export const deleteMaintenanceRuleSchema = z.object({
  id: z.string().uuid('Invalid rule ID'),
})

export const toggleRuleActiveSchema = z.object({
  id: z.string().uuid('Invalid rule ID'),
  isActive: z.boolean(),
})

export const resetRuleBaselineSchema = z.object({
  id: z.string().uuid('Invalid rule ID'),
})
