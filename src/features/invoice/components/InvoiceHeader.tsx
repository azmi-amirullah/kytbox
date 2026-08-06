import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LuPlus, LuFileText, LuChevronRight } from 'react-icons/lu';

interface InvoiceHeaderProps {
  onCreateNew: () => void;
}

export function InvoiceHeader({ onCreateNew }: InvoiceHeaderProps) {
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <div>
        <nav aria-label='Breadcrumb' className='flex items-center gap-1 text-xs text-muted-foreground mb-3 sm:text-sm'>
          <Link href='/app' className='hover:text-foreground transition-colors'>
            Kytbox
          </Link>
          <LuChevronRight className='size-3 opacity-60' aria-hidden='true' />
          <span className='font-semibold text-emerald-600 dark:text-emerald-400'>Invoices</span>
        </nav>

        <div className='flex items-center gap-3'>
          <div className='flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0'>
            <LuFileText className='size-5' aria-hidden='true' />
          </div>
          <h1 className='text-2xl font-bold tracking-[-0.04em] text-emerald-600 dark:text-emerald-400 sm:text-3xl'>
            Invoices & Billing
          </h1>
        </div>

        <p className='mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm'>
          Create professional billing invoices, track payments, and export PDF statements.
        </p>
      </div>

      <Button onClick={onCreateNew} size='lg' className='px-5'>
        <LuPlus className='mr-1.5 size-4' aria-hidden='true' />
        Create Invoice
      </Button>
    </div>
  );
}
