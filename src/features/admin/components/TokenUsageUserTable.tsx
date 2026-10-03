import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminTokenUsageUserDTO } from '../types';

interface TokenUsageUserTableProps {
  users: AdminTokenUsageUserDTO[];
}

const tokenCountFormatter = new Intl.NumberFormat('en-US');

function formatTokens(tokens: number) {
  return tokenCountFormatter.format(tokens);
}

function getInitials(name: string | null, username: string) {
  return (name || username || 'U').trim().slice(0, 2).toUpperCase();
}

function UserIdentity({ user }: { user: AdminTokenUsageUserDTO }) {
  return (
    <Link
      href={`/admin/usage/users/${user.id}`}
      aria-label={`View token usage history for ${user.displayName || user.username}`}
      className='flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
    >
      <Avatar className='h-10 w-10 shrink-0 border border-border/60'>
        {user.avatarUrl && (
          <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />
        )}
        <AvatarFallback className='text-xs font-semibold'>
          {getInitials(user.displayName, user.username)}
        </AvatarFallback>
      </Avatar>
      <div className='min-w-0'>
        <p className='truncate text-sm font-medium text-foreground hover:underline'>
          {user.displayName || user.username}
        </p>
        <p className='truncate text-xs text-muted-foreground'>@{user.username}</p>
        {user.email && <p className='truncate text-xs text-muted-foreground'>{user.email}</p>}
      </div>
    </Link>
  );
}

export function TokenUsageUserTable({ users }: TokenUsageUserTableProps) {
  if (users.length === 0) {
    return (
      <div className='rounded-xl border border-dashed border-border bg-card/50 p-8 text-center'>
        <h3 className='text-base font-semibold text-foreground'>No users available</h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          User scan and token totals will appear here as Gemini receipt scans are recorded.
        </p>
      </div>
    );
  }

  return (
    <div className='@container space-y-3'>
      <div className='hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm @lg:block'>
        <Table>
          <TableCaption className='sr-only'>
            Gemini receipt scan counts and input and output token totals by user.
          </TableCaption>
          <TableHeader className='bg-muted/40'>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className='text-right'>AI Scans</TableHead>
              <TableHead className='text-right'>Input Tokens</TableHead>
              <TableHead className='text-right'>Output Tokens</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className='transition-colors hover:bg-muted/30 motion-reduce:transition-none'
              >
                <TableCell>
                  <UserIdentity user={user} />
                </TableCell>
                <TableCell className='text-right font-mono text-sm tabular-nums'>
                  {formatTokens(user.scanCount)}
                </TableCell>
                <TableCell className='text-right font-mono text-sm tabular-nums'>
                  {formatTokens(user.inputTokens)}
                </TableCell>
                <TableCell className='text-right font-mono text-sm tabular-nums'>
                  {formatTokens(user.outputTokens)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='space-y-3 @lg:hidden'>
        {users.map((user) => (
          <article
            key={user.id}
            className='space-y-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm'
          >
            <UserIdentity user={user} />
            <dl className='space-y-3 border-t border-border/50 pt-3'>
              <div className='min-w-0'>
                <dt className='text-xs font-medium text-muted-foreground'>AI scans</dt>
                <dd className='mt-1 font-mono text-sm font-semibold tabular-nums text-foreground'>
                  {formatTokens(user.scanCount)}
                </dd>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div className='min-w-0'>
                  <dt className='text-xs font-medium text-muted-foreground'>Input tokens</dt>
                  <dd className='mt-1 truncate font-mono text-sm font-semibold tabular-nums text-foreground'>
                    {formatTokens(user.inputTokens)}
                  </dd>
                </div>
                <div className='min-w-0'>
                  <dt className='text-xs font-medium text-muted-foreground'>Output tokens</dt>
                  <dd className='mt-1 truncate font-mono text-sm font-semibold tabular-nums text-foreground'>
                    {formatTokens(user.outputTokens)}
                  </dd>
                </div>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
