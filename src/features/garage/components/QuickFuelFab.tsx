'use client'

import { useState } from 'react'
import { LuFuel } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { VehicleDTO } from '@/types/dto'

interface QuickFuelFabProps {
  vehicles: VehicleDTO[]
}

export function QuickFuelFab({ vehicles }: QuickFuelFabProps) {
  const [isOpen, setIsOpen] = useState(false)
  const defaultVehicle = vehicles.find((v) => v.is_default && !v.is_archived) || vehicles[0]

  if (!vehicles || vehicles.length === 0) return null

  return (
    <>
      <div className='fixed bottom-6 right-6 z-40 md:hidden'>
        <Button
          onClick={() => setIsOpen(true)}
          className='flex items-center gap-2 rounded-full shadow-lg shadow-primary/25 px-4 py-2.5 text-xs font-semibold'
          aria-label='Quick Fuel Fill-up'
        >
          <LuFuel className='size-4 text-primary-foreground' aria-hidden='true' />
          <span>Quick Fuel</span>
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-base font-semibold flex items-center gap-2'>
              <LuFuel className='size-5 text-primary' aria-hidden='true' />
              Quick Fuel Fill-up
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Gas station 1-tap logging for {defaultVehicle ? defaultVehicle.name : 'your vehicle'}.
            </DialogDescription>
          </DialogHeader>
          <div className='rounded-lg border border-border/70 bg-secondary/30 p-4 text-xs text-muted-foreground space-y-2'>
            <p className='font-medium text-foreground'>
              ⛽ Fuel Log Engine arriving in Day 5
            </p>
            <p>
              Day 5 will activate the pump-side dual calculator (Cost + Price → Liters auto-calc), full tank vs partial math, and auto-odometer sync for {defaultVehicle?.name || 'your vehicle'}.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsOpen(false)}
              className='text-xs min-h-10'
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
