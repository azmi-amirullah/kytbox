'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import QuickLogForm from './QuickLogForm'
import type { CashflowWithSummaryDTO } from '@/types/dto'
import type { AccessibleCashflow } from '../access'

interface QuickLogModalProps {
  cashflow: CashflowWithSummaryDTO
  allBooks?: CashflowWithSummaryDTO[]
  defaultCurrency: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * QuickLogModal
 * Dialog wrapper for QuickLogForm to enable 2-second fast entry logging directly
 * from the platform dashboard without full page redirects.
 */
export default function QuickLogModal({
  cashflow,
  allBooks,
  defaultCurrency,
  open,
  onOpenChange,
}: QuickLogModalProps) {
  const router = useRouter()

  const books: AccessibleCashflow[] = (
    allBooks && allBooks.length > 0 ? allBooks : [cashflow]
  ).map((b) => ({
    id: b.id,
    title: b.title,
    role: 'owner',
  }))

  const handleSuccess = () => {
    // Refresh server components on the dashboard to reflect new balance & activities
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='p-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl sm:max-w-md w-full max-h-[92vh] overflow-y-auto gap-0'
        showCloseButton={false}
      >
        <DialogHeader className='sr-only'>
          <DialogTitle>Quick Log: {cashflow.title}</DialogTitle>
          <DialogDescription>
            Record an expense or income in seconds.
          </DialogDescription>
        </DialogHeader>

        <QuickLogForm
          books={books}
          defaultBookId={cashflow.id}
          defaultCurrency={defaultCurrency || 'USD'}
          isModal={true}
          onClose={() => onOpenChange(false)}
          onSuccessCallback={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}

