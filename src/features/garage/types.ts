export type {
  VehicleType,
  FuelType,
  TransmissionType,
  OdometerUnit,
  VehicleDTO,
  PublicVehicleDTO,
  VehicleMonthlyOdometerDTO,
  MaintenanceCategory,
  VehicleMaintenanceRuleDTO,
} from '@/types/dto'

import type {
  VehicleDTO,
  VehicleType,
  FuelType,
  TransmissionType,
  OdometerUnit,
  MaintenanceCategory,
} from '@/types/dto'

export type RuleStatus = 'good' | 'due_soon' | 'overdue' | 'untracked'

export interface RuleDueStatus {
  status: RuleStatus
  remainingDistance: number | null
  remainingDays: number | null
  percentRemaining: number | null
  isOverdue: boolean
  isDueSoon: boolean
  primaryTrigger: 'distance' | 'time' | 'both' | 'none'
}

export interface MaintenanceRulePresetItem {
  name: string
  category: MaintenanceCategory
  intervalDistance: number | null
  intervalMonths: number | null
  description?: string
  isRecommended?: boolean
}

export interface VehicleStats {
  totalVehicles: number
  activeVehicles: number
  archivedVehicles: number
  totalOdometerKm: number
  defaultVehicle: VehicleDTO | null
}

export interface MonthlyOdometerReading {
  yearMonth: string
  odometer: number
  deltaKm: number | null
}

export function isVehicleType(val: string): val is VehicleType {
  return val === 'car' || val === 'motorcycle' || val === 'bicycle' || val === 'other'
}

export function isFuelType(val: string): val is FuelType {
  return val === 'petrol' || val === 'diesel' || val === 'electric' || val === 'hybrid'
}

export function isTransmissionType(val: string): val is TransmissionType {
  return val === 'automatic' || val === 'manual'
}

export function isOdometerUnit(val: string): val is OdometerUnit {
  return val === 'km' || val === 'miles'
}

export function isMaintenanceCategory(val: string): val is MaintenanceCategory {
  return (
    val === 'fluids' ||
    val === 'filters' ||
    val === 'brakes' ||
    val === 'tires' ||
    val === 'powertrain' ||
    val === 'electrical' ||
    val === 'other'
  )
}
