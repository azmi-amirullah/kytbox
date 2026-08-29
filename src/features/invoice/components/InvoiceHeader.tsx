import { Button } from '@/components/ui/button'
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav'
import { LuPlus, LuFileText } from 'react-icons/lu'

interface InvoiceHeaderProps {
  onCreateNew: () => void
}

export function InvoiceHeader({ onCreateNew }: InvoiceHeaderProps) {
  return (
    <div className='space-y-1.5 sm:space-y-2'>
      <BreadcrumbNav />
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='flex items-center gap-3'>
            <div className='flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0'>
              <LuFileText className='size-5' aria-hidden='true' />
            </div>
            <h1 className='text-2xl font-bold tracking-[-0.04em] text-emerald-600 dark:text-emerald-400 sm:text-3xl'>
              Invoice
            </h1>
          </div>

          <p className='mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm'>
            Create professional billing invoices, track payments, and export PDF
            statements.
          </p>
        </div>

        <Button onClick={onCreateNew} size='lg' className='px-5'>
          <LuPlus className='mr-1.5 size-4' aria-hidden='true' />
          Create Invoice
        </Button>
      </div>
    </div>
  )
}
