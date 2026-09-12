import * as z from 'zod/mini'

export const vehicleTypeClientSchema = z.catch(
  z.enum(['car', 'motorcycle', 'bicycle', 'other']),
  'car',
)
export const fuelTypeClientSchema = z.catch(
  z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  'petrol',
)
export const transmissionTypeClientSchema = z.catch(
  z.enum(['automatic', 'manual']),
  'automatic',
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
  transmission: transmissionTypeClientSchema,
  currency: z.catch(z.string(), 'IDR'),
  vin: z.optional(z.nullable(z.string())),
  preferredCashflowId: z.optional(z.nullable(z.string())),
})

export const updateOdometerClientSchema = z.object({
  odometer: z.number(),
  confirmOdometerJump: z.optional(z.boolean()),
})

export const maintenanceCategoryClientSchema = z.catch(
  z.enum(['fluids', 'filters', 'brakes', 'tires', 'powertrain', 'electrical', 'other']),
  'other',
)

export const maintenanceRuleFormClientSchema = z.object({
  name: z.string(),
  category: maintenanceCategoryClientSchema,
  intervalDistance: z.optional(z.nullable(z.number())),
  intervalMonths: z.optional(z.nullable(z.number())),
  lastServiceOdometer: z.optional(z.nullable(z.number())),
  lastServiceDate: z.optional(z.nullable(z.string())),
  isActive: z.catch(z.boolean(), true),
})

export const serviceTypeClientSchema = z.catch(
  z.enum(['routine', 'repair', 'inspection', 'upgrade']),
  'routine',
)

export const serviceFormClientSchema = z.object({
  serviceDate: z.string(),
  odometer: z.number(),
  serviceType: serviceTypeClientSchema,
  itemsServiced: z.array(z.string()),
  servicedRuleIds: z.array(z.string()),
  cost: z.number(),
  workshopName: z.optional(z.nullable(z.string())),
  invoiceNumber: z.optional(z.nullable(z.string())),
  externalInvoiceUrl: z.optional(z.nullable(z.string())),
  notes: z.optional(z.nullable(z.string())),
  recordToCashflow: z.optional(z.boolean()),
  record_to_cashflow: z.optional(z.boolean()),
  cashflowId: z.optional(z.nullable(z.string())),
  cashflow_id: z.optional(z.nullable(z.string())),
  cashflowCategory: z.optional(z.nullable(z.string())),
  cashflow_category: z.optional(z.nullable(z.string())),
  confirmTypoJump: z.optional(z.boolean()),
})

export const vehicleDocumentTypeClientSchema = z.catch(
  z.enum(['road_tax_annual', 'registration_renewal', 'insurance', 'inspection', 'other']),
  'road_tax_annual',
)

export const vehicleDocumentFormClientSchema = z.object({
  title: z.string(),
  documentType: z.optional(vehicleDocumentTypeClientSchema),
  document_type: z.optional(vehicleDocumentTypeClientSchema),
  documentNumber: z.optional(z.nullable(z.string())),
  document_number: z.optional(z.nullable(z.string())),
  expiryDate: z.optional(z.string()),
  expiry_date: z.optional(z.string()),
  cost: z.optional(z.union([z.number(), z.string()])),
  notes: z.optional(z.nullable(z.string())),
})

export const renewDocumentClientSchema = z.object({
  preset: z.optional(z.string()),
  expiryDate: z.optional(z.string()),
  expiry_date: z.optional(z.string()),
  cost: z.optional(z.union([z.number(), z.string()])),
  renewal_cost: z.optional(z.union([z.number(), z.string()])),
  renewalCost: z.optional(z.union([z.number(), z.string()])),
  recordToCashflow: z.optional(z.boolean()),
  record_to_cashflow: z.optional(z.boolean()),
  cashflowId: z.optional(z.nullable(z.string())),
  cashflow_id: z.optional(z.nullable(z.string())),
  cashflowCategory: z.optional(z.nullable(z.string())),
  cashflow_category: z.optional(z.nullable(z.string())),
  advanceFromToday: z.optional(z.boolean()),
  advance_from_today: z.optional(z.boolean()),
  paymentDate: z.optional(z.nullable(z.string())),
  payment_date: z.optional(z.nullable(z.string())),
})

export const driverLicenseCategoryClientSchema = z.catch(
  z.enum(['car', 'motorcycle', 'commercial', 'other']),
  'car',
)

export const driverLicenseFormClientSchema = z.object({
  licenseName: z.optional(z.string()),
  license_name: z.optional(z.string()),
  title: z.optional(z.string()),
  category: driverLicenseCategoryClientSchema,
  licenseNumber: z.optional(z.nullable(z.string())),
  license_number: z.optional(z.nullable(z.string())),
  expiryDate: z.optional(z.string()),
  expiry_date: z.optional(z.string()),
  notes: z.optional(z.nullable(z.string())),
})

export const fuelLogFormClientSchema = z.object({
  logDate: z.string(),
  odometer: z.number(),
  fuelAmount: z.number(),
  pricePerUnit: z.optional(z.nullable(z.number())),
  totalCost: z.number(),
  isFullTank: z.catch(z.boolean(), true),
  isMissedPrevious: z.catch(z.boolean(), false),
  batteryStartPct: z.optional(z.nullable(z.number())),
  batteryEndPct: z.optional(z.nullable(z.number())),
  notes: z.optional(z.nullable(z.string())),
  recordToCashflow: z.optional(z.boolean()),
  cashflowId: z.optional(z.nullable(z.string())),
  cashflowCategory: z.optional(z.nullable(z.string())),
  confirmTypoJump: z.optional(z.boolean()),
})
