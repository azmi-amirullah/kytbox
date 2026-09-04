'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { LuGauge, LuTriangleAlert, LuTrendingUp } from 'react-icons/lu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { VehicleDTO } from '@/types/dto'
import { updateOdometer } from '../actions'
import { formatOdometer } from '../lib/odometer'

interface UpdateOdometerModalProps {
  vehicle: VehicleDTO
  isOpen: boolean
  onClose: () => void
  onSuccess: (updated: VehicleDTO) => void
}

export function UpdateOdometerModal({
  vehicle,
  isOpen,
  onClose,
  onSuccess,
}: UpdateOdometerModalProps) {
  const [odometerInput, setOdometerInput] = useState(String(vehicle.current_odometer))
  const [confirmJump, setConfirmJump] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isTypoWarning, setIsTypoWarning] = useState(false)

  const parsedOdo = parseInt(odometerInput.replace(/\D/g, ''), 10)
  const numericOdo = isNaN(parsedOdo) ? 0 : parsedOdo
  const delta = numericOdo - vehicle.current_odometer
  const isLargeJump = delta > 3000

  function handleClose() {
    if (isPending) return
    setOdometerInput(String(vehicle.current_odometer))
    setConfirmJump(false)
    setErrorMessage(null)
    setIsTypoWarning(false)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (isNaN(parsedOdo) || numericOdo < 0) {
      setErrorMessage('Please enter a valid positive odometer number.')
      return
    }

    if (numericOdo > 2000000) {
      setErrorMessage('Odometer reading exceeds realistic bounds (2,000,000 max).')
      return
    }

    setIsPending(true)

    const res = await updateOdometer({
      vehicleId: vehicle.id,
      odometer: numericOdo,
      confirmOdometerJump: confirmJump,
    })

    setIsPending(false)

    if (!res.success) {
      if (res.isTypoWarning) {
        setIsTypoWarning(true)
        setErrorMessage(res.error || 'Large odometer jump detected. Please confirm to proceed.')
      } else {
        setErrorMessage(res.error || 'Failed to update odometer')
      }
      return
    }

    if (res.data) {
      toast.success(
        `Odometer updated to ${formatOdometer(res.data.current_odometer, res.data.odometer_unit)}`,
      )
      onSuccess(res.data)
      handleClose()
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        }
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-base font-semibold'>
            <LuGauge className='size-4 text-primary' aria-hidden='true' />
            Update Odometer
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Record the latest odometer reading for <strong>{vehicle.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
          {/* Current Reading Reference */}
          <div className='rounded-lg bg-secondary/50 p-3 border border-border/70 flex items-center justify-between'>
            <div>
              <p className='text-[10px] uppercase font-semibold tracking-wider text-muted-foreground'>
                Last Recorded Reading
              </p>
              <p className='text-sm font-mono font-bold text-foreground'>
                {formatOdometer(vehicle.current_odometer, vehicle.odometer_unit)}
              </p>
            </div>
            <span className='rounded-md bg-secondary px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground uppercase'>
              {vehicle.odometer_unit}
            </span>
          </div>

          {/* New Reading Input */}
          <div className='space-y-1.5'>
            <Label htmlFor='newOdometerInput' className='text-xs font-medium'>
              New Odometer Reading ({vehicle.odometer_unit})
            </Label>
            <div className='relative'>
              <Input
                id='newOdometerInput'
                type='number'
                min='0'
                max='2000000'
                step='1'
                value={odometerInput}
                onChange={(e) => {
                  setOdometerInput(e.target.value)
                  setErrorMessage(null)
                  setIsTypoWarning(false)
                }}
                className='font-mono text-base pr-14'
                placeholder='e.g. 18500'
                disabled={isPending}
                required
              />
              <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono uppercase text-muted-foreground select-none pointer-events-none'>
                {vehicle.odometer_unit}
              </span>
            </div>

            {/* Live Delta Feedback */}
            {!isNaN(parsedOdo) && numericOdo >= 0 && (
              <div className='flex items-center gap-1.5 text-xs pt-1'>
                {delta > 0 && (
                  <span className='inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium'>
                    <LuTrendingUp className='size-3.5' aria-hidden='true' />
                    +{delta.toLocaleString()} {vehicle.odometer_unit} logged
                  </span>
                )}
                {delta === 0 && (
                  <span className='text-muted-foreground'>
                    Identical to last recorded reading
                  </span>
                )}
                {delta < 0 && (
                  <span className='inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium'>
                    <LuTriangleAlert className='size-3.5' aria-hidden='true' />
                    {delta.toLocaleString()} {vehicle.odometer_unit} (Typo rollback)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Fat-Finger Typo Warning Banner */}
          {(isTypoWarning || (isLargeJump && !confirmJump)) && (
            <div className='rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2 text-amber-800 dark:text-amber-300'>
              <div className='flex items-start gap-2'>
                <LuTriangleAlert className='size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400' aria-hidden='true' />
                <p className='text-xs leading-relaxed'>
                  You entered an odometer jump of <strong>+{delta.toLocaleString()} {vehicle.odometer_unit}</strong>. Make sure this is not an extra zero typo.
                </p>
              </div>
              <label className='flex items-center gap-2 cursor-pointer text-xs font-medium pt-1'>
                <input
                  type='checkbox'
                  checked={confirmJump}
                  onChange={(e) => {
                    setConfirmJump(e.target.checked)
                    if (e.target.checked) {
                      setErrorMessage(null)
                    }
                  }}
                  className='rounded border-amber-400 text-primary focus:ring-amber-500 size-4'
                />
                <span>I confirm this reading is accurate</span>
              </label>
            </div>
          )}

          {/* General Error Message */}
          {errorMessage && !isTypoWarning && (
            <div className='rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2'>
              <LuTriangleAlert className='size-3.5 shrink-0' aria-hidden='true' />
              <span>{errorMessage}</span>
            </div>
          )}

          <DialogFooter className='pt-2 flex items-center gap-2 sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={isPending}
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              size='sm'
              loading={isPending}
              disabled={isPending || (isLargeJump && !confirmJump)}
            >
              Save Odometer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
