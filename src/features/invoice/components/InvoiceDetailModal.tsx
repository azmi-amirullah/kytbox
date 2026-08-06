'use client'

import { useState } from 'react'
import { LuLoader } from 'react-icons/lu'
import type { InvoiceDTO } from '../types'
import { InvoicePDFView } from './InvoicePDFView'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LuDownload, LuPencil, LuTrash2, LuCheck } from 'react-icons/lu'
import { updateInvoiceStatusAction, deleteInvoiceAction } from '../actions'
import { toast } from 'react-toastify'

interface InvoiceDetailModalProps {
  invoice: InvoiceDTO | null
  isOpen: boolean
  onClose: () => void
  onEdit: (invoice: InvoiceDTO) => void
  onRefresh: () => void
}

export function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onEdit,
  onRefresh,
}: InvoiceDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!invoice) return null

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const [{ pdf }, { InvoiceDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./InvoiceDocument'),
      ])
      const blob = await pdf(<InvoiceDocument invoice={invoice} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice.invoice_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleMarkAsPaid = async () => {
    setIsUpdating(true)
    const res = await updateInvoiceStatusAction(invoice.id, 'paid')
    setIsUpdating(false)
    if (res.success) {
      toast.success('Invoice marked as paid')
      onRefresh()
    } else {
      toast.error(res.error || 'Failed to update invoice')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    setIsDeleting(true)
    const res = await deleteInvoiceAction(invoice.id)
    setIsDeleting(false)
    if (res.success) {
      toast.success('Invoice deleted')
      onClose()
      onRefresh()
    } else {
      toast.error(res.error || 'Failed to delete invoice')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[92vh] w-[calc(100%-1rem)] max-w-full overflow-y-auto overflow-x-hidden p-4 sm:max-w-4xl sm:p-6'>
        <DialogHeader className='flex flex-row items-center justify-between border-b border-border/80 pb-3'>
          <div>
            <DialogTitle className='text-lg font-bold sm:text-xl'>
              Invoice #{invoice.invoice_number}
            </DialogTitle>
            <DialogDescription className='sr-only'>
              Details and preview for invoice #{invoice.invoice_number}
            </DialogDescription>
          </div>
          <DialogClose onClick={onClose} />
        </DialogHeader>

        {/* Action Buttons Toolbar below Header */}
        <div className='flex flex-wrap items-center gap-2 pt-1 pb-1 print:hidden'>
          {invoice.status !== 'paid' && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleMarkAsPaid}
              disabled={isUpdating}
              className='text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10'
            >
              <LuCheck className='mr-1.5 size-4' aria-hidden='true' />
              Mark Paid
            </Button>
          )}

          <Button
            variant='outline'
            size='sm'
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            title='Download PDF'
          >
            {isDownloading ? (
              <LuLoader
                className='mr-1.5 size-4 animate-spin'
                aria-hidden='true'
              />
            ) : (
              <LuDownload className='mr-1.5 size-4' aria-hidden='true' />
            )}
            {isDownloading ? 'Generating…' : 'Download PDF'}
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              onClose()
              onEdit(invoice)
            }}
          >
            <LuPencil className='mr-1.5 size-4' aria-hidden='true' />
            Edit
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={handleDelete}
            disabled={isDeleting || isUpdating}
            className='text-rose-600 border-rose-500/30 hover:bg-rose-500/10'
          >
            {isDeleting ? (
              <LuLoader
                className='mr-1.5 size-4 animate-spin'
                aria-hidden='true'
              />
            ) : (
              <LuTrash2 className='mr-1.5 size-4' aria-hidden='true' />
            )}
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>

        {/* PDF View Body — horizontal scroll for static uncompacted invoice preview on small screens */}
        <div className='overflow-x-auto py-2'>
          <InvoicePDFView invoice={invoice} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
