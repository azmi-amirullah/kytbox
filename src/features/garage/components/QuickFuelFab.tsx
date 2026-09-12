'use client'

import { useState } from 'react'
import { LuFuel } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import type { VehicleDTO } from '@/types/dto'
import { AddFuelLogModal } from './AddFuelLogModal'

interface QuickFuelFabProps {
  vehicles: VehicleDTO[]
  cashflowBooks?: Array<{ id: string; title: string; currency?: string }>
}

export function QuickFuelFab({ vehicles, cashflowBooks = [] }: QuickFuelFabProps) {
  const [isOpen, setIsOpen] = useState(false)
  const defaultVehicle = vehicles.find((v) => v.is_default && !v.is_archived) || vehicles[0]

  if (!vehicles || vehicles.length === 0 || !defaultVehicle) return null

  return (
    <>
      <div className='fixed bottom-6 right-6 z-40 md:hidden'>
        <Button
          onClick={() => setIsOpen(true)}
          className='flex items-center gap-2 rounded-full shadow-lg shadow-primary/25 px-4 py-2.5 text-xs font-semibold cursor-pointer'
          aria-label='Quick Fuel Fill-up'
        >
          <LuFuel className='size-4 text-primary-foreground' aria-hidden='true' />
          <span>Quick Fuel</span>
        </Button>
      </div>

      {isOpen && (
        <AddFuelLogModal
          vehicle={defaultVehicle}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          cashflowBooks={cashflowBooks}
        />
      )}
    </>
  )
}
