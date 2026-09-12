'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getAuthenticatedUserWithRateLimit } from '@/lib/auth-with-rate-limit'
import type { Database } from '@/types/supabase'
import type {
  VehicleDTO,
  VehicleMonthlyOdometerDTO,
  VehicleMaintenanceRuleDTO,
  VehicleServiceDTO,
  VehicleDocumentDTO,
  DriverLicenseDTO,
  VehicleFuelLogDTO,
  ServiceType,
  MaintenanceCategory,
  VehicleDocumentType,
  DriverLicenseCategory,
  VehicleType,
  FuelType,
  TransmissionType,
  OdometerUnit,
} from '@/types/dto'
import {
  createVehicleSchema,
  updateVehicleSchema,
  toggleArchiveVehicleSchema,
  deleteVehicleSchema,
  setDefaultVehicleSchema,
  updateOdometerSchema,
  createMaintenanceRuleSchema,
  updateMaintenanceRuleSchema,
  deleteMaintenanceRuleSchema,
  toggleRuleActiveSchema,
  resetRuleBaselineSchema,
  applyDefaultPresetsSchema,
  createVehicleServiceSchema,
  updateVehicleServiceSchema,
  deleteVehicleServiceSchema,
  createVehicleDocumentSchema,
  updateVehicleDocumentSchema,
  renewVehicleDocumentSchema,
  deleteVehicleDocumentSchema,
  createDriverLicenseSchema,
  updateDriverLicenseSchema,
  deleteDriverLicenseSchema,
  createVehicleFuelLogSchema,
  updateVehicleFuelLogSchema,
  deleteVehicleFuelLogSchema,
  syncMaintenanceRuleToListSchema,
} from './schemas.server'
import { isOdometerTypoJump } from './lib/odometer'
import { getDefaultRulesForVehicle } from './lib/presets'
import { advanceExpiryDate } from './lib/document-math'
import {
  computeNewLogEconomy,
  recalculateFuelEconomySequence,
  getFuelUnitLabels,
} from './lib/fuel-math'
import {
  isMaintenanceCategory,
  isServiceType,
  isVehicleDocumentType,
  isDriverLicenseCategory,
  isFuelType,
  isOdometerUnit,
} from './types'
import { createNotification } from '@/features/notifications/server-utils'

type VehicleRow = Database['public']['Tables']['vehicles']['Row']
type MonthlyOdoRow = Database['public']['Tables']['vehicle_monthly_odometers']['Row']
type RuleRow = Database['public']['Tables']['vehicle_maintenance_rules']['Row']
type ServiceRow = Database['public']['Tables']['vehicle_services']['Row']
type DocumentRow = Database['public']['Tables']['vehicle_documents']['Row']
type LicenseRow = Database['public']['Tables']['driver_licenses']['Row']
type FuelLogRow = Database['public']['Tables']['vehicle_fuel_logs']['Row']

function mapFuelLogRowToDTO(row: FuelLogRow): VehicleFuelLogDTO {
  return {
    id: row.id,
    user_id: row.user_id,
    vehicle_id: row.vehicle_id,
    log_date: row.log_date,
    odometer: Number(row.odometer),
    fuel_amount: Number(row.fuel_amount),
    price_per_unit: row.price_per_unit !== null ? Number(row.price_per_unit) : null,
    total_cost: Number(row.total_cost) || 0,
    is_full_tank: Boolean(row.is_full_tank),
    is_missed_previous: Boolean(row.is_missed_previous),
    battery_start_pct: row.battery_start_pct,
    battery_end_pct: row.battery_end_pct,
    calculated_kml: row.calculated_kml !== null ? Number(row.calculated_kml) : null,
    notes: row.notes,
    cashflow_entry_id: row.cashflow_entry_id || null,
    created_at: row.created_at,
  }
}

function mapDocumentRowToDTO(row: DocumentRow): VehicleDocumentDTO {
  const documentType: VehicleDocumentType = isVehicleDocumentType(row.document_type)
    ? row.document_type
    : 'other'

  return {
    id: row.id,
    user_id: row.user_id,
    vehicle_id: row.vehicle_id,
    title: row.title,
    document_type: documentType,
    document_number: row.document_number,
    expiry_date: row.expiry_date,
    cost: Number(row.cost) || 0,
    notes: row.notes,
    cashflow_entry_id: row.cashflow_entry_id || null,
    created_at: row.created_at,
  }
}

function mapLicenseRowToDTO(row: LicenseRow): DriverLicenseDTO {
  const category: DriverLicenseCategory = isDriverLicenseCategory(row.category)
    ? row.category
    : 'other'

  return {
    id: row.id,
    user_id: row.user_id,
    license_name: row.license_name,
    category,
    license_number: row.license_number,
    expiry_date: row.expiry_date,
    notes: row.notes,
    created_at: row.created_at,
  }
}

function mapVehicleServiceRowToDTO(row: ServiceRow): VehicleServiceDTO {
  const serviceType: ServiceType = isServiceType(row.service_type)
    ? row.service_type
    : 'routine'

  return {
    id: row.id,
    user_id: row.user_id,
    vehicle_id: row.vehicle_id,
    service_date: row.service_date,
    odometer: Number(row.odometer),
    service_type: serviceType,
    items_serviced: Array.isArray(row.items_serviced) ? row.items_serviced : [],
    serviced_rule_ids: Array.isArray(row.serviced_rule_ids) ? row.serviced_rule_ids : [],
    cost: Number(row.cost) || 0,
    workshop_name: row.workshop_name,
    invoice_number: row.invoice_number,
    external_invoice_url: row.external_invoice_url,
    notes: row.notes,
    cashflow_entry_id: row.cashflow_entry_id || null,
    created_at: row.created_at,
  }
}

function mapRuleRowToDTO(row: RuleRow): VehicleMaintenanceRuleDTO {
  const category: MaintenanceCategory = isMaintenanceCategory(row.category)
    ? row.category
    : 'other'

  return {
    id: row.id,
    vehicle_id: row.vehicle_id,
    name: row.name,
    category,
    interval_distance: row.interval_distance,
    interval_months: row.interval_months,
    last_service_odometer: row.last_service_odometer,
    last_service_date: row.last_service_date,
    is_active: row.is_active,
    created_at: row.created_at,
  }
}

function mapVehicleRowToDTO(row: VehicleRow): VehicleDTO {
  const type: VehicleType =
    row.type === 'car' || row.type === 'motorcycle' || row.type === 'bicycle' || row.type === 'other'
      ? row.type
      : 'other'

  const fuelType: FuelType =
    row.fuel_type === 'petrol' || row.fuel_type === 'diesel' || row.fuel_type === 'electric' || row.fuel_type === 'hybrid'
      ? row.fuel_type
      : 'petrol'

  const transmission: TransmissionType =
    row.transmission === 'manual' ? 'manual' : 'automatic'

  const odometerUnit: OdometerUnit =
    row.odometer_unit === 'miles' ? 'miles' : 'km'

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type,
    license_plate: row.license_plate,
    year: row.year,
    is_default: row.is_default,
    current_odometer: row.current_odometer,
    odometer_unit: odometerUnit,
    estimated_monthly_km: row.estimated_monthly_km,
    fuel_type: fuelType,
    transmission,
    currency: row.currency,
    is_archived: row.is_archived,
    vin: row.vin,
    preferred_cashflow_id: row.preferred_cashflow_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function mapMonthlyOdoRowToDTO(row: MonthlyOdoRow): VehicleMonthlyOdometerDTO {
  return {
    id: row.id,
    vehicle_id: row.vehicle_id,
    year_month: row.year_month,
    odometer: row.odometer,
    updated_at: row.updated_at,
  }
}

function getCurrentYearMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Loads all vehicles for the authenticated user.
 */
export async function getVehicles(includeArchived = false): Promise<{
  success: boolean
  data: VehicleDTO[]
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const supabase = await createClient()

    let query = supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false })

    if (!includeArchived) {
      query = query.eq('is_archived', false)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, data: [], error: error.message }
    }

    const dtos: VehicleDTO[] = (data || []).map(mapVehicleRowToDTO)
    return { success: true, data: dtos }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load vehicles'
    return { success: false, data: [], error: message }
  }
}

/**
 * Loads a single vehicle and its rolling 6-month monthly odometer snapshots.
 */
export async function getVehicleById(vehicleId: string): Promise<{
  success: boolean
  vehicle?: VehicleDTO
  monthlyOdometers?: VehicleMonthlyOdometerDTO[]
  maintenanceRules?: VehicleMaintenanceRuleDTO[]
  services?: VehicleServiceDTO[]
  documents?: VehicleDocumentDTO[]
  fuelLogs?: VehicleFuelLogDTO[]
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const supabase = await createClient()

    const [vehicleRes, monthlyRes, rulesRes, servicesRes, docsRes, fuelRes] = await Promise.all([
      supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('vehicle_monthly_odometers')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .eq('user_id', user.id)
        .order('year_month', { ascending: false })
        .limit(6),
      supabase
        .from('vehicle_maintenance_rules')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .eq('user_id', user.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .from('vehicle_services')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .eq('user_id', user.id)
        .order('service_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('vehicle_documents')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .eq('user_id', user.id)
        .order('expiry_date', { ascending: true }),
      supabase
        .from('vehicle_fuel_logs')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false }),
    ])

    if (vehicleRes.error || !vehicleRes.data) {
      return { success: false, error: 'Vehicle not found or unauthorized' }
    }

    const vehicle = mapVehicleRowToDTO(vehicleRes.data)
    const monthlyOdometers = (monthlyRes.data || []).map(mapMonthlyOdoRowToDTO)
    const maintenanceRules = (rulesRes.data || []).map(mapRuleRowToDTO)
    const services = (servicesRes.data || []).map(mapVehicleServiceRowToDTO)
    const documents = (docsRes.data || []).map(mapDocumentRowToDTO)
    const fuelLogs = (fuelRes.data || []).map(mapFuelLogRowToDTO)

    return {
      success: true,
      vehicle,
      monthlyOdometers,
      maintenanceRules,
      services,
      documents,
      fuelLogs,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch vehicle'
    return { success: false, error: message }
  }
}

/**
 * Creates a new vehicle and initial monthly odometer snapshot.
 */
export async function createVehicle(rawInput: unknown): Promise<{
  success: boolean
  data?: VehicleDTO
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = createVehicleSchema.parse(rawInput)
    const supabase = await createClient()

    // If marked default, unset any existing default vehicle
    if (validated.isDefault) {
      await supabase
        .from('vehicles')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)
    }

    const { data: vehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert({
        user_id: user.id,
        name: validated.name,
        type: validated.type,
        license_plate: validated.licensePlate,
        year: validated.year,
        is_default: validated.isDefault,
        current_odometer: validated.currentOdometer,
        odometer_unit: validated.odometerUnit,
        estimated_monthly_km: validated.estimatedMonthlyKm,
        fuel_type: validated.fuelType,
        transmission: validated.transmission,
        currency: validated.currency,
        vin: validated.vin,
        preferred_cashflow_id: validated.preferredCashflowId,
      })
      .select()
      .single()

    if (insertError || !vehicle) {
      return { success: false, error: insertError?.message || 'Failed to create vehicle' }
    }

    // Record initial rolling monthly odometer snapshot for current month
    const currentMonth = getCurrentYearMonth()
    await supabase.from('vehicle_monthly_odometers').upsert(
      {
        user_id: user.id,
        vehicle_id: vehicle.id,
        year_month: currentMonth,
        odometer: validated.currentOdometer,
      },
      { onConflict: 'vehicle_id,year_month' },
    )

    revalidatePath('/garage', 'page')

    return { success: true, data: mapVehicleRowToDTO(vehicle) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create vehicle'
    return { success: false, error: message }
  }
}

/**
 * Updates vehicle profile with fat-finger typo guard and monthly snapshot cascade.
 */
export async function updateVehicle(rawInput: unknown): Promise<{
  success: boolean
  data?: VehicleDTO
  error?: string
  isTypoWarning?: boolean
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = updateVehicleSchema.parse(rawInput)
    const supabase = await createClient()

    // Fetch existing vehicle to check previous state and authorization
    const { data: existing, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Vehicle not found' }
    }

    // Fat-Finger Odometer Typo Guard:
    // If odometer increases by > 3,000 in a single manual edit and wasn't explicitly confirmed
    if (
      !validated.confirmOdometerJump &&
      isOdometerTypoJump(validated.currentOdometer, existing.current_odometer, 3000)
    ) {
      const jumpDelta = validated.currentOdometer - existing.current_odometer
      return {
        success: false,
        isTypoWarning: true,
        error: `You entered an odometer jump of ${jumpDelta} ${validated.odometerUnit}. Please confirm this reading.`,
      }
    }

    // If marked default, unset any other default
    if (validated.isDefault && !existing.is_default) {
      await supabase
        .from('vehicles')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)
    }

    const { data: updated, error: updateError } = await supabase
      .from('vehicles')
      .update({
        name: validated.name,
        type: validated.type,
        license_plate: validated.licensePlate,
        year: validated.year,
        is_default: validated.isDefault,
        current_odometer: validated.currentOdometer,
        odometer_unit: validated.odometerUnit,
        estimated_monthly_km: validated.estimatedMonthlyKm,
        fuel_type: validated.fuelType,
        transmission: validated.transmission,
        currency: validated.currency,
        vin: validated.vin,
        preferred_cashflow_id: validated.preferredCashflowId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !updated) {
      return { success: false, error: updateError?.message || 'Failed to update vehicle' }
    }

    // Atomically cascade manual odometer override to current month's row in vehicle_monthly_odometers
    // This ensures velocity calculations remain coherent
    const currentMonth = getCurrentYearMonth()
    await supabase.from('vehicle_monthly_odometers').upsert(
      {
        user_id: user.id,
        vehicle_id: updated.id,
        year_month: currentMonth,
        odometer: validated.currentOdometer,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'vehicle_id,year_month' },
    )

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${validated.id}`, 'page')

    return { success: true, data: mapVehicleRowToDTO(updated) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update vehicle'
    return { success: false, error: message }
  }
}

/**
 * Toggles archival status of a vehicle.
 */
export async function toggleArchiveVehicle(rawInput: unknown): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = toggleArchiveVehicleSchema.parse(rawInput)
    const supabase = await createClient()

    // If archiving a vehicle that was default, remove default flag
    const updatePayload: { is_archived: boolean; is_default?: boolean; updated_at: string } = {
      is_archived: validated.isArchived,
      updated_at: new Date().toISOString(),
    }
    if (validated.isArchived) {
      updatePayload.is_default = false
    }

    const { error } = await supabase
      .from('vehicles')
      .update(updatePayload)
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${validated.id}`, 'page')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to archive vehicle'
    return { success: false, error: message }
  }
}

/**
 * Sets a vehicle as the default vehicle.
 */
export async function setDefaultVehicle(rawInput: unknown): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = setDefaultVehicleSchema.parse(rawInput)
    const supabase = await createClient()

    // Unset all existing defaults
    await supabase
      .from('vehicles')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true)

    // Set selected vehicle as default
    const { error } = await supabase
      .from('vehicles')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${validated.id}`, 'page')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to set default vehicle'
    return { success: false, error: message }
  }
}

/**
 * Permanently deletes a vehicle and cascading child records.
 */
export async function deleteVehicle(rawInput: unknown): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = deleteVehicleSchema.parse(rawInput)
    const supabase = await createClient()

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/garage', 'page')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete vehicle'
    return { success: false, error: message }
  }
}

/**
 * Updates only the current odometer reading of a vehicle.
 * Atomically updates vehicles.current_odometer and upserts
 * the current month snapshot in vehicle_monthly_odometers.
 */
export async function updateOdometer(rawInput: unknown): Promise<{
  success: boolean
  data?: VehicleDTO
  isTypoWarning?: boolean
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = updateOdometerSchema.parse(rawInput)
    const supabase = await createClient()

    // Fetch existing vehicle to check previous reading and ownership
    const { data: existing, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', validated.vehicleId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Vehicle not found' }
    }

    // Fat-Finger Odometer Typo Guard:
    // If odometer increases by > 3,000 in a single update and wasn't explicitly confirmed
    if (
      !validated.confirmOdometerJump &&
      isOdometerTypoJump(validated.odometer, existing.current_odometer, 3000)
    ) {
      const jumpDelta = validated.odometer - existing.current_odometer
      return {
        success: false,
        isTypoWarning: true,
        error: `You entered an odometer jump of ${jumpDelta.toLocaleString()} ${existing.odometer_unit}. Please confirm this reading.`,
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('vehicles')
      .update({
        current_odometer: validated.odometer,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.vehicleId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !updated) {
      return { success: false, error: updateError?.message || 'Failed to update odometer' }
    }

    // Atomically cascade manual odometer update to current month's row in vehicle_monthly_odometers
    const currentMonth = getCurrentYearMonth()
    await supabase.from('vehicle_monthly_odometers').upsert(
      {
        user_id: user.id,
        vehicle_id: updated.id,
        year_month: currentMonth,
        odometer: validated.odometer,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'vehicle_id,year_month' },
    )

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${validated.vehicleId}`, 'page')

    return { success: true, data: mapVehicleRowToDTO(updated) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update odometer'
    return { success: false, error: message }
  }
}

/**
 * Loads available cashflow books for sticky memory selector.
 */
export async function getUserCashflowBooks(): Promise<{
  success: boolean
  data: { id: string; title: string; currency: string }[]
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cashflows')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('title', { ascending: true })

    if (error) {
      return { success: false, data: [], error: error.message }
    }

    const books = (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      currency: 'IDR',
    }))

    return { success: true, data: books }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load cashflow books'
    return { success: false, data: [], error: message }
  }
}

/**
 * Loads all maintenance rules for a vehicle.
 */
export async function getMaintenanceRules(vehicleId: string): Promise<{
  success: boolean
  data: VehicleMaintenanceRuleDTO[]
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('vehicle_maintenance_rules')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('user_id', user.id)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: (data || []).map(mapRuleRowToDTO) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch maintenance rules'
    return { success: false, data: [], error: message }
  }
}

/**
 * Creates a new custom maintenance rule for a vehicle.
 */
export async function createMaintenanceRule(rawInput: unknown): Promise<{
  success: boolean
  data?: VehicleMaintenanceRuleDTO
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = createMaintenanceRuleSchema.parse(rawInput)
    const supabase = await createClient()

    // Verify vehicle ownership
    const { data: vehicle, error: vehicleErr } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', validated.vehicleId)
      .eq('user_id', user.id)
      .single()

    if (vehicleErr || !vehicle) {
      return { success: false, error: 'Vehicle not found or unauthorized' }
    }

    const { data: rule, error: ruleErr } = await supabase
      .from('vehicle_maintenance_rules')
      .insert({
        user_id: user.id,
        vehicle_id: validated.vehicleId,
        name: validated.name,
        category: validated.category,
        interval_distance: validated.intervalDistance ?? null,
        interval_months: validated.intervalMonths ?? null,
        last_service_odometer: validated.lastServiceOdometer ?? null,
        last_service_date: validated.lastServiceDate ?? null,
        is_active: validated.isActive,
      })
      .select()
      .single()

    if (ruleErr || !rule) {
      return { success: false, error: ruleErr?.message || 'Failed to create rule' }
    }

    revalidatePath(`/garage/${validated.vehicleId}`, 'page')
    return { success: true, data: mapRuleRowToDTO(rule) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create maintenance rule'
    return { success: false, error: message }
  }
}

/**
 * Updates an existing maintenance rule.
 */
export async function updateMaintenanceRule(rawInput: unknown): Promise<{
  success: boolean
  data?: VehicleMaintenanceRuleDTO
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = updateMaintenanceRuleSchema.parse(rawInput)
    const supabase = await createClient()

    const { data: updated, error: updateErr } = await supabase
      .from('vehicle_maintenance_rules')
      .update({
        name: validated.name,
        category: validated.category,
        interval_distance: validated.intervalDistance ?? null,
        interval_months: validated.intervalMonths ?? null,
        last_service_odometer: validated.lastServiceOdometer ?? null,
        last_service_date: validated.lastServiceDate ?? null,
        is_active: validated.isActive,
      })
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateErr || !updated) {
      return { success: false, error: updateErr?.message || 'Failed to update rule' }
    }

    revalidatePath(`/garage/${updated.vehicle_id}`, 'page')
    return { success: true, data: mapRuleRowToDTO(updated) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update maintenance rule'
    return { success: false, error: message }
  }
}

/**
 * Deletes a maintenance rule.
 */
export async function deleteMaintenanceRule(ruleId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = deleteMaintenanceRuleSchema.parse({ id: ruleId })
    const supabase = await createClient()

    // Fetch rule first to find vehicle_id for revalidation
    const { data: rule } = await supabase
      .from('vehicle_maintenance_rules')
      .select('vehicle_id')
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .single()

    const { error } = await supabase
      .from('vehicle_maintenance_rules')
      .delete()
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    if (rule?.vehicle_id) {
      revalidatePath(`/garage/${rule.vehicle_id}`, 'page')
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete maintenance rule'
    return { success: false, error: message }
  }
}

/**
 * Toggles a rule active/inactive.
 */
export async function toggleRuleActive(
  ruleId: string,
  isActive: boolean
): Promise<{
  success: boolean
  data?: VehicleMaintenanceRuleDTO
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = toggleRuleActiveSchema.parse({ id: ruleId, isActive })
    const supabase = await createClient()

    const { data: updated, error } = await supabase
      .from('vehicle_maintenance_rules')
      .update({ is_active: validated.isActive })
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !updated) {
      return { success: false, error: error?.message || 'Failed to toggle rule' }
    }

    revalidatePath(`/garage/${updated.vehicle_id}`, 'page')
    return { success: true, data: mapRuleRowToDTO(updated) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to toggle rule'
    return { success: false, error: message }
  }
}

/**
 * Resets a rule's baseline to the vehicle's current odometer reading and today's date.
 */
export async function resetRuleBaseline(ruleId: string): Promise<{
  success: boolean
  data?: VehicleMaintenanceRuleDTO
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = resetRuleBaselineSchema.parse({ id: ruleId })
    const supabase = await createClient()

    // Fetch rule with associated vehicle's current odometer
    const { data: rule, error: ruleErr } = await supabase
      .from('vehicle_maintenance_rules')
      .select('id, vehicle_id')
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .single()

    if (ruleErr || !rule) {
      return { success: false, error: 'Rule not found or unauthorized' }
    }

    const { data: vehicle, error: vehicleErr } = await supabase
      .from('vehicles')
      .select('current_odometer')
      .eq('id', rule.vehicle_id)
      .eq('user_id', user.id)
      .single()

    if (vehicleErr || !vehicle) {
      return { success: false, error: 'Vehicle not found' }
    }

    const todayDate = new Date().toISOString().split('T')[0]
    const { data: updated, error: updateErr } = await supabase
      .from('vehicle_maintenance_rules')
      .update({
        last_service_odometer: vehicle.current_odometer,
        last_service_date: todayDate,
      })
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateErr || !updated) {
      return { success: false, error: updateErr?.message || 'Failed to reset rule baseline' }
    }

    revalidatePath(`/garage/${rule.vehicle_id}`, 'page')
    return { success: true, data: mapRuleRowToDTO(updated) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reset baseline'
    return { success: false, error: message }
  }
}

/**
 * Pre-populates recommended maintenance checklist presets for a vehicle.
 * Implements intelligent upsert: updates existing matching rules by name, inserts new ones, preventing duplicates.
 */
export async function applyDefaultMaintenancePresets(rawInput: unknown): Promise<{
  success: boolean
  count?: number
  createdCount?: number
  updatedCount?: number
  data?: VehicleMaintenanceRuleDTO[]
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = applyDefaultPresetsSchema.parse(rawInput)
    const supabase = await createClient()

    // Fetch vehicle profile
    const { data: vehicleRow, error: vehicleErr } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', validated.vehicleId)
      .eq('user_id', user.id)
      .single()

    if (vehicleErr || !vehicleRow) {
      return { success: false, error: 'Vehicle not found or unauthorized' }
    }

    const vehicle = mapVehicleRowToDTO(vehicleRow)
    const allPresets = getDefaultRulesForVehicle(
      vehicle.type,
      vehicle.fuel_type,
      vehicle.odometer_unit,
      vehicle.transmission,
    )

    // Filter presets if specific names were selected
    const selectedNames = validated.selectedRuleNames
      ? new Set(validated.selectedRuleNames)
      : null

    const presetsToApply = selectedNames
      ? allPresets.filter((p) => selectedNames.has(p.name))
      : allPresets.filter((p) => p.isRecommended !== false)

    if (presetsToApply.length === 0) {
      return { success: false, error: 'No preset items selected' }
    }

    // Fetch existing rules for this vehicle to detect collisions
    const { data: existingRows, error: existingErr } = await supabase
      .from('vehicle_maintenance_rules')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .eq('user_id', user.id)

    if (existingErr) {
      return { success: false, error: existingErr.message || 'Failed to query existing rules' }
    }

    const existingMap = new Map<string, RuleRow>()
    for (const row of existingRows || []) {
      const key = row.name.trim().toLowerCase()
      if (!existingMap.has(key)) {
        existingMap.set(key, row)
      }
    }

    const todayDate = new Date().toISOString().split('T')[0]
    let baselineOdo: number | null = null
    let baselineDate: string | null = null

    if (validated.baselineMode === 'current_odometer') {
      baselineOdo = vehicle.current_odometer
      baselineDate = todayDate
    } else if (validated.baselineMode === 'zero') {
      baselineOdo = 0
      baselineDate = null
    }

    const rowsToInsert: Array<{
      user_id: string
      vehicle_id: string
      name: string
      category: MaintenanceCategory
      interval_distance: number | null
      interval_months: number | null
      last_service_odometer: number | null
      last_service_date: string | null
      is_active: boolean
    }> = []

    const itemsToUpdate: Array<{
      id: string
      patch: {
        name: string
        category: MaintenanceCategory
        interval_distance: number | null
        interval_months: number | null
        last_service_odometer?: number | null
        last_service_date?: string | null
        is_active: boolean
      }
    }> = []

    for (const preset of presetsToApply) {
      const key = preset.name.trim().toLowerCase()
      const existing = existingMap.get(key)

      if (existing) {
        const patch: {
          name: string
          category: MaintenanceCategory
          interval_distance: number | null
          interval_months: number | null
          last_service_odometer?: number | null
          last_service_date?: string | null
          is_active: boolean
        } = {
          name: preset.name,
          category: preset.category,
          interval_distance: preset.intervalDistance,
          interval_months: preset.intervalMonths,
          is_active: true,
        }

        // Apply baseline update according to selected mode
        if (validated.baselineMode === 'current_odometer') {
          patch.last_service_odometer = vehicle.current_odometer
          patch.last_service_date = todayDate
        } else if (validated.baselineMode === 'zero') {
          patch.last_service_odometer = 0
          patch.last_service_date = null
        }
        // If baselineMode === 'none', we intentionally retain existing past service history

        itemsToUpdate.push({ id: existing.id, patch })
      } else {
        rowsToInsert.push({
          user_id: user.id,
          vehicle_id: vehicle.id,
          name: preset.name,
          category: preset.category,
          interval_distance: preset.intervalDistance,
          interval_months: preset.intervalMonths,
          last_service_odometer: baselineOdo,
          last_service_date: baselineDate,
          is_active: true,
        })
      }
    }

    const resultRows: RuleRow[] = []

    // 1. Bulk insert brand new items
    if (rowsToInsert.length > 0) {
      const { data: insertedRows, error: insertErr } = await supabase
        .from('vehicle_maintenance_rules')
        .insert(rowsToInsert)
        .select()

      if (insertErr || !insertedRows) {
        return { success: false, error: insertErr?.message || 'Failed to insert presets' }
      }
      resultRows.push(...insertedRows)
    }

    // 2. Parallel updates for existing items
    if (itemsToUpdate.length > 0) {
      const updatePromises = itemsToUpdate.map(async ({ id, patch }) => {
        return supabase
          .from('vehicle_maintenance_rules')
          .update(patch)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single()
      })

      const updateResults = await Promise.all(updatePromises)
      for (const res of updateResults) {
        if (res.error || !res.data) {
          return { success: false, error: res.error?.message || 'Failed to update existing preset rules' }
        }
        resultRows.push(res.data)
      }
    }

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${vehicle.id}`, 'page')

    return {
      success: true,
      count: resultRows.length,
      createdCount: rowsToInsert.length,
      updatedCount: itemsToUpdate.length,
      data: resultRows.map(mapRuleRowToDTO),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to apply presets'
    return { success: false, error: message }
  }
}

/**
 * Fetches all service and maintenance history records for a vehicle.
 */
export async function getVehicleServices(vehicleId: string): Promise<{
  success: boolean
  data?: VehicleServiceDTO[]
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('vehicle_services')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('user_id', user.id)
      .order('service_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: (data || []).map(mapVehicleServiceRowToDTO) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch vehicle services'
    return { success: false, data: [], error: message }
  }
}

/**
 * Records a vehicle service log:
 * 1. Inserts row into vehicle_services
 * 2. Forward-only update of vehicle.current_odometer
 * 3. Upserts vehicle_monthly_odometers for service month
 * 4. Advances last_service_odometer & last_service_date on matching serviced rules
 */
export async function createVehicleService(rawInput: unknown): Promise<{
  success: boolean
  data?: VehicleServiceDTO
  error?: string
  warning?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = createVehicleServiceSchema.parse(rawInput)
    const supabase = await createClient()

    // 1. Verify vehicle ownership
    const { data: vehicle, error: vehicleErr } = await supabase
      .from('vehicles')
      .select('id, name, license_plate, current_odometer')
      .eq('id', validated.vehicleId)
      .eq('user_id', user.id)
      .single()

    if (vehicleErr || !vehicle) {
      return { success: false, error: 'Vehicle not found or unauthorized' }
    }

    // 1b. Typo Jump Guard (protect against accidental jumps like 450,000 instead of 45,000)
    if (
      isOdometerTypoJump(validated.odometer, vehicle.current_odometer, 3000) &&
      !validated.confirmTypoJump
    ) {
      return {
        success: false,
        error: `Odometer jump exceeds 3,000. Please confirm if this is intentional.`,
      }
    }

    // 2. Insert service record
    const { data: service, error: serviceErr } = await supabase
      .from('vehicle_services')
      .insert({
        user_id: user.id,
        vehicle_id: validated.vehicleId,
        service_date: validated.serviceDate,
        odometer: validated.odometer,
        service_type: validated.serviceType,
        items_serviced: validated.itemsServiced,
        serviced_rule_ids: validated.servicedRuleIds,
        cost: validated.cost,
        workshop_name: validated.workshopName,
        invoice_number: validated.invoiceNumber,
        external_invoice_url: validated.externalInvoiceUrl,
        notes: validated.notes,
      })
      .select()
      .single()

    if (serviceErr || !service) {
      return { success: false, error: serviceErr?.message || 'Failed to record service log' }
    }

    // 3. Forward-only vehicle current odometer update
    if (validated.odometer > vehicle.current_odometer) {
      await supabase
        .from('vehicles')
        .update({
          current_odometer: validated.odometer,
          updated_at: new Date().toISOString(),
        })
        .eq('id', validated.vehicleId)
        .eq('user_id', user.id)
    }

    // 4. Upsert monthly odometer snapshot for service month
    const serviceYearMonth = validated.serviceDate.slice(0, 7)
    const { data: existingMonthly } = await supabase
      .from('vehicle_monthly_odometers')
      .select('id, odometer')
      .eq('vehicle_id', validated.vehicleId)
      .eq('year_month', serviceYearMonth)
      .maybeSingle()

    if (!existingMonthly) {
      await supabase
        .from('vehicle_monthly_odometers')
        .insert({
          user_id: user.id,
          vehicle_id: validated.vehicleId,
          year_month: serviceYearMonth,
          odometer: validated.odometer,
        })
    } else if (validated.odometer > existingMonthly.odometer) {
      await supabase
        .from('vehicle_monthly_odometers')
        .update({
          odometer: validated.odometer,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMonthly.id)
        .eq('user_id', user.id)
    }

    // 5. Forward-only advance of serviced maintenance rules (prevent historical time-machine rewinds)
    if (validated.servicedRuleIds && validated.servicedRuleIds.length > 0) {
      const { data: existingRules } = await supabase
        .from('vehicle_maintenance_rules')
        .select('id, last_service_odometer, last_service_date')
        .in('id', validated.servicedRuleIds)
        .eq('vehicle_id', validated.vehicleId)
        .eq('user_id', user.id)

      for (const rule of existingRules || []) {
        const patch: { last_service_odometer?: number; last_service_date?: string } = {}

        const shouldAdvanceOdo =
          rule.last_service_odometer === null || validated.odometer >= rule.last_service_odometer
        if (shouldAdvanceOdo) {
          patch.last_service_odometer = validated.odometer
        }

        const shouldAdvanceDate =
          !rule.last_service_date || validated.serviceDate >= rule.last_service_date
        if (shouldAdvanceDate) {
          patch.last_service_date = validated.serviceDate
        }

        if (Object.keys(patch).length > 0) {
          await supabase
            .from('vehicle_maintenance_rules')
            .update(patch)
            .eq('id', rule.id)
            .eq('vehicle_id', validated.vehicleId)
            .eq('user_id', user.id)
        }
      }
    }

    // 6. Optional Cashflow Ledger Sync
    let savedService = service
    let syncWarning: string | undefined = undefined
    if (
      validated.recordToCashflow &&
      validated.cashflowId &&
      validated.cost &&
      validated.cost > 0
    ) {
      const vehicleLabel = `${vehicle.name}${vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}`
      const desc = `Service: ${validated.serviceType.toUpperCase()} - ${vehicleLabel}`

      const { data: cfData, error: cfError } = await supabase
        .from('cashflow_entries')
        .insert({
          cashflow_id: validated.cashflowId,
          amount: validated.cost,
          type: 'expense',
          category: validated.cashflowCategoryId || validated.cashflowCategory || 'transport',
          description: desc,
          date: validated.serviceDate,
          tags: ['garage', 'service', validated.serviceType],
        })
        .select('id')
        .single()

      if (cfError) {
        console.error('[Garage] Failed to sync service to cashflow:', cfError.message)
        syncWarning = `Service recorded, but failed to sync to Cashflow: ${cfError.message}`
      } else if (cfData) {
        // Link cashflow_entry_id to vehicle_services row
        const { data: updatedService } = await supabase
          .from('vehicle_services')
          .update({ cashflow_entry_id: cfData.id })
          .eq('id', service.id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (updatedService) {
          savedService = updatedService
        }
        revalidatePath(`/cashflow/${validated.cashflowId}`)
      }
    }

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${validated.vehicleId}`, 'page')

    return {
      success: true,
      data: mapVehicleServiceRowToDTO(savedService),
      warning: syncWarning,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to record service log'
    return { success: false, error: message }
  }
}

/**
 * Deletes a vehicle service record with user ownership validation.
 * Optionally cascades deletion to linked Cashflow expense entry.
 */
export async function deleteVehicleService(rawInput: unknown): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = deleteVehicleServiceSchema.parse(rawInput)
    const supabase = await createClient()

    // Fetch existing service to verify ownership and check for linked cashflow entry
    const { data: existingService } = await supabase
      .from('vehicle_services')
      .select('id, cashflow_entry_id')
      .eq('id', validated.id)
      .eq('vehicle_id', validated.vehicleId)
      .eq('user_id', user.id)
      .maybeSingle()

    const { error } = await supabase
      .from('vehicle_services')
      .delete()
      .eq('id', validated.id)
      .eq('vehicle_id', validated.vehicleId)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Cascade delete linked cashflow expense if requested
    if (validated.deleteCashflowEntry && existingService?.cashflow_entry_id) {
      const { error: cfDelErr } = await supabase
        .from('cashflow_entries')
        .delete()
        .eq('id', existingService.cashflow_entry_id)

      if (cfDelErr) {
        console.error('[Garage] Failed to delete linked cashflow entry:', cfDelErr.message)
      }
    }

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${validated.vehicleId}`, 'page')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete service record'
    return { success: false, error: message }
  }
}

/**
 * Updates metadata & cost of an existing service record with user ownership validation.
 * Odometer and serviced rules are intentionally immutable to protect countdown integrity.
 * If cost is changed and a linked Cashflow entry exists, updates Cashflow entry amount.
 */
export async function updateVehicleService(rawInput: unknown): Promise<{
  success: boolean
  data?: VehicleServiceDTO
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = updateVehicleServiceSchema.parse(rawInput)
    const supabase = await createClient()

    // 1. Verify service ownership & fetch existing record
    const { data: existingService, error: fetchErr } = await supabase
      .from('vehicle_services')
      .select('*')
      .eq('id', validated.id)
      .eq('vehicle_id', validated.vehicleId)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !existingService) {
      return { success: false, error: 'Service record not found or unauthorized' }
    }

    // 2. Prepare safe update payload (metadata & cost only)
    const updatePayload: Record<string, unknown> = {
      workshop_name: validated.workshopName,
      invoice_number: validated.invoiceNumber,
      external_invoice_url: validated.externalInvoiceUrl,
      notes: validated.notes,
    }

    if (validated.cost !== undefined) {
      updatePayload.cost = validated.cost
    }

    const { data: updatedService, error: updateErr } = await supabase
      .from('vehicle_services')
      .update(updatePayload)
      .eq('id', validated.id)
      .eq('vehicle_id', validated.vehicleId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateErr || !updatedService) {
      return { success: false, error: updateErr?.message || 'Failed to update service log' }
    }

    // 3. If cost changed and linked cashflow entry exists, update cashflow entry amount
    if (
      validated.cost !== undefined &&
      existingService.cashflow_entry_id &&
      Number(validated.cost) !== Number(existingService.cost)
    ) {
      const { error: cfUpdateErr } = await supabase
        .from('cashflow_entries')
        .update({
          amount: validated.cost,
        })
        .eq('id', existingService.cashflow_entry_id)

      if (cfUpdateErr) {
        console.error('[Garage] Failed to update linked cashflow amount:', cfUpdateErr.message)
      }
    }

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${validated.vehicleId}`, 'page')

    return {
      success: true,
      data: mapVehicleServiceRowToDTO(updatedService),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update service log'
    return { success: false, error: message }
  }
}

/**
 * Loads all documents for a given vehicle.
 */
export async function getVehicleDocuments(vehicleId: string): Promise<{
  success: boolean
  data: VehicleDocumentDTO[]
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('vehicle_documents')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true })

    if (error) {
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: (data || []).map(mapDocumentRowToDTO) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load vehicle documents'
    return { success: false, data: [], error: message }
  }
}

/**
 * Creates a new vehicle document (tax, insurance, registration, etc.).
 */
export async function createVehicleDocument(rawInput: unknown): Promise<{
  success: boolean
  data?: VehicleDocumentDTO
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = createVehicleDocumentSchema.parse(rawInput)
    const supabase = await createClient()

    // Verify vehicle belongs to user
    const { data: vehicle, error: vErr } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', validated.vehicleId)
      .eq('user_id', user.id)
      .single()

    if (vErr || !vehicle) {
      return { success: false, error: 'Vehicle not found or unauthorized' }
    }

    const { data, error } = await supabase
      .from('vehicle_documents')
      .insert({
        user_id: user.id,
        vehicle_id: validated.vehicleId,
        title: validated.title.trim(),
        document_type: validated.documentType,
        document_number: validated.documentNumber || null,
        expiry_date: validated.expiryDate,
        cost: validated.cost ?? 0,
        notes: validated.notes || null,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${validated.vehicleId}`, 'page')
    resetAlertCooldown(user.id)

    return { success: true, data: mapDocumentRowToDTO(data) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create vehicle document'
    return { success: false, error: message }
  }
}

/**
 * Updates an existing vehicle document.
 */
export async function updateVehicleDocument(rawInput: unknown): Promise<{
  success: boolean
  data?: VehicleDocumentDTO
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = updateVehicleDocumentSchema.parse(rawInput)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('vehicle_documents')
      .update({
        title: validated.title.trim(),
        document_type: validated.documentType,
        document_number: validated.documentNumber || null,
        expiry_date: validated.expiryDate,
        cost: validated.cost ?? 0,
        notes: validated.notes || null,
      })
      .eq('id', validated.id)
      .eq('vehicle_id', validated.vehicleId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${validated.vehicleId}`, 'page')
    resetAlertCooldown(user.id)

    return { success: true, data: mapDocumentRowToDTO(data) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update vehicle document'
    return { success: false, error: message }
  }
}

/**
 * Deletes a vehicle document.
 * Optionally cascades deletion to linked Cashflow expense entry.
 */
export async function deleteVehicleDocument(rawInput: unknown): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = deleteVehicleDocumentSchema.parse(rawInput)
    const supabase = await createClient()

    // Fetch existing document to verify ownership and check for linked cashflow entry
    const { data: existingDoc } = await supabase
      .from('vehicle_documents')
      .select('id, cashflow_entry_id')
      .eq('id', validated.id)
      .eq('vehicle_id', validated.vehicleId)
      .eq('user_id', user.id)
      .maybeSingle()

    const { error } = await supabase
      .from('vehicle_documents')
      .delete()
      .eq('id', validated.id)
      .eq('vehicle_id', validated.vehicleId)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Cascade delete linked cashflow expense if requested
    if (validated.deleteCashflowEntry && existingDoc?.cashflow_entry_id) {
      const { error: cfDelErr } = await supabase
        .from('cashflow_entries')
        .delete()
        .eq('id', existingDoc.cashflow_entry_id)

      if (cfDelErr) {
        console.error('[Garage] Failed to delete linked cashflow entry:', cfDelErr.message)
      }
    }

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${validated.vehicleId}`, 'page')
    resetAlertCooldown(user.id)

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete vehicle document'
    return { success: false, error: message }
  }
}

/**
 * Renews a vehicle document with 1-tap presets and optional Cashflow ledger sync.
 */
export async function renewVehicleDocument(rawInput: unknown): Promise<{
  success: boolean
  data?: VehicleDocumentDTO
  error?: string
  warning?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = renewVehicleDocumentSchema.parse(rawInput)
    const supabase = await createClient()

    // 1. Fetch current document
    const { data: doc, error: fetchErr } = await supabase
      .from('vehicle_documents')
      .select('*')
      .eq('id', validated.id)
      .eq('vehicle_id', validated.vehicleId)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !doc) {
      return { success: false, error: 'Document not found or unauthorized' }
    }

    // 2. Compute new expiry date using pure UTC math
    const newExpiry =
      validated.customExpiryDate ||
      validated.expiryDate ||
      advanceExpiryDate(
        doc.expiry_date,
        validated.preset || '1y',
        validated.customExpiryDate,
        Boolean(validated.advanceFromToday)
      )

    const updatePayload: {
      expiry_date: string
      cost?: number
    } = {
      expiry_date: newExpiry,
    }

    const renewalCost = validated.renewalCost ?? validated.cost
    if (renewalCost !== undefined) {
      updatePayload.cost = renewalCost
    }

    // 3. Update vehicle document
    const { data: updatedDoc, error: updateErr } = await supabase
      .from('vehicle_documents')
      .update(updatePayload)
      .eq('id', validated.id)
      .eq('vehicle_id', validated.vehicleId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateErr) {
      return { success: false, error: updateErr.message }
    }

    let finalDoc = updatedDoc
    let syncWarning: string | undefined = undefined

    // 4. Optional Cashflow Ledger Sync
    if (
      validated.recordToCashflow &&
      validated.cashflowId &&
      renewalCost &&
      renewalCost > 0
    ) {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('name, license_plate')
        .eq('id', validated.vehicleId)
        .eq('user_id', user.id)
        .maybeSingle()

      const vehicleLabel = vehicle
        ? `${vehicle.name}${vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}`
        : 'Vehicle'
      const desc = `Renewal: ${doc.title} - ${vehicleLabel}`
      const paymentDate = validated.paymentDate || new Date().toISOString().split('T')[0]

      const { data: cfData, error: cfError } = await supabase
        .from('cashflow_entries')
        .insert({
          cashflow_id: validated.cashflowId,
          amount: renewalCost,
          type: 'expense',
          category: validated.cashflowCategoryId || validated.cashflowCategory || 'transport',
          description: desc,
          date: paymentDate,
          tags: ['garage', 'document', 'renewal'],
        })
        .select('id')
        .single()

      if (cfError) {
        console.error('[Garage] Failed to sync document renewal to cashflow:', cfError.message)
        syncWarning = `Document renewed, but failed to sync to Cashflow: ${cfError.message}`
      } else if (cfData) {
        // Link cashflow_entry_id to updated document row
        const { data: relinkedDoc } = await supabase
          .from('vehicle_documents')
          .update({ cashflow_entry_id: cfData.id })
          .eq('id', validated.id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (relinkedDoc) {
          finalDoc = relinkedDoc
        }
        revalidatePath(`/cashflow/${validated.cashflowId}`)
      }
    }

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${validated.vehicleId}`, 'page')
    resetAlertCooldown(user.id)

    return {
      success: true,
      data: mapDocumentRowToDTO(finalDoc),
      warning: syncWarning,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to renew document'
    return { success: false, error: message }
  }
}

/**
 * Loads all driver licenses for the user.
 */
export async function getDriverLicenses(): Promise<{
  success: boolean
  data: DriverLicenseDTO[]
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('driver_licenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true })

    if (error) {
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: (data || []).map(mapLicenseRowToDTO) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load driver licenses'
    return { success: false, data: [], error: message }
  }
}

/**
 * Creates a new driver license record.
 */
export async function createDriverLicense(rawInput: unknown): Promise<{
  success: boolean
  data?: DriverLicenseDTO
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = createDriverLicenseSchema.parse(rawInput)
    const supabase = await createClient()

    const licenseName = (validated.licenseName || validated.title || '').trim()
    const { data, error } = await supabase
      .from('driver_licenses')
      .insert({
        user_id: user.id,
        license_name: licenseName,
        category: validated.category,
        license_number: validated.licenseNumber || null,
        expiry_date: validated.expiryDate,
        notes: validated.notes || null,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/garage', 'page')
    resetAlertCooldown(user.id)

    return { success: true, data: mapLicenseRowToDTO(data) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create driver license'
    return { success: false, error: message }
  }
}

/**
 * Updates an existing driver license record.
 */
export async function updateDriverLicense(rawInput: unknown): Promise<{
  success: boolean
  data?: DriverLicenseDTO
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = updateDriverLicenseSchema.parse(rawInput)
    const supabase = await createClient()

    const licenseName = (validated.licenseName || validated.title || '').trim()
    const { data, error } = await supabase
      .from('driver_licenses')
      .update({
        license_name: licenseName,
        category: validated.category,
        license_number: validated.licenseNumber || null,
        expiry_date: validated.expiryDate,
        notes: validated.notes || null,
      })
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/garage', 'page')
    resetAlertCooldown(user.id)

    return { success: true, data: mapLicenseRowToDTO(data) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update driver license'
    return { success: false, error: message }
  }
}

/**
 * Deletes a driver license record.
 */
export async function deleteDriverLicense(rawInput: unknown): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const validated = deleteDriverLicenseSchema.parse(rawInput)
    const supabase = await createClient()

    const { error } = await supabase
      .from('driver_licenses')
      .delete()
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/garage', 'page')
    resetAlertCooldown(user.id)

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete driver license'
    return { success: false, error: message }
  }
}

// Container-level in-memory cooldown to prevent read-query thrashing on page navigation
const alertCheckCooldowns = new Map<string, number>()
const ALERT_CHECK_COOLDOWN_MS = 6 * 60 * 60 * 1000 // 6 hours

function resetAlertCooldown(userId: string) {
  for (const key of alertCheckCooldowns.keys()) {
    if (key === userId || key.startsWith(`${userId}:`)) {
      alertCheckCooldowns.delete(key)
    }
  }
}

export async function invalidateAlertCheckCooldown(userId: string): Promise<void> {
  resetAlertCooldown(userId)
}

/**
 * Checks for expiring or overdue documents and driver licenses,
 * emitting garage_alert notifications while strictly deduplicating within a 7-day window.
 * Throttled to 1 run per 6 hours per user/vehicle context unless invalidated.
 */
export async function checkAndEmitDocumentAlerts(vehicleId?: string): Promise<{
  success: boolean
  alertsEmitted: number
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const cooldownKey = vehicleId ? `${user.id}:${vehicleId}` : user.id
    const lastCheck = alertCheckCooldowns.get(cooldownKey)
    if (lastCheck && Date.now() - lastCheck < ALERT_CHECK_COOLDOWN_MS) {
      return { success: true, alertsEmitted: 0 }
    }

    const supabase = await createClient()

    // 1. Fetch active (non-archived) vehicles for user
    const { data: activeVehicles } = await supabase
      .from('vehicles')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_archived', false)

    const activeVehicleIds = new Set((activeVehicles || []).map((v) => v.id))

    // If a specific vehicleId was requested, verify it is active
    if (vehicleId && !activeVehicleIds.has(vehicleId)) {
      return { success: true, alertsEmitted: 0 }
    }

    // Look ahead 30 days, and only look back 60 days to prevent infinite spam for ancient expired docs
    const now = new Date()
    const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // 2. Fetch recent notifications to prevent spam (7-day deduplication window)
    const { data: recentNotifications } = await supabase
      .from('notifications')
      .select('id, link_url, created_at')
      .eq('user_id', user.id)
      .eq('type', 'garage_alert')
      .gte('created_at', sevenDaysAgo)

    const recentLinks = new Set((recentNotifications || []).map((n) => n.link_url))

    let alertsEmitted = 0

    // 3. Query documents expiring between sixtyDaysAgo and thirtyDaysAhead
    let docQuery = supabase
      .from('vehicle_documents')
      .select('id, vehicle_id, title, document_number, expiry_date')
      .eq('user_id', user.id)
      .gte('expiry_date', sixtyDaysAgo)
      .lte('expiry_date', thirtyDaysAhead)

    if (vehicleId) {
      docQuery = docQuery.eq('vehicle_id', vehicleId)
    }

    const { data: expiringDocs } = await docQuery

    if (expiringDocs && expiringDocs.length > 0) {
      const todayIso = now.toISOString().split('T')[0]

      for (const doc of expiringDocs) {
        // Skip documents of archived vehicles
        if (!activeVehicleIds.has(doc.vehicle_id)) continue

        const [docY, docM, docD] = doc.expiry_date.split('-').map(Number)
        const [nowY, nowM, nowD] = todayIso.split('-').map(Number)
        const docUtc = Date.UTC(docY, docM - 1, docD)
        const nowUtc = Date.UTC(nowY, nowM - 1, nowD)
        const diffDays = Math.round((docUtc - nowUtc) / (1000 * 60 * 60 * 24))

        let urgencyTier: 'expired' | 'today' | '7d' | '30d' = '30d'
        if (diffDays < 0) {
          urgencyTier = 'expired'
        } else if (diffDays === 0) {
          urgencyTier = 'today'
        } else if (diffDays <= 7) {
          urgencyTier = '7d'
        } else {
          urgencyTier = '30d'
        }

        const linkUrl = `/garage/${doc.vehicle_id}?doc=${doc.id}&alert=${urgencyTier}`
        // Deduplication: check if alert for this urgency tier was emitted in the last 7 days
        if (recentLinks.has(linkUrl)) continue

        let title = 'Document Renewal Reminder ⚠️'
        let body = `${doc.title}${doc.document_number ? ` (${doc.document_number})` : ''} expires in ${diffDays} days (${doc.expiry_date}).`

        if (diffDays < 0) {
          title = 'Document Expired 🔴'
          body = `${doc.title}${doc.document_number ? ` (${doc.document_number})` : ''} expired on ${doc.expiry_date}. Please renew it promptly.`
        } else if (diffDays === 0) {
          title = 'Document Expiring Today ⚠️'
          body = `${doc.title}${doc.document_number ? ` (${doc.document_number})` : ''} expires today!`
        }

        await createNotification({
          userId: user.id,
          type: 'garage_alert',
          title,
          body,
          linkUrl,
        })

        recentLinks.add(linkUrl)
        alertsEmitted++
      }
    }

    // 4. Query driver licenses (only if vehicleId is not specified)
    if (!vehicleId) {
      const { data: expiringLicenses } = await supabase
        .from('driver_licenses')
        .select('id, license_name, category, license_number, expiry_date')
        .eq('user_id', user.id)
        .gte('expiry_date', sixtyDaysAgo)
        .lte('expiry_date', thirtyDaysAhead)

      if (expiringLicenses && expiringLicenses.length > 0) {
        const todayIso = now.toISOString().split('T')[0]

        for (const lic of expiringLicenses) {
          const [licY, licM, licD] = lic.expiry_date.split('-').map(Number)
          const [nowY, nowM, nowD] = todayIso.split('-').map(Number)
          const licUtc = Date.UTC(licY, licM - 1, licD)
          const nowUtc = Date.UTC(nowY, nowM - 1, nowD)
          const diffDays = Math.round((licUtc - nowUtc) / (1000 * 60 * 60 * 24))

          let urgencyTier: 'expired' | 'today' | '7d' | '30d' = '30d'
          if (diffDays < 0) {
            urgencyTier = 'expired'
          } else if (diffDays === 0) {
            urgencyTier = 'today'
          } else if (diffDays <= 7) {
            urgencyTier = '7d'
          } else {
            urgencyTier = '30d'
          }

          const linkUrl = `/garage?tab=licenses&doc=${lic.id}&alert=${urgencyTier}`
          if (recentLinks.has(linkUrl)) continue

          let title = "Driver's License Renewal Reminder ⚠️"
          let body = `${lic.license_name} (${lic.category.toUpperCase()}) expires in ${diffDays} days (${lic.expiry_date}).`

          if (diffDays < 0) {
            title = "Driver's License Expired 🔴"
            body = `${lic.license_name} (${lic.category.toUpperCase()}) expired on ${lic.expiry_date}. Driving with an expired license is illegal!`
          } else if (diffDays === 0) {
            title = "Driver's License Expiring Today ⚠️"
            body = `${lic.license_name} (${lic.category.toUpperCase()}) expires today!`
          }

          await createNotification({
            userId: user.id,
            type: 'garage_alert',
            title,
            body,
            linkUrl,
          })

          recentLinks.add(linkUrl)
          alertsEmitted++
        }
      }
    }

    alertCheckCooldowns.set(cooldownKey, Date.now())
    return { success: true, alertsEmitted }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to emit document alerts'
    return { success: false, alertsEmitted: 0, error: message }
  }
}

/**
 * ============================================================================
 * DAY 5: FUEL LOG & MILEAGE EFFICIENCY ENGINE
 * ============================================================================
 */

/**
 * Loads fuel logs for a specific vehicle ordered chronologically descending.
 */
export async function getVehicleFuelLogs(vehicleId: string): Promise<{
  success: boolean
  data?: VehicleFuelLogDTO[]
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('vehicle_fuel_logs')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: (data || []).map(mapFuelLogRowToDTO),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch fuel logs'
    return { success: false, error: message }
  }
}

/**
 * Records a new fuel fill-up log:
 * 1. Computes economy (km/L, MPG, or km/kWh) with partial fill-up accumulation.
 * 2. Syncs vehicle current odometer (forward-only) and upserts monthly snapshot.
 * 3. Optional 1-click Cashflow ledger sync.
 */
export async function createVehicleFuelLog(rawInput: unknown): Promise<{
  success: boolean
  data?: VehicleFuelLogDTO
  requiresConfirmation?: boolean
  jumpDelta?: number
  warning?: string
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const supabase = await createClient()

    const validated = createVehicleFuelLogSchema.parse(rawInput)

    // Verify vehicle ownership
    const { data: vehicle, error: vehicleErr } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', validated.vehicleId)
      .eq('user_id', user.id)
      .single()

    if (vehicleErr || !vehicle) {
      return { success: false, error: 'Vehicle not found or unauthorized' }
    }

    // Fat-Finger Typo Guard (> 3,000 km in a single log)
    const isJump = isOdometerTypoJump(validated.odometer, vehicle.current_odometer)
    if (isJump && !validated.confirmTypoJump) {
      const jumpDelta = validated.odometer - vehicle.current_odometer
      return {
        success: false,
        requiresConfirmation: true,
        jumpDelta,
        error: `Odometer reading (+${jumpDelta.toLocaleString()} ${vehicle.odometer_unit}) is significantly higher than current odometer (${vehicle.current_odometer.toLocaleString()} ${vehicle.odometer_unit}). Please confirm.`,
      }
    }

    // Fetch existing fuel logs for calculation
    const { data: existingLogsRaw } = await supabase
      .from('vehicle_fuel_logs')
      .select('*')
      .eq('vehicle_id', validated.vehicleId)
      .eq('user_id', user.id)
      .order('odometer', { ascending: true })

    const existingLogs = (existingLogsRaw || []).map(mapFuelLogRowToDTO)

    // Calculate economy for the new log
    const calculatedKml = computeNewLogEconomy(
      {
        odometer: validated.odometer,
        fuel_amount: validated.fuelAmount,
        is_full_tank: validated.isFullTank,
        is_missed_previous: validated.isMissedPrevious,
      },
      existingLogs,
    )

    // Insert fuel log
    const { data: fuelLog, error: insertErr } = await supabase
      .from('vehicle_fuel_logs')
      .insert({
        user_id: user.id,
        vehicle_id: validated.vehicleId,
        log_date: validated.logDate,
        odometer: validated.odometer,
        fuel_amount: validated.fuelAmount,
        price_per_unit: validated.pricePerUnit || null,
        total_cost: validated.totalCost,
        is_full_tank: validated.isFullTank,
        is_missed_previous: validated.isMissedPrevious,
        battery_start_pct: validated.batteryStartPct ?? null,
        battery_end_pct: validated.batteryEndPct ?? null,
        calculated_kml: calculatedKml,
        notes: validated.notes || null,
      })
      .select()
      .single()

    if (insertErr || !fuelLog) {
      return { success: false, error: insertErr?.message || 'Failed to record fuel log' }
    }

    let savedFuelLog = fuelLog
    let syncWarning: string | undefined = undefined

    // Day 6: 1-Click Cashflow Ledger Sync
    if (
      validated.recordToCashflow &&
      validated.cashflowId &&
      validated.totalCost > 0
    ) {
      const fuelType: FuelType = isFuelType(vehicle.fuel_type) ? vehicle.fuel_type : 'petrol'
      const odometerUnit: OdometerUnit = isOdometerUnit(vehicle.odometer_unit) ? vehicle.odometer_unit : 'km'
      const labels = getFuelUnitLabels(fuelType, odometerUnit)
      const vehicleLabel = `${vehicle.name}${vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}`
      const desc = `Fuel: ${vehicleLabel} - ${validated.fuelAmount} ${labels.volumeUnit}`

      const { data: cfData, error: cfError } = await supabase
        .from('cashflow_entries')
        .insert({
          cashflow_id: validated.cashflowId,
          amount: validated.totalCost,
          type: 'expense',
          category: validated.cashflowCategoryId || validated.cashflowCategory || 'Transport',
          description: desc,
          date: validated.logDate,
          tags: ['garage', 'fuel', vehicle.fuel_type],
        })
        .select('id')
        .single()

      if (cfError) {
        console.error('[Garage] Failed to sync fuel log to Cashflow:', cfError.message)
        syncWarning = `Fuel logged, but failed to sync to Cashflow: ${cfError.message}`
      } else if (cfData) {
        const { data: updatedFuel } = await supabase
          .from('vehicle_fuel_logs')
          .update({ cashflow_entry_id: cfData.id })
          .eq('id', fuelLog.id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (updatedFuel) {
          savedFuelLog = updatedFuel
        }

        // Update sticky preferred cashflow on vehicle
        await supabase
          .from('vehicles')
          .update({ preferred_cashflow_id: validated.cashflowId })
          .eq('id', vehicle.id)
          .eq('user_id', user.id)

        revalidatePath(`/cashflow/${validated.cashflowId}`)
      }
    }

    // Auto-Odometer Sync (forward-only)
    if (validated.odometer > vehicle.current_odometer) {
      await supabase
        .from('vehicles')
        .update({
          current_odometer: validated.odometer,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicle.id)
        .eq('user_id', user.id)

      // Upsert monthly snapshot
      const yearMonth = validated.logDate.slice(0, 7)
      await supabase
        .from('vehicle_monthly_odometers')
        .upsert(
          {
            user_id: user.id,
            vehicle_id: vehicle.id,
            year_month: yearMonth,
            odometer: validated.odometer,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'vehicle_id,year_month' },
        )
    }

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${validated.vehicleId}`, 'page')

    return {
      success: true,
      data: mapFuelLogRowToDTO(savedFuelLog),
      warning: syncWarning,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to record fuel log'
    return { success: false, error: message }
  }
}

/**
 * Updates an existing fuel log and re-evaluates the chronological economy sequence.
 */
export async function updateVehicleFuelLog(rawInput: unknown): Promise<{
  success: boolean
  data?: VehicleFuelLogDTO
  requiresConfirmation?: boolean
  jumpDelta?: number
  warning?: string
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUserWithRateLimit()
    const supabase = await createClient()

    const validated = updateVehicleFuelLogSchema.parse(rawInput)

    // Verify vehicle ownership
    const { data: vehicle, error: vehicleErr } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', validated.vehicleId)
      .eq('user_id', user.id)
      .single()

    if (vehicleErr || !vehicle) {
      return { success: false, error: 'Vehicle not found or unauthorized' }
    }

    // Fat-Finger Typo Guard (> 3,000 km in a single log)
    const isJump = isOdometerTypoJump(validated.odometer, vehicle.current_odometer)
    if (isJump && !validated.confirmTypoJump) {
      const jumpDelta = validated.odometer - vehicle.current_odometer
      return {
        success: false,
        requiresConfirmation: true,
        jumpDelta,
        error: `Odometer reading (+${jumpDelta.toLocaleString()} ${vehicle.odometer_unit}) is significantly higher than current odometer (${vehicle.current_odometer.toLocaleString()} ${vehicle.odometer_unit}). Please confirm.`,
      }
    }

    const { data: updated, error } = await supabase
      .from('vehicle_fuel_logs')
      .update({
        log_date: validated.logDate,
        odometer: validated.odometer,
        fuel_amount: validated.fuelAmount,
        price_per_unit: validated.pricePerUnit || null,
        total_cost: validated.totalCost,
        is_full_tank: validated.isFullTank,
        is_missed_previous: validated.isMissedPrevious,
        battery_start_pct: validated.batteryStartPct ?? null,
        battery_end_pct: validated.batteryEndPct ?? null,
        notes: validated.notes || null,
      })
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !updated) {
      return { success: false, error: error?.message || 'Failed to update fuel log' }
    }

    // Sequence recalculation
    const { data: allLogsRaw } = await supabase
      .from('vehicle_fuel_logs')
      .select('*')
      .eq('vehicle_id', validated.vehicleId)
      .eq('user_id', user.id)

    if (allLogsRaw && allLogsRaw.length > 0) {
      const recalculated = recalculateFuelEconomySequence(allLogsRaw.map(mapFuelLogRowToDTO))
      for (const item of recalculated) {
        if (item.calculated_kml !== null) {
          await supabase
            .from('vehicle_fuel_logs')
            .update({ calculated_kml: item.calculated_kml })
            .eq('id', item.id)
            .eq('user_id', user.id)
        }
      }
    }

    // If linked cashflow entry exists, synchronize amount and date
    if (updated.cashflow_entry_id) {
      const { error: cfUpdateErr } = await supabase
        .from('cashflow_entries')
        .update({
          amount: validated.totalCost,
          date: validated.logDate,
        })
        .eq('id', updated.cashflow_entry_id)
        .eq('user_id', user.id)

      if (cfUpdateErr) {
        console.error('[Garage] Failed to update linked cashflow entry:', cfUpdateErr.message)
      }
    }

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${validated.vehicleId}`, 'page')

    return {
      success: true,
      data: mapFuelLogRowToDTO(updated),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update fuel log'
    return { success: false, error: message }
  }
}

/**
 * Deletes a fuel log and re-evaluates the remaining sequence.
 */
export async function deleteVehicleFuelLog(rawInput: unknown): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const supabase = await createClient()

    const validated = deleteVehicleFuelLogSchema.parse(rawInput)

    const { data: log, error: fetchErr } = await supabase
      .from('vehicle_fuel_logs')
      .select('vehicle_id, cashflow_entry_id')
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !log) {
      return { success: false, error: 'Fuel log not found or unauthorized' }
    }

    const { error: delErr } = await supabase
      .from('vehicle_fuel_logs')
      .delete()
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (delErr) {
      return { success: false, error: delErr.message }
    }

    // Recalculate remaining sequence
    const { data: remainingRaw } = await supabase
      .from('vehicle_fuel_logs')
      .select('*')
      .eq('vehicle_id', log.vehicle_id)
      .eq('user_id', user.id)

    if (remainingRaw && remainingRaw.length > 0) {
      const recalculated = recalculateFuelEconomySequence(remainingRaw.map(mapFuelLogRowToDTO))
      for (const item of recalculated) {
        await supabase
          .from('vehicle_fuel_logs')
          .update({ calculated_kml: item.calculated_kml })
          .eq('id', item.id)
          .eq('user_id', user.id)
      }
    }

    revalidatePath('/garage', 'page')
    revalidatePath(`/garage/${log.vehicle_id}`, 'page')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete fuel log'
    return { success: false, error: message }
  }
}

/**
 * ============================================================================
 * DAY 6: CROSS-APP LIST & TASK SYNC ACTIONS
 * ============================================================================
 */

/**
 * Loads user lists for the "Add to List" task sync picker.
 */
export async function getUserLists(): Promise<{
  success: boolean
  data?: Array<{ id: string; title: string; type: string }>
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lists')
      .select('id, title, type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user lists'
    return { success: false, error: message }
  }
}

/**
 * Adds an upcoming or overdue vehicle maintenance rule to a designated List board.
 */
export async function syncMaintenanceRuleToList(rawInput: unknown): Promise<{
  success: boolean
  error?: string
  data?: { itemId: string; listId: string }
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const supabase = await createClient()

    const validated = syncMaintenanceRuleToListSchema.parse(rawInput)

    // Check list ownership
    const { data: list, error: listErr } = await supabase
      .from('lists')
      .select('id, title')
      .eq('id', validated.listId)
      .eq('user_id', user.id)
      .single()

    if (listErr || !list) {
      return { success: false, error: 'List not found or unauthorized' }
    }

    // Check vehicle
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('name, license_plate')
      .eq('id', validated.vehicleId)
      .eq('user_id', user.id)
      .single()

    const vehicleTag = vehicle ? `[${vehicle.name}] ` : ''
    const itemTitle = `${vehicleTag}${validated.ruleName}`

    // Compute next sort order
    const { data: items } = await supabase
      .from('list_items')
      .select('sort_order')
      .eq('list_id', validated.listId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = items && items.length > 0 ? items[0].sort_order + 1024 : 1024

    const { data: newItem, error: itemErr } = await supabase
      .from('list_items')
      .insert({
        list_id: validated.listId,
        title: itemTitle,
        description:
          validated.notes ||
          `Vehicle maintenance reminder from Garage for ${vehicle?.name || 'vehicle'}.`,
        due_date: validated.dueDate || null,
        priority: validated.priority,
        sort_order: nextSortOrder,
      })
      .select('id')
      .single()

    if (itemErr || !newItem) {
      return { success: false, error: itemErr?.message || 'Failed to add item to list' }
    }

    revalidatePath('/list')
    revalidatePath(`/list/${validated.listId}`)

    return {
      success: true,
      data: { itemId: newItem.id, listId: validated.listId },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to sync maintenance rule to list'
    return { success: false, error: message }
  }
}


