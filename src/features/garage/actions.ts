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
  MaintenanceCategory,
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
} from './schemas.server'
import { isOdometerTypoJump } from './lib/odometer'
import { getDefaultRulesForVehicle } from './lib/presets'
import { isMaintenanceCategory } from './types'

type VehicleRow = Database['public']['Tables']['vehicles']['Row']
type MonthlyOdoRow = Database['public']['Tables']['vehicle_monthly_odometers']['Row']
type RuleRow = Database['public']['Tables']['vehicle_maintenance_rules']['Row']

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
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const supabase = await createClient()

    const [vehicleRes, monthlyRes, rulesRes] = await Promise.all([
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
    ])

    if (vehicleRes.error || !vehicleRes.data) {
      return { success: false, error: 'Vehicle not found or unauthorized' }
    }

    const vehicle = mapVehicleRowToDTO(vehicleRes.data)
    const monthlyOdometers = (monthlyRes.data || []).map(mapMonthlyOdoRowToDTO)
    const maintenanceRules = (rulesRes.data || []).map(mapRuleRowToDTO)

    return {
      success: true,
      vehicle,
      monthlyOdometers,
      maintenanceRules,
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

