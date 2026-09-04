'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getAuthenticatedUserWithRateLimit } from '@/lib/auth-with-rate-limit'
import type { Database } from '@/types/supabase'
import type {
  VehicleDTO,
  VehicleMonthlyOdometerDTO,
  VehicleType,
  FuelType,
  OdometerUnit,
} from '@/types/dto'
import {
  createVehicleSchema,
  updateVehicleSchema,
  toggleArchiveVehicleSchema,
  deleteVehicleSchema,
  setDefaultVehicleSchema,
  updateOdometerSchema,
} from './schemas.server'
import { isOdometerTypoJump } from './lib/odometer'

type VehicleRow = Database['public']['Tables']['vehicles']['Row']
type MonthlyOdoRow = Database['public']['Tables']['vehicle_monthly_odometers']['Row']

function mapVehicleRowToDTO(row: VehicleRow): VehicleDTO {
  const type: VehicleType =
    row.type === 'car' || row.type === 'motorcycle' || row.type === 'bicycle' || row.type === 'other'
      ? row.type
      : 'other'

  const fuelType: FuelType =
    row.fuel_type === 'petrol' || row.fuel_type === 'diesel' || row.fuel_type === 'electric' || row.fuel_type === 'hybrid'
      ? row.fuel_type
      : 'petrol'

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
  error?: string
}> {
  try {
    const { user } = await getAuthenticatedUser()
    const supabase = await createClient()

    const [vehicleRes, monthlyRes] = await Promise.all([
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
    ])

    if (vehicleRes.error || !vehicleRes.data) {
      return { success: false, error: 'Vehicle not found or unauthorized' }
    }

    const vehicle = mapVehicleRowToDTO(vehicleRes.data)
    const monthlyOdometers = (monthlyRes.data || []).map(mapMonthlyOdoRowToDTO)

    return {
      success: true,
      vehicle,
      monthlyOdometers,
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
