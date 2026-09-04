export type {
  VehicleType,
  FuelType,
  OdometerUnit,
  VehicleDTO,
  PublicVehicleDTO,
  VehicleMonthlyOdometerDTO,
} from '@/types/dto'

import type { VehicleDTO, VehicleType, FuelType, OdometerUnit } from '@/types/dto'

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

export function isOdometerUnit(val: string): val is OdometerUnit {
  return val === 'km' || val === 'miles'
}
