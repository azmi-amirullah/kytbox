import type {
  FuelType,
  OdometerUnit,
  VehicleFuelLogDTO,
  FuelUnitLabels,
  FuelStats,
} from '../types'

/**
 * Returns dynamic unit labels based on vehicle fuel type and odometer unit.
 */
export function getFuelUnitLabels(
  fuelType: FuelType,
  odometerUnit: OdometerUnit,
): FuelUnitLabels {
  if (fuelType === 'electric') {
    return {
      volumeUnit: 'kWh',
      volumeUnitFull: 'kWh',
      efficiencyUnit: odometerUnit === 'miles' ? 'mi/kWh' : 'km/kWh',
      priceUnitLabel: 'Price / kWh',
    }
  }

  if (odometerUnit === 'miles') {
    return {
      volumeUnit: 'gal',
      volumeUnitFull: 'Gallons',
      efficiencyUnit: 'MPG',
      priceUnitLabel: 'Price / Gallon',
    }
  }

  return {
    volumeUnit: 'L',
    volumeUnitFull: 'Liters',
    efficiencyUnit: 'km/L',
    priceUnitLabel: 'Price / Liter',
  }
}

/**
 * Auto-calculates fuel volume from total cost and price per unit.
 * e.g. Rp 150.000 / Rp 13.700 = 10.95 Liters
 */
export function calculateFuelAmountFromTotal(
  totalCost: number,
  pricePerUnit: number,
): number | null {
  if (!pricePerUnit || pricePerUnit <= 0 || totalCost < 0 || isNaN(totalCost)) {
    return null
  }
  return Number((totalCost / pricePerUnit).toFixed(2))
}

/**
 * Auto-calculates total cost from fuel volume and price per unit.
 * e.g. 10.95 L * Rp 13.700 = Rp 150.015
 */
export function calculateTotalCostFromAmount(
  fuelAmount: number,
  pricePerUnit: number,
): number | null {
  if (!fuelAmount || fuelAmount <= 0 || !pricePerUnit || pricePerUnit <= 0 || isNaN(fuelAmount)) {
    return null
  }
  return Number((fuelAmount * pricePerUnit).toFixed(2))
}

/**
 * Computes fuel economy for a newly entered log given existing logs.
 */
export function computeNewLogEconomy(
  newLog: {
    odometer: number
    fuel_amount: number
    is_full_tank: boolean
    is_missed_previous: boolean
  },
  existingLogs: VehicleFuelLogDTO[],
): number | null {
  if (!newLog.is_full_tank || newLog.is_missed_previous) {
    return null
  }

  // Filter logs strictly before the new log's odometer
  const priorLogs = [...existingLogs]
    .filter((l) => l.odometer < newLog.odometer)
    .sort((a, b) => b.odometer - a.odometer) // descending: closest first

  if (priorLogs.length === 0) {
    // First log ever is baseline
    return null
  }

  // Find preceding full tank
  let sumIntermediateFuel = 0
  let precedingFullTank: VehicleFuelLogDTO | null = null

  for (const log of priorLogs) {
    if (log.is_full_tank) {
      precedingFullTank = log
      break
    } else {
      sumIntermediateFuel += Number(log.fuel_amount) || 0
      if (log.is_missed_previous) {
        // If a partial fill-up marked missed previous, baseline is broken
        return null
      }
    }
  }

  if (!precedingFullTank) {
    // No prior full tank exists
    return null
  }

  const distanceDelta = newLog.odometer - precedingFullTank.odometer
  const totalFuelSinceFull = sumIntermediateFuel + newLog.fuel_amount

  if (distanceDelta <= 0 || totalFuelSinceFull <= 0) {
    return null
  }

  return Number((distanceDelta / totalFuelSinceFull).toFixed(2))
}

/**
 * Deterministically recalculates the entire chronological sequence of fuel logs.
 * Handles partial fill-ups accumulation, baseline resets, and out-of-order edits.
 */
export function recalculateFuelEconomySequence(
  logs: VehicleFuelLogDTO[],
): VehicleFuelLogDTO[] {
  if (!logs || logs.length === 0) return []

  // Create copy and sort ascending by odometer, then date
  const sorted = [...logs].sort((a, b) => {
    if (a.odometer !== b.odometer) return a.odometer - b.odometer
    const dateComp = new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
    if (dateComp !== 0) return dateComp
    return (a.created_at || '').localeCompare(b.created_at || '')
  })

  let lastFullTankLog: VehicleFuelLogDTO | null = null
  let accumulatedFuelSinceFull = 0

  const processed = sorted.map((log) => {
    const fuelAmount = Number(log.fuel_amount) || 0

    if (log.is_missed_previous) {
      lastFullTankLog = log.is_full_tank ? log : null
      accumulatedFuelSinceFull = 0
      return { ...log, calculated_kml: null }
    }

    if (!log.is_full_tank) {
      accumulatedFuelSinceFull += fuelAmount
      return { ...log, calculated_kml: null }
    }

    // Is full tank
    if (!lastFullTankLog) {
      // First full tank acts as baseline
      lastFullTankLog = log
      accumulatedFuelSinceFull = 0
      return { ...log, calculated_kml: null }
    }

    const distance = log.odometer - lastFullTankLog.odometer
    const totalFuel = accumulatedFuelSinceFull + fuelAmount

    let calculated: number | null = null
    if (distance > 0 && totalFuel > 0) {
      calculated = Number((distance / totalFuel).toFixed(2))
    }

    // Reset for next full tank leg
    lastFullTankLog = log
    accumulatedFuelSinceFull = 0

    return { ...log, calculated_kml: calculated }
  })

  return processed
}

/**
 * Calculates aggregated summary stats for fuel tracking dashboard and vehicle detail.
 */
export function calculateFuelStats(
  logs: VehicleFuelLogDTO[],
): FuelStats {
  if (!logs || logs.length === 0) {
    return {
      totalLogs: 0,
      totalCost: 0,
      totalVolume: 0,
      totalTrackedDistance: 0,
      averageEconomy: null,
      lastEconomy: null,
      costPerDistanceUnit: null,
      fullTankCount: 0,
      partialCount: 0,
    }
  }

  let totalCost = 0
  let totalVolume = 0
  let fullTankCount = 0
  let partialCount = 0

  let minOdo = Number.MAX_SAFE_INTEGER
  let maxOdo = 0

  const validEconomies: number[] = []

  for (const log of logs) {
    const cost = Number(log.total_cost) || 0
    const volume = Number(log.fuel_amount) || 0
    totalCost += cost
    totalVolume += volume

    if (log.is_full_tank) {
      fullTankCount++
    } else {
      partialCount++
    }

    if (log.odometer < minOdo) minOdo = log.odometer
    if (log.odometer > maxOdo) maxOdo = log.odometer

    if (typeof log.calculated_kml === 'number' && log.calculated_kml > 0) {
      validEconomies.push(log.calculated_kml)
    }
  }

  const totalTrackedDistance = logs.length >= 2 && maxOdo > minOdo ? maxOdo - minOdo : 0

  const averageEconomy =
    validEconomies.length > 0
      ? Number((validEconomies.reduce((a, b) => a + b, 0) / validEconomies.length).toFixed(2))
      : null

  // Sort descending by odometer to find latest economy
  const sortedDesc = [...logs].sort((a, b) => b.odometer - a.odometer)
  const latestLogWithEconomy = sortedDesc.find(
    (l) => typeof l.calculated_kml === 'number' && l.calculated_kml > 0,
  )
  const lastEconomy = latestLogWithEconomy ? latestLogWithEconomy.calculated_kml : null

  const costPerDistanceUnit =
    totalTrackedDistance > 0
      ? Number((totalCost / totalTrackedDistance).toFixed(2))
      : null

  return {
    totalLogs: logs.length,
    totalCost: Number(totalCost.toFixed(2)),
    totalVolume: Number(totalVolume.toFixed(2)),
    totalTrackedDistance,
    averageEconomy,
    lastEconomy,
    costPerDistanceUnit,
    fullTankCount,
    partialCount,
  }
}
