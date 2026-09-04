// Components
export { GarageDashboard } from './components/GarageDashboard'
export { VehicleCard } from './components/VehicleCard'
export { VehicleDetail } from './components/VehicleDetail'
export { AddVehicleModal } from './components/AddVehicleModal'
export { EditVehicleModal } from './components/EditVehicleModal'
export { VehicleTypeBadge } from './components/VehicleTypeBadge'
export { QuickFuelFab } from './components/QuickFuelFab'
export { UpdateOdometerModal } from './components/UpdateOdometerModal'

// Actions
export {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  updateOdometer,
  toggleArchiveVehicle,
  setDefaultVehicle,
  deleteVehicle,
  getUserCashflowBooks,
} from './actions'

// Types & Type Guards
export type {
  VehicleType,
  FuelType,
  OdometerUnit,
  VehicleDTO,
  PublicVehicleDTO,
  VehicleMonthlyOdometerDTO,
  VehicleStats,
  MonthlyOdometerReading,
} from './types'

export { isVehicleType, isFuelType, isOdometerUnit } from './types'

// Lib helpers
export {
  calculateMonthlyVelocity,
  convertOdometerUnit,
  formatOdometer,
  isOdometerTypoJump,
  predictCurrentOdometer,
  KM_PER_MILE,
} from './lib/odometer'
export type { PredictedOdometerResult } from './lib/odometer'

// Server schemas
export {
  createVehicleSchema,
  updateVehicleSchema,
  toggleArchiveVehicleSchema,
  deleteVehicleSchema,
  setDefaultVehicleSchema,
  updateOdometerSchema,
  vehicleTypeSchema,
  fuelTypeSchema,
  odometerUnitSchema,
} from './schemas.server'

// Client schemas
export {
  vehicleFormClientSchema,
  updateOdometerClientSchema,
  vehicleTypeClientSchema,
  fuelTypeClientSchema,
  odometerUnitClientSchema,
} from './schemas.client'
