import { Suspense } from 'react';
import Link from 'next/link';
import { LuBell } from 'react-icons/lu';
import { getSupportTicketSummary } from '@/lib/support-notifications';
import { createClient } from '@/lib/supabase/server';
import { userRoleSchema } from '@/lib/validation.schemas';
import { cn } from '@/lib/utils';

function BellSkeleton() {
  return (
    <Link
      href='/support'
      className='flex items-center justify-center relative h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-secondary/40 border border-border/80 text-foreground hover:bg-secondary/80 transition-all shrink-0'
      aria-label='Support'
      title='Support'
    >
      <LuBell className='h-4 w-4' />
    </Link>
  );
}

interface SupportNotificationBellProps {
  user?: {
    id?: string;
    role?: string | null;
  } | null;
}

async function BellContent({ user: userProp }: SupportNotificationBellProps) {
  let userId = userProp?.id;
  let role = userProp?.role;

  if (userProp === null) {
    return <BellSkeleton />;
  }

  if (!userId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return <BellSkeleton />;
    userId = user.id;

    if (role === undefined) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      role = profile?.role;
    }
  }

  const isAdmin = userRoleSchema.parse(role) === 'admin';

  const { needsAttentionCount } = await getSupportTicketSummary(
    userId,
    isAdmin,
  );

  const hasUnread = needsAttentionCount > 0;

  return (
    <Link
      href={isAdmin ? '/support-admin' : '/support'}
      className={cn(
        'flex items-center justify-center relative h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-secondary/40 border border-border/80 text-foreground hover:bg-secondary/80 transition-all shrink-0',
        hasUnread && 'border-destructive/40 bg-destructive/5 text-destructive shadow-sm shadow-destructive/15'
      )}
      aria-label={
        hasUnread
          ? `${needsAttentionCount} support ticket${needsAttentionCount === 1 ? '' : 's'} need attention`
          : 'Support — no pending tickets'
      }
      title={
        hasUnread
          ? `${needsAttentionCount} ticket${needsAttentionCount === 1 ? '' : 's'} awaiting reply`
          : 'No tickets pending'
      }
    >
      <LuBell className={cn('h-4 w-4 transition-transform duration-200 group-hover:rotate-12', hasUnread && 'text-destructive')} aria-hidden='true' />
      {hasUnread && (
        <span className='absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center'>
          {/* Subtle pulse aura ring */}
          <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75' aria-hidden='true' />
          {/* Badge pill */}
          <span className='relative inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground shadow-sm animate-in fade-in-0 zoom-in-50' aria-hidden='true'>
            {needsAttentionCount > 99 ? '99+' : needsAttentionCount}
          </span>
        </span>
      )}
    </Link>
  );
}

export function SupportNotificationBell({ user }: SupportNotificationBellProps) {
  if (user === null) {
    return <BellSkeleton />;
  }

  return (
    <Suspense fallback={<BellSkeleton />}>
      <BellContent user={user} />
    </Suspense>
  );
}
