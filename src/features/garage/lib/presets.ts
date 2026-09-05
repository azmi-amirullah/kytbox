import type {
  FuelType,
  MaintenanceRulePresetItem,
  OdometerUnit,
  TransmissionType,
  VehicleType,
} from '../types'

export type { MaintenanceRulePresetItem }

/**
 * Returns audited maintenance presets tailored to vehicle type, fuel type, transmission, and odometer unit.
 * All presets follow the dual-criterion rule: distance OR months, whichever arrives first.
 */
export function getDefaultRulesForVehicle(
  type: VehicleType,
  fuelType: FuelType,
  unit: OdometerUnit = 'km',
  transmission: TransmissionType = 'automatic'
): MaintenanceRulePresetItem[] {
  const isMiles = unit === 'miles'

  if (type === 'bicycle') {
    return [
      {
        name: 'Chain Clean & Lubrication',
        category: 'powertrain',
        intervalDistance: isMiles ? 120 : 200,
        intervalMonths: 1,
        description: 'Clean drivetrain and re-apply wet/dry chain lube',
        isRecommended: true,
      },
      {
        name: 'Tire Sealant Top-Up',
        category: 'tires',
        intervalDistance: isMiles ? 900 : 1500,
        intervalMonths: 3,
        description: 'Replenish liquid sealant in tubeless tires before drying',
        isRecommended: true,
      },
      {
        name: 'Brake Pads & Cable / Hydraulic Bleed',
        category: 'brakes',
        intervalDistance: isMiles ? 1200 : 2000,
        intervalMonths: 6,
        description: 'Inspect pad thickness and adjust tension or bleed lines',
        isRecommended: true,
      },
      {
        name: 'Chain Stretch & Wear Check',
        category: 'powertrain',
        intervalDistance: isMiles ? 1500 : 2500,
        intervalMonths: 6,
        description: 'Measure 0.5% - 0.75% elongation with chain checker tool',
        isRecommended: true,
      },
      {
        name: 'Bottom Bracket & Headset Overhaul',
        category: 'powertrain',
        intervalDistance: isMiles ? 3000 : 5000,
        intervalMonths: 12,
        description: 'Disassemble, clean, and repack bearing grease',
        isRecommended: false,
      },
    ]
  }

  if (type === 'motorcycle') {
    const list: MaintenanceRulePresetItem[] = [
      {
        name: 'Engine Oil',
        category: 'fluids',
        intervalDistance: isMiles ? 1800 : 3000,
        intervalMonths: 3,
        description: 'Engine oil replacement for high-RPM single/multi-cylinder sump',
        isRecommended: true,
      },
    ]

    if (transmission === 'automatic') {
      list.push({
        name: 'Transmission / Gear Oil',
        category: 'fluids',
        intervalDistance: isMiles ? 3600 : 6000,
        intervalMonths: 6,
        description: 'Final drive gearbox oil for scooters or shaft-drive bikes',
        isRecommended: true,
      })
    }

    list.push(
      {
        name: 'Spark Plug',
        category: 'electrical',
        intervalDistance: isMiles ? 7500 : 12000,
        intervalMonths: 12,
        description: 'Inspect electrode gap, carbon buildup, and replace spark plug',
        isRecommended: true,
      },
      {
        name: 'Engine Air Filter',
        category: 'filters',
        intervalDistance: isMiles ? 11000 : 18000,
        intervalMonths: 18,
        description: 'Replace viscous paper element air filter (do not clean with compressed air)',
        isRecommended: true,
      },
      {
        name: 'Front Brake Pads (Disc)',
        category: 'brakes',
        intervalDistance: isMiles ? 6000 : 10000,
        intervalMonths: 12,
        description: 'Inspect pad friction material (min 2.0mm) and replace worn pads',
        isRecommended: true,
      },
      {
        name: 'Rear Brake Pads / Shoes (Disc / Drum)',
        category: 'brakes',
        intervalDistance: isMiles ? 15000 : 24000,
        intervalMonths: 24,
        description: 'Inspect drum shoes or rear disc pads and replace when wear limit is reached',
        isRecommended: true,
      },
      {
        name: 'Brake Fluid',
        category: 'fluids',
        intervalDistance: isMiles ? 15000 : 24000,
        intervalMonths: 24,
        description: 'Flush DOT 3/4 brake fluid to prevent moisture fade',
        isRecommended: true,
      },
      {
        name: 'Radiator Fluid / Coolant',
        category: 'fluids',
        intervalDistance: isMiles ? 22000 : 36000,
        intervalMonths: 36,
        description: 'Drain and refill pre-mixed long-life coolant (liquid-cooled engines)',
        isRecommended: true,
      }
    )

    if (transmission === 'manual') {
      list.push({
        name: 'Drive Chain Lube & Clean',
        category: 'powertrain',
        intervalDistance: isMiles ? 600 : 1000,
        intervalMonths: 1,
        description: 'For manual/clutch motorcycles with chain & sprockets',
        isRecommended: true,
      })
    } else {
      list.push({
        name: 'CVT Belt & Rollers',
        category: 'powertrain',
        intervalDistance: isMiles ? 15000 : 24000,
        intervalMonths: 24,
        description: 'For automatic scooters: replace belt, sliders, and roller weights',
        isRecommended: true,
      })
    }

    list.push(
      {
        name: 'Front & Rear Tires (Wear & Replacement)',
        category: 'tires',
        intervalDistance: isMiles ? 11000 : 18000,
        intervalMonths: 24,
        description: 'Inspect tread depth (min 1.6mm), dry rot cracks, and replace worn rubber',
        isRecommended: true,
      },
      {
        name: 'Periodic Service',
        category: 'other',
        intervalDistance: isMiles ? 3600 : 6000,
        intervalMonths: 6,
        description: 'Routine dealer tune-up & comprehensive safety inspection',
        isRecommended: true,
      }
    )

    return list
  }

  if (type === 'car') {
    if (fuelType === 'electric') {
      return [
        {
          name: 'Cabin A/C Filter',
          category: 'filters',
          intervalDistance: isMiles ? 10000 : 15000,
          intervalMonths: 12,
          description: 'HEPA or activated carbon cabin air filter replacement',
          isRecommended: true,
        },
        {
          name: 'Tire Rotation & Balance',
          category: 'tires',
          intervalDistance: isMiles ? 6000 : 10000,
          intervalMonths: 6,
          description: 'Rotate front to rear to equalize heavy EV instant-torque wear',
          isRecommended: true,
        },
        {
          name: 'Brake Fluid Flush',
          category: 'fluids',
          intervalDistance: isMiles ? 25000 : 40000,
          intervalMonths: 24,
          description: 'Flush hygroscopic brake fluid even with regenerative braking',
          isRecommended: true,
        },
        {
          name: 'Reduction Gearbox Oil',
          category: 'fluids',
          intervalDistance: isMiles ? 25000 : 40000,
          intervalMonths: 24,
          description: 'Single-speed EV transmission / reduction gear lubricant',
          isRecommended: true,
        },
        {
          name: 'High-Voltage Battery Coolant',
          category: 'fluids',
          intervalDistance: isMiles ? 40000 : 60000,
          intervalMonths: 36,
          description: 'Dedicated low-conductivity coolant loop for traction battery',
          isRecommended: false,
        },
        {
          name: 'Tire Replacement (Full Set)',
          category: 'tires',
          intervalDistance: isMiles ? 20000 : 35000,
          intervalMonths: 36,
          description: 'High-load EV-rated tire replacement (instant torque accelerates wear)',
          isRecommended: false,
        },
        {
          name: 'Periodic Service',
          category: 'other',
          intervalDistance: isMiles ? 6000 : 10000,
          intervalMonths: 12,
          description: 'Scheduled EV multi-point checkup & high-voltage battery diagnostic',
          isRecommended: true,
        },
      ]
    }

    if (fuelType === 'diesel') {
      return [
        {
          name: 'Engine Oil & Filter',
          category: 'fluids',
          intervalDistance: isMiles ? 3000 : 5000,
          intervalMonths: 6,
          description: 'Diesel-rated synthetic engine oil and high-capacity oil filter',
          isRecommended: true,
        },
        {
          name: 'Diesel Fuel Filter (Sedimenter)',
          category: 'filters',
          intervalDistance: isMiles ? 12000 : 20000,
          intervalMonths: 12,
          description: 'Critical water separator & fuel filter to protect common-rail injectors',
          isRecommended: true,
        },
        {
          name: 'Engine Air Filter',
          category: 'filters',
          intervalDistance: isMiles ? 12000 : 20000,
          intervalMonths: 12,
          description: 'Clean air intake filter to prevent turbocharger ingestion wear',
          isRecommended: true,
        },
        {
          name: 'Cabin A/C Filter',
          category: 'filters',
          intervalDistance: isMiles ? 10000 : 15000,
          intervalMonths: 12,
          description: 'Passenger cabin air filter for climate control system',
          isRecommended: true,
        },
        {
          name: 'Tire Rotation & Balance',
          category: 'tires',
          intervalDistance: isMiles ? 6000 : 10000,
          intervalMonths: 6,
          description: 'Rotate front to rear and balance all wheels',
          isRecommended: true,
        },
        {
          name: 'Brake Fluid',
          category: 'fluids',
          intervalDistance: isMiles ? 25000 : 40000,
          intervalMonths: 24,
          description: 'Full fluid bleed to purge water contamination',
          isRecommended: true,
        },
        {
          name: transmission === 'manual' ? 'Manual Transmission Fluid (MTF)' : 'Automatic Transmission Fluid (ATF / CVT)',
          category: 'fluids',
          intervalDistance: isMiles ? 25000 : 40000,
          intervalMonths: transmission === 'manual' ? 36 : 24,
          description: transmission === 'manual'
            ? 'Manual transmission gearbox oil inspection and replacement'
            : 'Automatic transmission or CVT fluid refresh to prevent valve body wear',
          isRecommended: true,
        },
        {
          name: 'Radiator Coolant',
          category: 'fluids',
          intervalDistance: isMiles ? 25000 : 40000,
          intervalMonths: 24,
          description: 'Drain and refill ethylene glycol radiator coolant',
          isRecommended: false,
        },
        {
          name: 'Tire Replacement (Full Set)',
          category: 'tires',
          intervalDistance: isMiles ? 25000 : 40000,
          intervalMonths: 48,
          description: 'Mount and balance new tires once tread wear indicator (TWI) is reached',
          isRecommended: false,
        },
        {
          name: 'Periodic Service',
          category: 'other',
          intervalDistance: isMiles ? 6000 : 10000,
          intervalMonths: 6,
          description: 'Routine dealer periodic service & multi-point safety inspection',
          isRecommended: true,
        },
      ]
    }

    // Petrol and Hybrid
    const baseCarList: MaintenanceRulePresetItem[] = [
      {
        name: 'Engine Oil & Filter',
        category: 'fluids',
        intervalDistance: isMiles ? 3000 : 5000,
        intervalMonths: 6,
        description: 'Engine oil and spin-on/cartridge filter replacement',
        isRecommended: true,
      },
      {
        name: 'Engine Air Filter',
        category: 'filters',
        intervalDistance: isMiles ? 12000 : 20000,
        intervalMonths: 12,
        description: 'Combustion air filter replacement',
        isRecommended: true,
      },
      {
        name: 'Cabin A/C Filter',
        category: 'filters',
        intervalDistance: isMiles ? 10000 : 15000,
        intervalMonths: 12,
        description: 'Passenger compartment air conditioner filter',
        isRecommended: true,
      },
      {
        name: 'Tire Rotation & Balance',
        category: 'tires',
        intervalDistance: isMiles ? 6000 : 10000,
        intervalMonths: 6,
        description: 'Even tire wear pattern maintenance across all corners',
        isRecommended: true,
      },
      {
        name: 'Spark Plugs',
        category: 'electrical',
        intervalDistance: isMiles ? 25000 : 40000,
        intervalMonths: 24,
        description: 'Ignition spark plug inspection / replacement',
        isRecommended: true,
      },
      {
        name: 'Brake Fluid',
        category: 'fluids',
        intervalDistance: isMiles ? 25000 : 40000,
        intervalMonths: 24,
        description: 'Hygroscopic hydraulic brake fluid flush',
        isRecommended: true,
      },
      {
        name: transmission === 'manual' ? 'Manual Transmission Fluid (MTF)' : 'Automatic Transmission Fluid (ATF / CVT)',
        category: 'fluids',
        intervalDistance: isMiles ? 25000 : 40000,
        intervalMonths: transmission === 'manual' ? 36 : 24,
        description: transmission === 'manual'
          ? 'Manual transmission gearbox oil inspection and replacement'
          : 'Prevents valve body and clutch pack wear',
        isRecommended: true,
      },
      {
        name: 'Radiator Coolant',
        category: 'fluids',
        intervalDistance: isMiles ? 25000 : 40000,
        intervalMonths: 24,
        description: 'Long-life anti-freeze and anti-corrosion engine coolant',
        isRecommended: false,
      },
      {
        name: 'Tire Replacement (Full Set)',
        category: 'tires',
        intervalDistance: isMiles ? 25000 : 40000,
        intervalMonths: 48,
        description: 'Mount and balance new tires once tread wear indicator (TWI) is reached',
        isRecommended: false,
      },
      {
        name: 'Periodic Service',
        category: 'other',
        intervalDistance: isMiles ? 6000 : 10000,
        intervalMonths: 6,
        description: 'Routine dealer periodic service & multi-point safety inspection',
        isRecommended: true,
      },
    ]

    if (fuelType === 'hybrid') {
      baseCarList.push({
        name: 'Inverter Coolant',
        category: 'fluids',
        intervalDistance: isMiles ? 30000 : 50000,
        intervalMonths: 36,
        description: 'Dedicated cooling circuit for high-voltage power electronics',
        isRecommended: false,
      })
    }

    return baseCarList
  }

  // Other / Generic Vehicles
  return [
    {
      name: 'General Safety Inspection',
      category: 'other',
      intervalDistance: isMiles ? 6000 : 10000,
      intervalMonths: 12,
      description: 'Comprehensive inspection of chassis, bolts, and controls',
      isRecommended: true,
    },
    {
      name: 'Lubrication & Pivots Check',
      category: 'other',
      intervalDistance: isMiles ? 3000 : 5000,
      intervalMonths: 6,
      description: 'Grease bearings, cables, and mechanical hinge points',
      isRecommended: true,
    },
  ]
}
