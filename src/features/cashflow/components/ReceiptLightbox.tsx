'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  LuZoomIn,
  LuZoomOut,
  LuRotateCcw,
  LuDownload,
  LuLoader,
  LuReceipt,
  LuTriangleAlert,
} from 'react-icons/lu'
import { getReceiptSignedUrl } from '../actions'
import { formatCurrencyCompact } from '@/lib/currency'

interface ReceiptLightboxProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashflowId?: string
  entryId?: string | null
  previewUrl?: string | null
  description?: string
  date?: string
  amount?: number
  currency?: string | null
}

export default function ReceiptLightbox({
  open,
  onOpenChange,
  cashflowId,
  entryId,
  previewUrl,
  description = 'Receipt',
  date,
  amount,
  currency,
}: ReceiptLightboxProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(previewUrl ?? null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevEntryId, setPrevEntryId] = useState(entryId)
  const [prevPreviewUrl, setPrevPreviewUrl] = useState(previewUrl)

  if (open !== prevOpen || entryId !== prevEntryId || previewUrl !== prevPreviewUrl) {
    setPrevOpen(open)
    setPrevEntryId(entryId)
    setPrevPreviewUrl(previewUrl)
    setSignedUrl(previewUrl ?? null)
    setError(null)
    setZoom(1)
    setIsLoading(Boolean(open && !previewUrl && cashflowId && entryId))
  }

  useEffect(() => {
    if (!open || previewUrl || !cashflowId || !entryId) return

    let isMounted = true

    getReceiptSignedUrl(cashflowId, entryId)
      .then((res) => {
        if (!isMounted) return
        if (res.error || !res.signedUrl) {
          setError(res.error || 'Failed to load receipt')
        } else {
          setSignedUrl(res.signedUrl)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Error loading receipt')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, entryId, cashflowId, previewUrl])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, prev + 0.5))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(1, prev - 0.5))
  }

  const handleResetZoom = () => {
    setZoom(1)
  }

  const handleDownload = async () => {
    if (!signedUrl) return
    try {
      const res = await fetch(signedUrl)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const sanitizedDesc = description
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
      link.href = blobUrl
      link.download = `receipt-${date || 'entry'}-${sanitizedDesc || 'attachment'}.webp`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(signedUrl, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border rounded-xl shadow-2xl'>
        <DialogHeader className='px-6 py-4 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0'>
          <div className='flex items-center gap-2.5 min-w-0 pr-4'>
            <div className='w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
              <LuReceipt className='w-5 h-5' />
            </div>
            <div className='min-w-0'>
              <DialogTitle className='text-base font-semibold truncate'>
                {description}
              </DialogTitle>
              <div className='flex items-center gap-2 text-xs text-muted-foreground mt-0.5'>
                {date && <span>{date}</span>}
                {typeof amount === 'number' && (
                  <>
                    <span>•</span>
                    <span className='font-medium text-foreground'>
                      {formatCurrencyCompact(amount, currency)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className='flex items-center gap-1.5 shrink-0'>
            {signedUrl && (
              <>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  className='h-8 w-8'
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                  title='Zoom out'
                  aria-label='Zoom out'
                >
                  <LuZoomOut className='w-4 h-4' />
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  className='h-8 w-8'
                  onClick={handleResetZoom}
                  disabled={zoom === 1}
                  title='Reset zoom'
                  aria-label='Reset zoom'
                >
                  <LuRotateCcw className='w-3.5 h-3.5' />
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  className='h-8 w-8'
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  title='Zoom in'
                  aria-label='Zoom in'
                >
                  <LuZoomIn className='w-4 h-4' />
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-8 gap-1.5 ml-1 text-xs'
                  onClick={handleDownload}
                >
                  <LuDownload className='w-3.5 h-3.5' />
                  <span>Download</span>
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

        <div className='flex-1 overflow-auto p-4 flex items-center justify-center min-h-80 max-h-[calc(90vh-130px)] bg-muted/10 relative'>
          {isLoading && (
            <div className='flex flex-col items-center gap-3 text-muted-foreground'>
              <LuLoader className='w-8 h-8 animate-spin text-primary' />
              <p className='text-sm font-medium'>Loading receipt proof...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className='flex flex-col items-center gap-3 text-center max-w-sm p-6 bg-destructive/5 text-destructive rounded-lg border border-destructive/20'>
              <LuTriangleAlert className='w-8 h-8' />
              <p className='text-sm font-semibold'>{error}</p>
              <Button
                variant='outline'
                size='sm'
                className='mt-2'
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          )}

          {!isLoading && !error && signedUrl && (
            <div
              className='transition-transform duration-200 ease-out origin-center flex items-center justify-center'
              style={{
                transform: `scale(${zoom})`,
                cursor: zoom > 1 ? 'grab' : 'default',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={`Receipt for ${description}`}
                className='max-w-full max-h-[calc(90vh-160px)] object-contain rounded-md shadow-md border bg-card'
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
