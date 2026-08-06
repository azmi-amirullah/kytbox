import type { InvoiceDTO } from '../types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface InvoicePDFViewProps {
  invoice: InvoiceDTO;
}

export function InvoicePDFView({ invoice }: InvoicePDFViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      id={`invoice-document-${invoice.id}`}
      className='invoice-printable-container mx-auto w-full max-w-3xl rounded-2xl border border-border/80 bg-card p-6 text-foreground shadow-sm sm:p-10 print:border-none print:p-0 print:shadow-none'
    >
      {/* Invoice Header */}
      <div className='flex flex-col gap-6 border-b border-border/80 pb-6 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
            {invoice.sender_name || 'INVOICE'}
          </h1>
          {invoice.sender_email && (
            <p className='mt-1 text-xs text-muted-foreground sm:text-sm'>
              {invoice.sender_email}
            </p>
          )}
          {invoice.sender_address && (
            <p className='mt-0.5 whitespace-pre-line text-xs text-muted-foreground sm:text-sm'>
              {invoice.sender_address}
            </p>
          )}
        </div>

        <div className='flex flex-col items-start gap-1.5 sm:items-end'>
          <span className='font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary'>
            INVOICE
          </span>
          <p className='font-mono text-lg font-bold tracking-tight text-foreground sm:text-xl'>
            #{invoice.invoice_number}
          </p>
          <div className='mt-1 flex items-center gap-2 text-xs text-muted-foreground'>
            <span>Issue Date:</span>
            <span className='font-medium text-foreground'>{formatDate(invoice.issue_date)}</span>
          </div>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <span>Due Date:</span>
            <span className='font-medium text-foreground'>{formatDate(invoice.due_date)}</span>
          </div>
          <div className='mt-2'>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>
      </div>

      {/* Billed To Section */}
      <div className='my-6 rounded-xl border border-border/60 bg-muted/30 p-4 sm:p-5'>
        <span className='text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
          Billed To:
        </span>
        <h2 className='mt-1 text-base font-semibold text-foreground sm:text-lg'>
          {invoice.client_name}
        </h2>
        {invoice.client_email && (
          <p className='mt-0.5 text-xs text-muted-foreground sm:text-sm'>
            {invoice.client_email}
          </p>
        )}
        {invoice.client_address && (
          <p className='mt-1 whitespace-pre-line text-xs text-muted-foreground sm:text-sm'>
            {invoice.client_address}
          </p>
        )}
      </div>

      {/* Line Items Table */}
      <div className='overflow-x-auto'>
        <table className='w-full text-left text-xs sm:text-sm'>
          <thead>
            <tr className='border-b border-border/80 text-muted-foreground'>
              <th className='py-3 font-semibold uppercase tracking-wider'>Description</th>
              <th className='py-3 text-right font-semibold uppercase tracking-wider'>Qty</th>
              <th className='py-3 text-right font-semibold uppercase tracking-wider'>Unit Price</th>
              <th className='py-3 text-right font-semibold uppercase tracking-wider'>Amount</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border/60'>
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className='py-3.5 font-medium text-foreground'>{item.description}</td>
                <td className='py-3.5 text-right text-muted-foreground'>{item.quantity}</td>
                <td className='py-3.5 text-right text-muted-foreground'>
                  {formatCurrency(item.unit_price)}
                </td>
                <td className='py-3.5 text-right font-semibold text-foreground'>
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Summary */}
      <div className='mt-6 flex flex-col items-end border-t border-border/80 pt-4'>
        <div className='w-full space-y-2 sm:w-72'>
          <div className='flex justify-between text-xs sm:text-sm text-muted-foreground'>
            <span>Subtotal:</span>
            <span className='font-medium text-foreground'>{formatCurrency(invoice.subtotal)}</span>
          </div>

          {invoice.tax_rate > 0 && (
            <div className='flex justify-between text-xs sm:text-sm text-muted-foreground'>
              <span>Tax ({invoice.tax_rate}%):</span>
              <span className='font-medium text-foreground'>
                {formatCurrency(invoice.tax_amount)}
              </span>
            </div>
          )}

          {invoice.discount_amount > 0 && (
            <div className='flex justify-between text-xs sm:text-sm text-muted-foreground'>
              <span>Discount:</span>
              <span className='font-medium text-rose-500'>
                -{formatCurrency(invoice.discount_amount)}
              </span>
            </div>
          )}

          <div className='flex justify-between border-t border-border/80 pt-3 text-sm sm:text-base font-bold text-foreground'>
            <span>Total Amount Due:</span>
            <span className='text-primary'>{formatCurrency(invoice.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Notes & Payment Info */}
      {(invoice.payment_info || invoice.notes) && (
        <div className='mt-8 grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-2'>
          {invoice.payment_info && (
            <div>
              <span className='text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                Payment Instructions
              </span>
              <p className='mt-1 whitespace-pre-line text-xs leading-relaxed text-foreground sm:text-sm'>
                {invoice.payment_info}
              </p>
            </div>
          )}
          {invoice.notes && (
            <div>
              <span className='text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                Notes & Terms
              </span>
              <p className='mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground sm:text-sm'>
                {invoice.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Signature Block (When include_signature is enabled) */}
      {invoice.include_signature && (
        <div className='mt-10 border-t border-border/80 pt-6'>
          <div className='grid gap-6 sm:grid-cols-2'>
            {/* Issuer Authorization */}
            <div>
              <span className='text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                Authorized By
              </span>
              <div className='mt-8 border-b border-border/80 pb-1'>
                <p className='text-sm font-semibold text-foreground'>
                  {invoice.signatory_name || invoice.sender_name || 'Authorized Signatory'}
                </p>
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>
                Date Signed: {formatDate(invoice.signed_date || invoice.issue_date)}
              </p>
            </div>

            {/* Client Counter-Sign */}
            <div>
              <span className='text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                Client Acknowledgement
              </span>
              <div className='mt-8 border-b border-border/80 pb-1'>
                <p className='text-xs text-muted-foreground/60'>Signature</p>
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>
                Date Signed: ____ / ____ / ________
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
