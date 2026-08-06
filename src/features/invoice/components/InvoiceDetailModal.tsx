'use client';

import { useState } from 'react';
import type { InvoiceDTO } from '../types';
import { InvoicePDFView } from './InvoicePDFView';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  LuPrinter,
  LuPencil,
  LuTrash2,
  LuCheck,
} from 'react-icons/lu';
import { updateInvoiceStatusAction, deleteInvoiceAction } from '../actions';
import { toast } from 'react-toastify';

interface InvoiceDetailModalProps {
  invoice: InvoiceDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (invoice: InvoiceDTO) => void;
  onRefresh: () => void;
}

export function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onEdit,
  onRefresh,
}: InvoiceDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsPaid = async () => {
    setIsUpdating(true);
    const res = await updateInvoiceStatusAction(invoice.id, 'paid');
    setIsUpdating(false);
    if (res.success) {
      toast.success('Invoice marked as Paid');
      onRefresh();
    } else {
      toast.error(res.error || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete invoice #${invoice.invoice_number}?`)) {
      return;
    }
    setIsUpdating(true);
    const res = await deleteInvoiceAction(invoice.id);
    setIsUpdating(false);
    if (res.success) {
      toast.success('Invoice deleted');
      onClose();
      onRefresh();
    } else {
      toast.error(res.error || 'Failed to delete invoice');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-4xl p-4 sm:p-6'>
        <DialogHeader className='flex flex-col gap-4 border-b border-border/80 pb-4 sm:flex-row sm:items-center sm:justify-between'>
          <DialogTitle className='text-lg font-bold sm:text-xl'>
            Invoice #{invoice.invoice_number}
          </DialogTitle>

          <div className='flex flex-wrap items-center gap-2 print:hidden'>
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
              onClick={handlePrint}
              title='Print / Export PDF'
            >
              <LuPrinter className='mr-1.5 size-4' aria-hidden='true' />
              Print / PDF
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                onClose();
                onEdit(invoice);
              }}
            >
              <LuPencil className='mr-1.5 size-4' aria-hidden='true' />
              Edit
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={handleDelete}
              disabled={isUpdating}
              className='text-rose-600 border-rose-500/30 hover:bg-rose-500/10'
            >
              <LuTrash2 className='mr-1.5 size-4' aria-hidden='true' />
              Delete
            </Button>

            <DialogClose onClick={onClose} />
          </div>
        </DialogHeader>

        {/* Printable View Body */}
        <div className='py-4'>
          <InvoicePDFView invoice={invoice} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
