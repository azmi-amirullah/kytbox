import type { InvoiceStatsDTO } from '../types';
import { formatCurrency } from '@/lib/currency';
import { LuReceipt, LuClock, LuCheck, LuTriangle } from 'react-icons/lu';

interface InvoiceStatsProps {
  stats: InvoiceStatsDTO;
  currency?: string;
}

export function InvoiceStats({ stats, currency = 'USD' }: InvoiceStatsProps) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {/* Total Invoiced */}
      <div className='rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm transition-all hover:border-primary/20'>
        <div className='flex items-center justify-between gap-3'>
          <span className='text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
            Total Invoiced
          </span>
          <div className='flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary'>
            <LuReceipt className='size-4' aria-hidden='true' />
          </div>
        </div>
        <p className='mt-3 text-2xl font-bold tracking-tight text-foreground'>
          {formatCurrency(stats.totalInvoiced, currency)}
        </p>
      </div>

      {/* Outstanding */}
      <div className='rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm transition-all hover:border-amber-500/20'>
        <div className='flex items-center justify-between gap-3'>
          <span className='text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
            Outstanding
          </span>
          <div className='flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400'>
            <LuClock className='size-4' aria-hidden='true' />
          </div>
        </div>
        <p className='mt-3 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400'>
          {formatCurrency(stats.totalOutstanding, currency)}
        </p>
      </div>

      {/* Total Paid */}
      <div className='rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm transition-all hover:border-emerald-500/20'>
        <div className='flex items-center justify-between gap-3'>
          <span className='text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
            Total Paid
          </span>
          <div className='flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
            <LuCheck className='size-4' aria-hidden='true' />
          </div>
        </div>
        <p className='mt-3 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400'>
          {formatCurrency(stats.totalPaid, currency)}
        </p>
      </div>

      {/* Overdue Count */}
      <div className='rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm transition-all hover:border-rose-500/20'>
        <div className='flex items-center justify-between gap-3'>
          <span className='text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
            Overdue Invoices
          </span>
          <div className='flex size-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400'>
            <LuTriangle className='size-4' aria-hidden='true' />
          </div>
        </div>
        <p className='mt-3 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400'>
          {stats.overdueCount} {stats.overdueCount === 1 ? 'Invoice' : 'Invoices'}
        </p>
      </div>
    </div>
  );
}
