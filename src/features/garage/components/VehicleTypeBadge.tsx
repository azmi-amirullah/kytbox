import { LuCar, LuBike, LuGauge } from 'react-icons/lu'
import type { VehicleType } from '@/types/dto'

interface VehicleTypeBadgeProps {
  type: VehicleType
  className?: string
}

export function VehicleTypeBadge({ type, className = '' }: VehicleTypeBadgeProps) {
  const getIcon = () => {
    switch (type) {
      case 'car':
        return <LuCar className='size-3.5 shrink-0' aria-hidden='true' />
      case 'motorcycle':
      case 'bicycle':
        return <LuBike className='size-3.5 shrink-0' aria-hidden='true' />
      case 'other':
      default:
        return <LuGauge className='size-3.5 shrink-0' aria-hidden='true' />
    }
  }

  const getLabel = () => {
    switch (type) {
      case 'car':
        return 'Car'
      case 'motorcycle':
        return 'Motorcycle'
      case 'bicycle':
        return 'Bicycle'
      case 'other':
      default:
        return 'Vehicle'
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/50 px-2.5 py-0.5 text-xs font-medium text-foreground ${className}`}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </span>
  )
}
