import { LuExternalLink, LuUsers, LuCircleCheck, LuClock } from 'react-icons/lu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserResourceBadges } from './UserResourceBadges';
import type { AdminUserSummaryDTO } from '../types';

interface UserDirectoryTableProps {
  users: AdminUserSummaryDTO[];
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function getInitials(name?: string | null, username?: string) {
  const target = (name || username || 'U').trim();
  return target.slice(0, 2).toUpperCase();
}

export function UserDirectoryTable({ users }: UserDirectoryTableProps) {
  if (users.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-border bg-card/50'>
        <div className='h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground'>
          <LuUsers className='h-6 w-6' />
        </div>
        <h3 className='text-base font-semibold text-foreground'>No users found</h3>
        <p className='text-sm text-muted-foreground mt-1 max-w-sm'>
          No users matched your search criteria. Try a different username, name, or email.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Desktop Table View */}
      <div className='hidden md:block rounded-lg border border-border/80 bg-card overflow-hidden shadow-sm'>
        <Table>
          <TableHeader className='bg-muted/40'>
            <TableRow>
              <TableHead className='w-65'>User</TableHead>
              <TableHead className='w-55'>Email</TableHead>
              <TableHead className='w-25'>Role</TableHead>
              <TableHead className='w-30'>Onboarding</TableHead>
              <TableHead>Resources Owned</TableHead>
              <TableHead className='w-32.5 text-right'>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className='hover:bg-muted/30 transition-colors'>
                {/* User column */}
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-9 w-9 border border-border/60'>
                      {user.avatarUrl && (
                        <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />
                      )}
                      <AvatarFallback className='text-xs font-semibold'>
                        {getInitials(user.displayName, user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-1.5'>
                        <span className='font-medium text-foreground text-sm truncate'>
                          {user.displayName || user.username}
                        </span>
                        <a
                          href={`/${user.username}`}
                          target='_blank'
                          rel='noreferrer'
                          className='text-muted-foreground hover:text-primary transition-colors'
                          title={`View @${user.username}'s bio`}
                          aria-label={`View @${user.username}'s public bio`}
                        >
                          <LuExternalLink className='h-3.5 w-3.5' />
                        </a>
                      </div>
                      <p className='text-xs text-muted-foreground truncate'>
                        @{user.username}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Email */}
                <TableCell className='text-muted-foreground font-mono text-xs truncate max-w-55'>
                  {user.email || <span className='text-muted-foreground/40'>—</span>}
                </TableCell>

                {/* Role */}
                <TableCell>
                  {user.role === 'admin' ? (
                    <Badge variant='default' className='bg-blue-600 hover:bg-blue-700 text-[11px] font-semibold'>
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant='outline' className='text-muted-foreground text-[11px] font-normal'>
                      User
                    </Badge>
                  )}
                </TableCell>

                {/* Onboarding */}
                <TableCell>
                  {user.hasCompletedOnboarding ? (
                    <span className='inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium'>
                      <LuCircleCheck className='h-3.5 w-3.5 shrink-0' />
                      <span>Completed</span>
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium'>
                      <LuClock className='h-3.5 w-3.5 shrink-0' />
                      <span>Pending</span>
                    </span>
                  )}
                </TableCell>

                {/* Resources */}
                <TableCell>
                  <UserResourceBadges counts={user.counts} />
                </TableCell>

                {/* Joined */}
                <TableCell className='text-right text-xs text-muted-foreground whitespace-nowrap'>
                  {formatDate(user.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View (Min 320px responsive) */}
      <div className='md:hidden space-y-3'>
        {users.map((user) => (
          <div
            key={user.id}
            className='rounded-lg border border-border/80 bg-card p-4 shadow-sm space-y-3'
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='flex items-center gap-3 min-w-0'>
                <Avatar className='h-10 w-10 border border-border/60 shrink-0'>
                  {user.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />
                  )}
                  <AvatarFallback className='text-xs font-semibold'>
                    {getInitials(user.displayName, user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0'>
                  <div className='flex items-center gap-1.5'>
                    <span className='font-semibold text-sm text-foreground truncate'>
                      {user.displayName || user.username}
                    </span>
                    <a
                      href={`/${user.username}`}
                      target='_blank'
                      rel='noreferrer'
                      className='text-muted-foreground hover:text-primary transition-colors'
                      aria-label={`View @${user.username}'s public bio`}
                    >
                      <LuExternalLink className='h-3.5 w-3.5' />
                    </a>
                  </div>
                  <p className='text-xs text-muted-foreground truncate'>
                    @{user.username}
                  </p>
                </div>
              </div>

              <div className='shrink-0 flex items-center gap-1.5'>
                {user.role === 'admin' ? (
                  <Badge variant='default' className='bg-blue-600 text-[10px] font-semibold px-2 py-0'>
                    Admin
                  </Badge>
                ) : (
                  <Badge variant='outline' className='text-muted-foreground text-[10px] px-2 py-0'>
                    User
                  </Badge>
                )}
              </div>
            </div>

            {user.email && (
              <p className='text-xs text-muted-foreground font-mono truncate'>
                {user.email}
              </p>
            )}

            <div className='pt-1 border-t border-border/40'>
              <p className='text-[11px] font-medium text-muted-foreground mb-1.5'>Resources:</p>
              <UserResourceBadges counts={user.counts} />
            </div>

            <div className='pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground'>
              <span>Joined {formatDate(user.createdAt)}</span>
              {user.hasCompletedOnboarding ? (
                <span className='inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium'>
                  <LuCircleCheck className='h-3 w-3' />
                  <span>Onboarded</span>
                </span>
              ) : (
                <span className='inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium'>
                  <LuClock className='h-3 w-3' />
                  <span>Pending</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
