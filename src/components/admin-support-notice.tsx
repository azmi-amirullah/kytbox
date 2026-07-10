import { Suspense } from 'react';
import Link from 'next/link';
import { LuShieldAlert, LuArrowRight } from 'react-icons/lu';
import { getAdminTicketSummary } from '@/lib/admin-notifications';

async function NoticeContent() {
  const { needsAttentionCount } = await getAdminTicketSummary();

  if (needsAttentionCount === 0) return null;

  return (
    <Link
      href='/support-admin'
      className='group flex items-center gap-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all'
    >
      <div className='p-2.5 rounded-lg bg-amber-500/10'>
        <LuShieldAlert className='w-5 h-5 text-amber-600 dark:text-amber-400' />
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold text-amber-700 dark:text-amber-400'>
          {needsAttentionCount} support{' '}
          {needsAttentionCount === 1 ? 'ticket needs' : 'tickets need'} your
          attention
        </p>
        <p className='text-xs text-muted-foreground'>
          Awaiting admin reply
        </p>
      </div>
      <LuArrowRight className='w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform' />
    </Link>
  );
}

export function AdminSupportNotice() {
  return (
    <Suspense fallback={null}>
      <NoticeContent />
    </Suspense>
  );
}
