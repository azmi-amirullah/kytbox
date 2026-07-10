import { Suspense } from 'react';
import Link from 'next/link';
import { LuBell } from 'react-icons/lu';
import { getAdminTicketSummary } from '@/lib/admin-notifications';

async function BellContent() {
  const { needsAttentionCount } = await getAdminTicketSummary();

  return (
    <Link
      href='/support-admin'
      className='relative inline-flex items-center justify-center p-2 rounded-full hover:bg-secondary/80 transition-colors'
      aria-label={
        needsAttentionCount > 0
          ? `${needsAttentionCount} support tickets need attention`
          : 'Support admin — no tickets pending'
      }
      title={
        needsAttentionCount > 0
          ? `${needsAttentionCount} ticket${needsAttentionCount === 1 ? '' : 's'} awaiting reply`
          : 'No tickets pending'
      }
    >
      <LuBell className='w-[18px] h-[18px]' />
      {needsAttentionCount > 0 && (
        <span className='absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground animate-in fade-in-0 zoom-in-50'>
          {needsAttentionCount > 99 ? '99+' : needsAttentionCount}
        </span>
      )}
    </Link>
  );
}

export function AdminNotificationBell() {
  return (
    <Suspense fallback={null}>
      <BellContent />
    </Suspense>
  );
}
