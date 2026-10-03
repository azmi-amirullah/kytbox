import type { Metadata } from 'next';
import {
  getAdminTokenUsageOverview,
  TokenUsageUserTable,
  UserPagination,
} from '@/features/admin';

export const metadata: Metadata = {
  title: 'Token Usage | Admin | Kytbox',
};

interface AdminTokenUsagePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const tokenCountFormatter = new Intl.NumberFormat('en-US');

function formatTokens(tokens: number) {
  return tokenCountFormatter.format(tokens);
}

export default async function AdminTokenUsagePage({
  searchParams,
}: AdminTokenUsagePageProps) {
  const resolvedParams = await searchParams;
  const data = await getAdminTokenUsageOverview(resolvedParams);

  return (
    <div className='@container mx-auto w-full max-w-7xl space-y-8 px-4 py-8'>
      <header className='space-y-2'>
        <p className='font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
          Admin overview
        </p>
        <h1 className='text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-foreground'>
          Token Usage
        </h1>
        <p className='max-w-2xl text-sm text-muted-foreground'>
          Lifetime AI scan counts and token totals from Gemini receipt scans.
        </p>
      </header>

      <section
        aria-label='Global AI usage totals'
        className='grid grid-cols-1 gap-4 @md:grid-cols-2 @lg:grid-cols-3'
      >
        <div className='min-w-0 rounded-xl border border-border/80 bg-card p-5 shadow-sm'>
          <p className='text-sm font-medium text-muted-foreground'>AI scans</p>
          <p className='mt-3 font-mono text-[clamp(1.25rem,5vw,1.875rem)] font-semibold tabular-nums text-foreground'>
            {formatTokens(data.totals.scanCount)}
          </p>
          <p className='mt-2 text-xs text-muted-foreground'>Across all users</p>
        </div>
        <div className='min-w-0 rounded-xl border border-border/80 bg-card p-5 shadow-sm'>
          <p className='text-sm font-medium text-muted-foreground'>Input tokens</p>
          <p className='mt-3 font-mono text-[clamp(1.25rem,5vw,1.875rem)] font-semibold tabular-nums text-foreground'>
            {formatTokens(data.totals.inputTokens)}
          </p>
          <p className='mt-2 text-xs text-muted-foreground'>Across all users</p>
        </div>
        <div className='min-w-0 rounded-xl border border-border/80 bg-card p-5 shadow-sm'>
          <p className='text-sm font-medium text-muted-foreground'>Output tokens</p>
          <p className='mt-3 font-mono text-[clamp(1.25rem,5vw,1.875rem)] font-semibold tabular-nums text-foreground'>
            {formatTokens(data.totals.outputTokens)}
          </p>
          <p className='mt-2 text-xs text-muted-foreground'>Across all users</p>
        </div>
      </section>

      <p className='text-sm text-muted-foreground'>
        Scan and token totals start when tracking is enabled. Earlier usage cannot be reconstructed.
      </p>

      <section aria-labelledby='token-usage-users-heading' className='space-y-4'>
        <div>
          <h2 id='token-usage-users-heading' className='text-lg font-semibold text-foreground'>
            Usage by user
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Scan counts and input and output tokens recorded for each account. Select a user to
            view daily or monthly history.
          </p>
        </div>
        <TokenUsageUserTable users={data.users} />
        <UserPagination
          basePath='/admin/usage'
          page={data.page}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          pageSize={data.pageSize}
        />
      </section>
    </div>
  );
}
