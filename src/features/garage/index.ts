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
export { ServiceLogTimeline } from './components/ServiceLogTimeline'
export { LogServiceModal } from './components/LogServiceModal'
export { VehicleDocumentsManager } from './components/VehicleDocumentsManager'
export { VehicleDocumentModal } from './components/VehicleDocumentModal'
export { DocumentRenewalModal } from './components/DocumentRenewalModal'
export { DriverLicenseModal } from './components/DriverLicenseModal'
export { AddFuelLogModal } from './components/AddFuelLogModal'
export { FuelLogTimeline } from './components/FuelLogTimeline'
export { AddToListModal } from './components/AddToListModal'

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
  getVehicleServices,
  createVehicleService,
  updateVehicleService,
  deleteVehicleService,
  getVehicleDocuments,
  createVehicleDocument,
  updateVehicleDocument,
  deleteVehicleDocument,
  renewVehicleDocument,
  getDriverLicenses,
  createDriverLicense,
  updateDriverLicense,
  deleteDriverLicense,
  checkAndEmitDocumentAlerts,
  invalidateAlertCheckCooldown,
  getVehicleFuelLogs,
  createVehicleFuelLog,
  updateVehicleFuelLog,
  deleteVehicleFuelLog,
  getUserLists,
  syncMaintenanceRuleToList,
} from './actions'

// Types & Type Guards
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
  FuelStats,
  FuelUnitLabels,
  DocumentExpiryStatus,
  DocumentExpiryDetails,
  RuleStatus,
  RuleDueStatus,
  MaintenancePrediction,
  MaintenanceRulePresetItem,
  VehicleStats,
  MonthlyOdometerReading,
} from './types'

export {
  isVehicleType,
  isFuelType,
  isTransmissionType,
  isOdometerUnit,
  isMaintenanceCategory,
  isServiceType,
  isVehicleDocumentType,
  isDriverLicenseCategory,
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
export {
  calculateRuleDueStatus,
  sortRulesByUrgency,
  predictNextMaintenance,
} from './lib/rules-math'
export type {
  CalculateRuleOptions,
  RuleWithStatusItem,
} from './lib/rules-math'

export { sanitizeInvoiceUrl } from './lib/invoice-url'
export type { SanitizedInvoiceUrl } from './lib/invoice-url'

export {
  calculateDocumentExpiry,
  advanceExpiryDate,
  matchCashflowCategory,
} from './lib/document-math'

export {
  getFuelUnitLabels,
  calculateFuelAmountFromTotal,
  calculateTotalCostFromAmount,
  computeNewLogEconomy,
  recalculateFuelEconomySequence,
  calculateFuelStats,
} from './lib/fuel-math'

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
  transmissionTypeSchema,
  odometerUnitSchema,
  maintenanceCategorySchema,
  createMaintenanceRuleSchema,
  updateMaintenanceRuleSchema,
  deleteMaintenanceRuleSchema,
  toggleRuleActiveSchema,
  resetRuleBaselineSchema,
  applyDefaultPresetsSchema,
  serviceTypeSchema,
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
} from './schemas.server'

// Client schemas
export {
  vehicleFormClientSchema,
  updateOdometerClientSchema,
  vehicleTypeClientSchema,
  fuelTypeClientSchema,
  transmissionTypeClientSchema,
  odometerUnitClientSchema,
  maintenanceCategoryClientSchema,
  maintenanceRuleFormClientSchema,
  serviceTypeClientSchema,
  serviceFormClientSchema,
  vehicleDocumentFormClientSchema,
  renewDocumentClientSchema,
  driverLicenseFormClientSchema,
  fuelLogFormClientSchema,
} from './schemas.client'

