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

export const serviceTypeSchema = z.enum(['routine', 'repair', 'inspection', 'upgrade'])

export const createVehicleServiceSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  serviceDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  odometer: z
    .coerce
    .number()
    .int()
    .min(0, 'Odometer cannot be negative')
    .max(2000000, 'Odometer exceeds realistic bounds'),
  serviceType: serviceTypeSchema.default('routine'),
  itemsServiced: z
    .array(z.string().trim().min(1, 'Item name cannot be empty'))
    .default([]),
  servicedRuleIds: z
    .array(z.string().uuid('Invalid rule ID'))
    .default([]),
  cost: z
    .coerce
    .number()
    .min(0, 'Cost cannot be negative')
    .max(10000000000, 'Cost exceeds bounds')
    .default(0),
  workshopName: z
    .string()
    .trim()
    .max(100, 'Workshop name is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  invoiceNumber: z
    .string()
    .trim()
    .max(100, 'Invoice number is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  externalInvoiceUrl: z
    .string()
    .trim()
    .max(1000, 'URL is too long')
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true
        try {
          const u = new URL(val)
          return u.protocol === 'http:' || u.protocol === 'https:'
        } catch {
          return false
        }
      },
      { message: 'Invalid URL format (must be http:// or https://)' }
    )
    .transform((val) => (val && val.length > 0 ? val : null)),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes are too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  recordToCashflow: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
  cashflowId: z
    .string()
    .uuid('Invalid cashflow book ID')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  cashflowCategory: z
    .string()
    .trim()
    .max(100, 'Category name is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  cashflowCategoryId: z
    .string()
    .trim()
    .max(100, 'Category ID is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  confirmTypoJump: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
})

export const updateVehicleServiceSchema = z.object({
  id: z.string().uuid('Invalid service ID'),
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  cost: z
    .coerce
    .number()
    .min(0, 'Cost cannot be negative')
    .max(10000000000, 'Cost exceeds bounds')
    .optional(),
  workshopName: z
    .string()
    .trim()
    .max(100, 'Workshop name is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  invoiceNumber: z
    .string()
    .trim()
    .max(100, 'Invoice number is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  externalInvoiceUrl: z
    .string()
    .trim()
    .max(1000, 'URL is too long')
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true
        try {
          const u = new URL(val)
          return u.protocol === 'http:' || u.protocol === 'https:'
        } catch {
          return false
        }
      },
      { message: 'Invalid URL format (must be http:// or https://)' }
    )
    .transform((val) => (val && val.length > 0 ? val : null)),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes are too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
})

export const deleteVehicleServiceSchema = z.object({
  id: z.string().uuid('Invalid service ID'),
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  deleteCashflowEntry: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
})

export const vehicleDocumentTypeSchema = z.enum([
  'road_tax_annual',
  'registration_renewal',
  'insurance',
  'inspection',
  'other',
])

export const createVehicleDocumentSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title is too long'),
  documentType: vehicleDocumentTypeSchema,
  documentNumber: z
    .string()
    .trim()
    .max(100, 'Document number is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  expiryDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  cost: z
    .coerce
    .number()
    .min(0, 'Cost cannot be negative')
    .max(10000000000, 'Cost exceeds bounds')
    .default(0),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes are too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
})

export const updateVehicleDocumentSchema = z.object({
  id: z.string().uuid('Invalid document ID'),
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title is too long'),
  documentType: vehicleDocumentTypeSchema,
  documentNumber: z
    .string()
    .trim()
    .max(100, 'Document number is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  expiryDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  cost: z
    .coerce
    .number()
    .min(0, 'Cost cannot be negative')
    .max(10000000000, 'Cost exceeds bounds')
    .default(0),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes are too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
})

export const renewVehicleDocumentSchema = z
  .object({
    id: z.string().uuid('Invalid document ID'),
    vehicleId: z.string().uuid('Invalid vehicle ID'),
    preset: z.enum(['1y', '5y', '6m', 'custom']).optional().default('1y'),
    customExpiryDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
      .optional(),
    expiryDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
      .optional(),
    cost: z
      .coerce
      .number()
      .min(0, 'Cost cannot be negative')
      .max(10000000000, 'Cost exceeds bounds')
      .optional(),
    renewalCost: z
      .coerce
      .number()
      .min(0, 'Renewal cost cannot be negative')
      .max(10000000000, 'Cost exceeds bounds')
      .optional(),
    recordToCashflow: z
      .preprocess((val) => val === 'true' || val === true, z.boolean())
      .optional()
      .default(false),
    cashflowId: z
      .string()
      .uuid('Invalid cashflow book ID')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    cashflowCategory: z
      .string()
      .trim()
      .max(100, 'Category name is too long')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    cashflowCategoryId: z
      .string()
      .trim()
      .max(100, 'Category name is too long')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    advanceFromToday: z
      .preprocess((val) => val === 'true' || val === true, z.boolean())
      .optional()
      .default(false),
    paymentDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
  })
  .refine(
    (data) => {
      if (data.preset === 'custom' && !data.customExpiryDate && !data.expiryDate) {
        return false
      }
      return true
    },
    {
      message: 'Custom expiry date is required when using custom preset',
      path: ['customExpiryDate'],
    }
  )

export const deleteVehicleDocumentSchema = z.object({
  id: z.string().uuid('Invalid document ID'),
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  deleteCashflowEntry: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
})

export const driverLicenseCategorySchema = z.enum([
  'car',
  'motorcycle',
  'commercial',
  'other',
])

export const createDriverLicenseSchema = z
  .object({
    licenseName: z
      .string()
      .trim()
      .max(100, 'License name is too long')
      .optional(),
    title: z
      .string()
      .trim()
      .max(100, 'Title is too long')
      .optional(),
    category: driverLicenseCategorySchema,
    licenseNumber: z
      .string()
      .trim()
      .max(100, 'License number is too long')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    expiryDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    issueDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    notes: z
      .string()
      .trim()
      .max(2000, 'Notes are too long')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
  })
  .refine(
    (data) => Boolean((data.licenseName && data.licenseName.length > 0) || (data.title && data.title.length > 0)),
    {
      message: 'License name is required',
      path: ['licenseName'],
    }
  )

export const updateDriverLicenseSchema = z
  .object({
    id: z.string().uuid('Invalid license ID'),
    licenseName: z
      .string()
      .trim()
      .max(100, 'License name is too long')
      .optional(),
    title: z
      .string()
      .trim()
      .max(100, 'Title is too long')
      .optional(),
    category: driverLicenseCategorySchema,
    licenseNumber: z
      .string()
      .trim()
      .max(100, 'License number is too long')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    expiryDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    issueDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    notes: z
      .string()
      .trim()
      .max(2000, 'Notes are too long')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
  })
  .refine(
    (data) => Boolean((data.licenseName && data.licenseName.length > 0) || (data.title && data.title.length > 0)),
    {
      message: 'License name is required',
      path: ['licenseName'],
    }
  )

export const deleteDriverLicenseSchema = z.object({
  id: z.string().uuid('Invalid license ID'),
})

export const createVehicleFuelLogSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  logDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  odometer: z
    .coerce
    .number({ message: 'Odometer reading must be a valid number' })
    .int('Odometer must be an integer')
    .min(0, 'Odometer cannot be negative')
    .max(2000000, 'Odometer value exceeds realistic bounds (max 2,000,000)'),
  fuelAmount: z
    .coerce
    .number({ message: 'Fuel volume must be a valid number' })
    .min(0.01, 'Fuel volume must be greater than 0')
    .max(10000, 'Fuel volume exceeds maximum limit'),
  pricePerUnit: z
    .coerce
    .number()
    .min(0, 'Price per unit cannot be negative')
    .max(1000000000, 'Price per unit exceeds bounds')
    .optional()
    .nullable(),
  totalCost: z
    .coerce
    .number({ message: 'Total cost must be a valid number' })
    .min(0, 'Total cost cannot be negative')
    .max(10000000000, 'Total cost exceeds bounds'),
  isFullTank: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .default(true),
  isMissedPrevious: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .default(false),
  batteryStartPct: z
    .coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .nullable(),
  batteryEndPct: z
    .coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes are too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  confirmTypoJump: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
  // Cashflow sync
  recordToCashflow: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
  cashflowId: z
    .string()
    .uuid('Invalid cashflow book ID')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  cashflowCategory: z
    .string()
    .trim()
    .max(100, 'Category name is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  cashflowCategoryId: z
    .string()
    .trim()
    .max(100, 'Category name is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
})

export const updateVehicleFuelLogSchema = createVehicleFuelLogSchema.extend({
  id: z.string().uuid('Invalid fuel log ID'),
})

export const deleteVehicleFuelLogSchema = z.object({
  id: z.string().uuid('Invalid fuel log ID'),
})

export const syncMaintenanceRuleToListSchema = z.object({
  listId: z.string().uuid('Invalid list ID'),
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  ruleName: z.string().trim().min(1, 'Rule name is required'),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  notes: z.string().trim().optional().nullable(),
})
