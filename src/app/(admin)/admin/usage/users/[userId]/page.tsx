import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import {
  getAdminTokenUsageHistory,
  TokenUsageHistory,
  UserPagination,
} from '@/features/admin';

export const metadata: Metadata = {
  title: 'User Token Usage | Admin | Kytbox',
};

interface AdminTokenUsageUserPageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminTokenUsageUserPage({
  params,
  searchParams,
}: AdminTokenUsageUserPageProps) {
  const [{ userId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const data = await getAdminTokenUsageHistory(userId, resolvedSearchParams);
  if (!data) notFound();

  const detailPath = `/admin/usage/users/${data.user.id}`;
  const displayName = data.user.displayName || data.user.username;

  return (
    <div className='@container mx-auto w-full max-w-7xl space-y-8 px-4 py-8'>
      <header className='space-y-4'>
        <Button variant='ghost' size='sm' asChild className='-ml-3 min-h-11'>
          <Link href='/admin/usage'>
            <LuArrowLeft aria-hidden='true' className='mr-2 h-4 w-4' />
            All token usage
          </Link>
        </Button>
        <div className='space-y-2'>
          <p className='font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
            User usage detail
          </p>
          <h1 className='text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-foreground'>
            {displayName}
          </h1>
          <p className='text-sm text-muted-foreground'>@{data.user.username}</p>
        </div>
      </header>

      <section aria-labelledby='usage-history-heading' className='space-y-4'>
        <div className='flex flex-col justify-between gap-4 @md:flex-row @md:items-end'>
          <div>
            <h2 id='usage-history-heading' className='text-lg font-semibold text-foreground'>
              {data.period === 'daily' ? 'Daily usage' : 'Monthly usage'}
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              {data.period === 'daily'
                ? 'Usage is grouped by calendar date in Jakarta time.'
                : 'Usage is grouped by calendar month in Jakarta time.'}
            </p>
          </div>
          <div role='group' aria-label='Usage history period' className='flex gap-2'>
            {(['daily', 'monthly'] as const).map((period) => (
              <Button
                key={period}
                variant={data.period === period ? 'default' : 'outline'}
                size='sm'
                asChild
                className='min-h-11 capitalize'
              >
                <Link
                  href={`${detailPath}?period=${period}`}
                  aria-current={data.period === period ? 'page' : undefined}
                >
                  {period}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <TokenUsageHistory period={data.period} records={data.records} />
        <UserPagination
          basePath={detailPath}
          itemLabel={data.period === 'daily' ? 'dates' : 'months'}
          queryParams={{ period: data.period }}
          page={data.page}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          pageSize={data.pageSize}
        />
      </section>
    </div>
  );
}
