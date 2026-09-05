// Components
export { GarageDashboard } from './components/GarageDashboard'
export { VehicleCard } from './components/VehicleCard'
export { VehicleDetail } from './components/VehicleDetail'
export { AddVehicleModal } from './components/AddVehicleModal'
export { EditVehicleModal } from './components/EditVehicleModal'
export { VehicleTypeBadge } from './components/VehicleTypeBadge'
export { QuickFuelFab } from './components/QuickFuelFab'
export { UpdateOdometerModal } from './components/UpdateOdometerModal'
export { MaintenanceChecklistManager } from './components/MaintenanceChecklistManager'
export { MaintenanceRuleModal } from './components/MaintenanceRuleModal'
export { ApplyPresetsDialog } from './components/ApplyPresetsDialog'

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
  getMaintenanceRules,
  createMaintenanceRule,
  updateMaintenanceRule,
  deleteMaintenanceRule,
  toggleRuleActive,
  resetRuleBaseline,
  applyDefaultMaintenancePresets,
} from './actions'

// Types & Type Guards
export type {
  VehicleType,
  FuelType,
  OdometerUnit,
  VehicleDTO,
  PublicVehicleDTO,
  VehicleMonthlyOdometerDTO,
  MaintenanceCategory,
  VehicleMaintenanceRuleDTO,
  RuleStatus,
  RuleDueStatus,
  MaintenanceRulePresetItem,
  VehicleStats,
  MonthlyOdometerReading,
} from './types'

export {
  isVehicleType,
  isFuelType,
  isOdometerUnit,
  isMaintenanceCategory,
} from './types'

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

export { getDefaultRulesForVehicle } from './lib/presets'
export { calculateRuleDueStatus, sortRulesByUrgency } from './lib/rules-math'
export type { CalculateRuleOptions, RuleWithStatusItem } from './lib/rules-math'

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
  maintenanceCategorySchema,
  createMaintenanceRuleSchema,
  updateMaintenanceRuleSchema,
  deleteMaintenanceRuleSchema,
  toggleRuleActiveSchema,
  resetRuleBaselineSchema,
  applyDefaultPresetsSchema,
} from './schemas.server'

// Client schemas
export {
  vehicleFormClientSchema,
  updateOdometerClientSchema,
  vehicleTypeClientSchema,
  fuelTypeClientSchema,
  odometerUnitClientSchema,
  maintenanceCategoryClientSchema,
  maintenanceRuleFormClientSchema,
} from './schemas.client'
