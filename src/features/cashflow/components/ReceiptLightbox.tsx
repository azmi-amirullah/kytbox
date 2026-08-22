'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  LuX,
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
  const [isImgLoading, setIsImgLoading] = useState(Boolean(previewUrl || (cashflowId && entryId)))
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
    setIsImgLoading(Boolean(open && (previewUrl || (cashflowId && entryId))))
  }

  useEffect(() => {
    if (!open || previewUrl || !cashflowId || !entryId) return

    let isMounted = true

    getReceiptSignedUrl(cashflowId, entryId)
      .then((res) => {
        if (!isMounted) return
        if (res.error || !res.signedUrl) {
          setError(res.error || 'Failed to load receipt')
          setIsImgLoading(false)
        } else {
          setSignedUrl(res.signedUrl)
          setIsImgLoading(true)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Error loading receipt')
        setIsImgLoading(false)
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
      const ext = blob.type === 'image/jpeg' || blob.type === 'image/jpg' ? 'jpg' : 'webp'
      link.download = `receipt-${date || 'entry'}-${sanitizedDesc || 'attachment'}.${ext}`
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
      <DialogContent className='fixed inset-0 top-0! left-0! translate-x-0! translate-y-0! w-screen! h-dvh! max-w-none! sm:max-w-none! md:max-w-none! lg:max-w-none! rounded-none border-none p-0 m-0 bg-black/60 backdrop-blur-md text-white flex flex-col gap-0 duration-150'>
        {/* Full-width Glassmorphic Header */}
        <DialogHeader className='px-4 sm:px-6 py-3 bg-black/40 backdrop-blur-md border-b border-white/10 flex flex-row items-center justify-between space-y-0 gap-3 text-left shrink-0 z-20'>
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            <div className='w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/10'>
              <LuReceipt className='w-4 h-4 sm:w-5 sm:h-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <DialogTitle className='text-sm sm:text-base font-semibold truncate text-white'>
                {description}
              </DialogTitle>
              <DialogDescription className='sr-only'>
                Receipt preview for {description}
              </DialogDescription>
              <div className='flex items-center gap-1.5 text-xs text-zinc-300 mt-0.5 truncate'>
                {date && <span>{date}</span>}
                {typeof amount === 'number' && (
                  <>
                    <span>•</span>
                    <span className='font-medium text-white'>
                      {formatCurrencyCompact(amount, currency)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action toolbar */}
          <div className='flex items-center gap-2 shrink-0'>
            {signedUrl && !isImgLoading && !isLoading && !error && (
              <div className='hidden sm:flex items-center gap-1.5'>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-zinc-200 hover:text-white hover:bg-white/10 border border-white/15'
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                  title='Zoom out'
                  aria-label='Zoom out'
                >
                  <LuZoomOut className='w-4 h-4' />
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-zinc-200 hover:text-white hover:bg-white/10 border border-white/15'
                  onClick={handleResetZoom}
                  disabled={zoom === 1}
                  title='Reset zoom'
                  aria-label='Reset zoom'
                >
                  <LuRotateCcw className='w-3.5 h-3.5' />
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-zinc-200 hover:text-white hover:bg-white/10 border border-white/15'
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  title='Zoom in'
                  aria-label='Zoom in'
                >
                  <LuZoomIn className='w-4 h-4' />
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='h-8 gap-1.5 ml-1 text-xs text-zinc-100 hover:text-white hover:bg-white/10 border border-white/15'
                  onClick={handleDownload}
                  title='Download receipt'
                >
                  <LuDownload className='w-3.5 h-3.5' />
                  <span>Download</span>
                </Button>
              </div>
            )}

            {/* Close Button */}
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='h-8 w-8 text-zinc-300 hover:text-white hover:bg-white/15 rounded-lg'
              onClick={() => onOpenChange(false)}
              aria-label='Close dialog'
            >
              <LuX className='w-5 h-5' />
            </Button>
          </div>
        </DialogHeader>

        {/* Immersive Viewport Canvas */}
        <div
          className={`flex-1 w-full h-full flex items-center justify-center p-3 sm:p-6 select-none relative ${
            zoom > 1 ? 'overflow-auto cursor-grab' : 'overflow-hidden'
          }`}
        >
          {(isLoading || isImgLoading) && !error && (
            <div className='flex flex-col items-center gap-3 text-zinc-300'>
              <LuLoader className='w-8 h-8 animate-spin text-primary' />
              <p className='text-sm font-medium'>Loading receipt proof...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className='flex flex-col items-center gap-3 text-center max-w-sm p-6 bg-red-950/50 text-red-300 rounded-xl border border-red-500/30 backdrop-blur-md'>
              <LuTriangleAlert className='w-8 h-8 text-red-400' />
              <p className='text-sm font-semibold'>{error}</p>
              <Button
                variant='outline'
                size='sm'
                className='mt-2 border-white/20 text-white hover:bg-white/10'
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          )}

          {!isLoading && !error && signedUrl && (
            <div
              className={
                isImgLoading
                  ? 'hidden'
                  : 'transition-transform duration-200 ease-out origin-center flex items-center justify-center'
              }
              style={{
                transform: `scale(${zoom})`,
                cursor: zoom > 1 ? 'grab' : 'default',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={`Receipt for ${description}`}
                onLoad={() => setIsImgLoading(false)}
                onError={() => {
                  setIsImgLoading(false)
                  setError('Failed to load receipt image')
                }}
                className='max-w-[calc(100vw-3rem)] max-h-[calc(100dvh-85px)] object-contain rounded-lg shadow-2xl ring-1 ring-white/20'
              />
            </div>
          )}

          {/* Floating Mobile Toolbar */}
          {!isLoading && !isImgLoading && !error && signedUrl && (
            <div className='sm:hidden absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 rounded-full bg-zinc-900/90 backdrop-blur-md border border-white/15 shadow-2xl z-20'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-8 w-8 rounded-full text-zinc-300 hover:text-white hover:bg-white/10'
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                title='Zoom out'
                aria-label='Zoom out'
              >
                <LuZoomOut className='w-4 h-4' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-8 w-8 rounded-full text-zinc-300 hover:text-white hover:bg-white/10'
                onClick={handleResetZoom}
                disabled={zoom === 1}
                title='Reset zoom'
                aria-label='Reset zoom'
              >
                <LuRotateCcw className='w-3.5 h-3.5' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-8 w-8 rounded-full text-zinc-300 hover:text-white hover:bg-white/10'
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                title='Zoom in'
                aria-label='Zoom in'
              >
                <LuZoomIn className='w-4 h-4' />
              </Button>
              <div className='w-px h-4 bg-white/20 mx-0.5' />
              <Button
                type='button'
                variant='default'
                size='icon'
                className='h-8 w-8 rounded-full shadow-md'
                onClick={handleDownload}
                title='Download receipt'
                aria-label='Download receipt'
              >
                <LuDownload className='w-3.5 h-3.5' />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
