'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { InvoiceDTO } from '../types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { Button } from '@/components/ui/button';
import {
  LuSearch,
  LuEye,
  LuPencil,
  LuTrash2,
  LuCheck,
  LuPlus,
} from 'react-icons/lu';
import { updateInvoiceStatusAction, deleteInvoiceAction } from '../actions';
import { formatCurrency } from '@/lib/currency';
import { formatAppDate } from '@/lib/date-only';
import { toast } from 'react-toastify';

interface InvoiceTableProps {
  invoices: InvoiceDTO[];
  onSelect: (invoice: InvoiceDTO) => void;
  onEdit: (invoice: InvoiceDTO) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
}

export function InvoiceTable({
  invoices,
  onSelect,
  onEdit,
  onCreateNew,
  onRefresh,
}: InvoiceTableProps) {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || searchParams.get('search') || '';
  const [userSearchTerm, setUserSearchTerm] = useState<string | null>(null);
  const searchTerm = userSearchTerm !== null ? userSearchTerm : queryParam;
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.client_email && inv.client_email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      selectedStatus === 'all' || inv.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });


  const formatDate = (dateString: string) => formatAppDate(dateString);

  const handleMarkPaid = async (e: React.MouseEvent, invoiceId: string) => {
    e.stopPropagation();
    setIsProcessing(true);
    const res = await updateInvoiceStatusAction(invoiceId, 'paid');
    setIsProcessing(false);
    if (res.success) {
      toast.success('Invoice marked as Paid');
      onRefresh();
    } else {
      toast.error(res.error || 'Failed to update status');
    }
  };

  const handleDelete = async (e: React.MouseEvent, invoice: InvoiceDTO) => {
    e.stopPropagation();
    if (!confirm(`Delete invoice #${invoice.invoice_number}?`)) return;

    setIsProcessing(true);
    const res = await deleteInvoiceAction(invoice.id);
    setIsProcessing(false);
    if (res.success) {
      toast.success('Invoice deleted');
      onRefresh();
    } else {
      toast.error(res.error || 'Failed to delete invoice');
    }
  };

  return (
    <div className='space-y-4'>
      {/* Search & Filter Bar */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative flex-1 max-w-md'>
          <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' aria-hidden='true' />
          <input
            type='text'
            placeholder='Search invoice # or client name...'
            value={searchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
            className='w-full rounded-xl border border-border/80 bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
          />
        </div>

        <div className='flex flex-wrap items-center gap-1.5'>
          {['all', 'pending', 'paid', 'overdue', 'draft', 'cancelled'].map((st) => (
            <button
              key={st}
              type='button'
              onClick={() => setSelectedStatus(st)}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                selectedStatus === st
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List / Table */}
      {filteredInvoices.length === 0 ? (
        <div className='flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/50 p-8 text-center'>
          <p className='text-sm text-muted-foreground'>
            {invoices.length === 0
              ? 'No invoices created yet. Click below to issue your first invoice!'
              : 'No invoices match your search or filter.'}
          </p>
          {invoices.length === 0 && (
            <Button onClick={onCreateNew} className='mt-4'>
              <LuPlus className='mr-1.5 size-4' aria-hidden='true' />
              Create First Invoice
            </Button>
          )}
        </div>
      ) : (
        <div className='overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm'>
          {/* Desktop Table View */}
          <div className='hidden overflow-x-auto sm:block'>
            <table className='w-full text-left text-sm'>
              <thead>
                <tr className='border-b border-border/80 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground'>
                  <th className='px-4 py-3.5 font-semibold'>Invoice #</th>
                  <th className='px-4 py-3.5 font-semibold'>Client</th>
                  <th className='px-4 py-3.5 font-semibold'>Issue Date</th>
                  <th className='px-4 py-3.5 font-semibold'>Due Date</th>
                  <th className='px-4 py-3.5 font-semibold text-right'>Amount</th>
                  <th className='px-4 py-3.5 font-semibold'>Status</th>
                  <th className='px-4 py-3.5 text-right font-semibold'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/60'>
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    role='button'
                    tabIndex={0}
                    onClick={() => onSelect(inv)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(inv);
                      }
                    }}
                    className='group cursor-pointer transition-colors hover:bg-muted/40'
                  >
                    <td className='px-4 py-3.5 font-mono font-semibold text-foreground'>
                      #{inv.invoice_number}
                    </td>
                    <td className='px-4 py-3.5 font-medium text-foreground'>
                      <div>{inv.client_name}</div>
                      {inv.client_email && (
                        <div className='text-xs text-muted-foreground'>{inv.client_email}</div>
                      )}
                    </td>
                    <td className='px-4 py-3.5 text-muted-foreground'>
                      {formatDate(inv.issue_date)}
                    </td>
                    <td className='px-4 py-3.5 text-muted-foreground'>
                      {formatDate(inv.due_date)}
                    </td>
                    <td className='px-4 py-3.5 text-right font-bold text-foreground'>
                      {formatCurrency(inv.total_amount, inv.currency)}
                    </td>
                    <td className='px-4 py-3.5'>
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className='px-4 py-3.5 text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        {inv.status !== 'paid' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            title='Mark Paid'
                            disabled={isProcessing}
                            onClick={(e) => handleMarkPaid(e, inv.id)}
                            className='text-emerald-600 hover:bg-emerald-500/10'
                          >
                            <LuCheck className='size-4' />
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          title='View Detail'
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(inv);
                          }}
                        >
                          <LuEye className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          title='Edit Invoice'
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(inv);
                          }}
                        >
                          <LuPencil className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          title='Delete'
                          disabled={isProcessing}
                          onClick={(e) => handleDelete(e, inv)}
                          className='text-rose-500 hover:bg-rose-500/10'
                        >
                          <LuTrash2 className='size-4' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className='divide-y divide-border/60 sm:hidden'>
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                role='button'
                tabIndex={0}
                onClick={() => onSelect(inv)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(inv);
                  }
                }}
                className='flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 cursor-pointer'
              >
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <span className='font-mono text-xs font-bold text-primary'>
                      #{inv.invoice_number}
                    </span>
                    <h3 className='text-sm font-semibold text-foreground'>{inv.client_name}</h3>
                  </div>
                  <InvoiceStatusBadge status={inv.status} />
                </div>

                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>Due: {formatDate(inv.due_date)}</span>
                  <span className='text-sm font-bold text-foreground'>
                    {formatCurrency(inv.total_amount, inv.currency)}
                  </span>
                </div>

                <div className='flex items-center justify-end gap-2 border-t border-border/40 pt-2'>
                  {inv.status !== 'paid' && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={(e) => handleMarkPaid(e, inv.id)}
                      className='h-7 px-2 text-xs text-emerald-600'
                    >
                      <LuCheck className='mr-1 size-3' /> Paid
                    </Button>
                  )}
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(inv);
                    }}
                    className='h-7 px-2 text-xs'
                  >
                    <LuEye className='mr-1 size-3' /> View
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(inv);
                    }}
                    className='h-7 px-2 text-xs'
                  >
                    <LuPencil className='mr-1 size-3' /> Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
