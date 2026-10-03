import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminTokenUsageHistoryDTO } from '../types';

interface TokenUsageHistoryProps {
  period: AdminTokenUsageHistoryDTO['period'];
  records: AdminTokenUsageHistoryDTO['records'];
}

const countFormatter = new Intl.NumberFormat('en-US');
const dailyDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const monthlyDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatCount(count: number) {
  return countFormatter.format(count);
}

function formatBucketDate(bucketDate: string, period: TokenUsageHistoryProps['period']) {
  const date = new Date(`${bucketDate}T00:00:00.000Z`);
  return period === 'monthly'
    ? monthlyDateFormatter.format(date)
    : dailyDateFormatter.format(date);
}

export function TokenUsageHistory({ period, records }: TokenUsageHistoryProps) {
  if (records.length === 0) {
    return (
      <div className='rounded-xl border border-dashed border-border bg-card/50 p-8 text-center'>
        <h2 className='text-base font-semibold text-foreground'>No usage recorded yet</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          This account has no AI scan activity in the selected period.
        </p>
      </div>
    );
  }

  const dateLabel = period === 'monthly' ? 'Month' : 'Date';

  return (
    <div className='@container space-y-3'>
      <div className='hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm @lg:block'>
        <Table>
          <TableCaption className='sr-only'>
            AI scan count and input and output token usage by{' '}
            {period === 'daily' ? 'date' : 'month'}.
          </TableCaption>
          <TableHeader className='bg-muted/40'>
            <TableRow>
              <TableHead>{dateLabel}</TableHead>
              <TableHead className='text-right'>AI Scans</TableHead>
              <TableHead className='text-right'>Input Tokens</TableHead>
              <TableHead className='text-right'>Output Tokens</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.bucketDate}>
                <TableCell className='font-medium'>
                  {formatBucketDate(record.bucketDate, period)}
                </TableCell>
                <TableCell className='text-right font-mono text-sm tabular-nums'>
                  {formatCount(record.scanCount)}
                </TableCell>
                <TableCell className='text-right font-mono text-sm tabular-nums'>
                  {formatCount(record.inputTokens)}
                </TableCell>
                <TableCell className='text-right font-mono text-sm tabular-nums'>
                  {formatCount(record.outputTokens)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='space-y-3 @lg:hidden'>
        {records.map((record) => (
          <article
            key={record.bucketDate}
            className='space-y-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm'
          >
            <h2 className='text-sm font-semibold text-foreground'>
              {formatBucketDate(record.bucketDate, period)}
            </h2>
            <dl className='grid grid-cols-2 gap-3 border-t border-border/50 pt-3'>
              <div className='min-w-0'>
                <dt className='text-xs font-medium text-muted-foreground'>AI scans</dt>
                <dd className='mt-1 font-mono text-sm font-semibold tabular-nums text-foreground'>
                  {formatCount(record.scanCount)}
                </dd>
              </div>
              <div className='min-w-0'>
                <dt className='text-xs font-medium text-muted-foreground'>Input tokens</dt>
                <dd className='mt-1 truncate font-mono text-sm font-semibold tabular-nums text-foreground'>
                  {formatCount(record.inputTokens)}
                </dd>
              </div>
              <div className='min-w-0'>
                <dt className='text-xs font-medium text-muted-foreground'>Output tokens</dt>
                <dd className='mt-1 truncate font-mono text-sm font-semibold tabular-nums text-foreground'>
                  {formatCount(record.outputTokens)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
