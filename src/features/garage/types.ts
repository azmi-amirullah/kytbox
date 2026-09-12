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
  ServiceType,
  VehicleServiceDTO,
  VehicleDocumentType,
  DriverLicenseCategory,
  VehicleDocumentDTO,
  DriverLicenseDTO,
  VehicleFuelLogDTO,
} from '@/types/dto'

import type {
  VehicleDTO,
  VehicleType,
  FuelType,
  TransmissionType,
  OdometerUnit,
  MaintenanceCategory,
  ServiceType,
  VehicleDocumentType,
  DriverLicenseCategory,
} from '@/types/dto'
export type { RuleWithStatusItem, MaintenancePrediction } from './lib/rules-math'

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

export type DocumentExpiryStatus = 'valid' | 'expiring_soon' | 'expired'

export interface DocumentExpiryDetails {
  status: DocumentExpiryStatus
  daysRemaining: number
  formattedDays: string
  isExpired: boolean
  isExpiringSoon: boolean
  badgeLabel: string
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

export interface FuelUnitLabels {
  volumeUnit: string // 'L', 'gal', 'kWh'
  volumeUnitFull: string // 'Liters', 'Gallons', 'kWh'
  efficiencyUnit: string // 'km/L', 'MPG', 'km/kWh', 'mi/kWh'
  priceUnitLabel: string // 'Price / Liter', 'Price / Gallon', 'Price / kWh'
}

export interface FuelStats {
  totalLogs: number
  totalCost: number
  totalVolume: number
  totalTrackedDistance: number
  averageEconomy: number | null // e.g. km/L or MPG
  lastEconomy: number | null
  costPerDistanceUnit: number | null // cost / km or cost / mi
  fullTankCount: number
  partialCount: number
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

export function isServiceType(val: string): val is ServiceType {
  return (
    val === 'routine' ||
    val === 'repair' ||
    val === 'inspection' ||
    val === 'upgrade'
  )
}

export function isVehicleDocumentType(val: unknown): val is VehicleDocumentType {
  return (
    val === 'road_tax_annual' ||
    val === 'registration_renewal' ||
    val === 'insurance' ||
    val === 'inspection' ||
    val === 'other'
  )
}

export function isDriverLicenseCategory(val: unknown): val is DriverLicenseCategory {
  return (
    val === 'car' ||
    val === 'motorcycle' ||
    val === 'commercial' ||
    val === 'other'
  )
}
