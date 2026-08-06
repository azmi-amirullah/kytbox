import type { InvoiceStatus } from '../types';
import { LuCheck, LuClock, LuTriangle, LuFileText, LuX } from 'react-icons/lu';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function InvoiceStatusBadge({ status, className = '' }: InvoiceStatusBadgeProps) {
  switch (status) {
    case 'paid':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 ${className}`}
        >
          <LuCheck className='size-3.5' aria-hidden='true' />
          Paid
        </span>
      );
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 ${className}`}
        >
          <LuClock className='size-3.5' aria-hidden='true' />
          Pending
        </span>
      );
    case 'overdue':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 ${className}`}
        >
          <LuTriangle className='size-3.5' aria-hidden='true' />
          Overdue
        </span>
      );
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground ${className}`}
        >
          <LuX className='size-3.5' aria-hidden='true' />
          Cancelled
        </span>
      );
    case 'draft':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground ${className}`}
        >
          <LuFileText className='size-3.5' aria-hidden='true' />
          Draft
        </span>
      );
  }
}
