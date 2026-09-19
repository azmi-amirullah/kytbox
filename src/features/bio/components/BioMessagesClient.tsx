'use client';

import { useState, useTransition, useMemo } from 'react';
import type { BioContactMessageDTO } from '@/types/dto';
import {
  updateBioContactMessageStatus,
  deleteBioContactMessage,
} from '@/features/bio/actions';
import {
  LuMail,
  LuInbox,
  LuArchive,
  LuTrash2,
  LuCircleCheck,
  LuCircle,
  LuSearch,
  LuCopy,
  LuCheck,
  LuX,
  LuMessageSquare,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BioMessagesClientProps {
  initialMessages: BioContactMessageDTO[];
  profileId: string;
  username?: string;
  onUnreadCountChange?: (count: number) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function BioMessagesClient({
  initialMessages,
  onUnreadCountChange,
}: BioMessagesClientProps) {
  const [messages, setMessages] = useState<BioContactMessageDTO[]>(initialMessages);
  const [tab, setTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCopyEmail = (id: string, email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const handleStatusUpdate = (
    messageId: string,
    newStatus: 'unread' | 'read' | 'archived'
  ) => {
    startTransition(async () => {
      const updated = messages.map((m) =>
        m.id === messageId ? { ...m, status: newStatus } : m
      );
      setMessages(updated);
      const newUnread = updated.filter((m) => m.status === 'unread').length;
      onUnreadCountChange?.(newUnread);

      const res = await updateBioContactMessageStatus(messageId, newStatus);
      if (!res.success) {
        setMessages(initialMessages);
        const originalUnread = initialMessages.filter((m) => m.status === 'unread').length;
        onUnreadCountChange?.(originalUnread);
        alert(res.error || 'Failed to update message status');
      }
    });
  };

  const handleDelete = (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message? This cannot be undone.')) return;

    startTransition(async () => {
      const updated = messages.filter((m) => m.id !== messageId);
      setMessages(updated);
      const newUnread = updated.filter((m) => m.status === 'unread').length;
      onUnreadCountChange?.(newUnread);

      const res = await deleteBioContactMessage(messageId);
      if (!res.success) {
        setMessages(initialMessages);
        const originalUnread = initialMessages.filter((m) => m.status === 'unread').length;
        onUnreadCountChange?.(originalUnread);
        alert(res.error || 'Failed to delete message');
      }
    });
  };

  const unreadCount = useMemo(
    () => messages.filter((m) => m.status === 'unread').length,
    [messages]
  );
  const archivedCount = useMemo(
    () => messages.filter((m) => m.status === 'archived').length,
    [messages]
  );
  const inboxCount = useMemo(
    () => messages.filter((m) => m.status !== 'archived').length,
    [messages]
  );

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (tab === 'unread' && m.status !== 'unread') return false;
      if (tab === 'archived' && m.status !== 'archived') return false;
      if (tab === 'all' && m.status === 'archived') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.sender_name.toLowerCase().includes(q);
        const matchEmail = m.sender_email.toLowerCase().includes(q);
        const matchMsg = m.message.toLowerCase().includes(q);
        return matchName || matchEmail || matchMsg;
      }

      return true;
    });
  }, [messages, tab, searchQuery]);

  return (
    <div className='space-y-6'>
      {/* Overview Stat Cards (UI/UX Pro Max) */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {/* Card 1: Total Inquiries */}
        <Card className='p-4 gap-3 bg-card/60 backdrop-blur-md border-border/80 hover:border-primary/30 transition-all shadow-xs relative overflow-hidden group flex flex-col justify-between'>
          <div className='absolute top-0 right-0 w-28 h-28 bg-primary/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none' />
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Total Inquiries
            </span>
            <div className='p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform'>
              <LuMail className='w-4 h-4' />
            </div>
          </div>
          <div>
            <div className='flex items-baseline gap-2'>
              <span className='text-3xl font-bold tracking-tight text-foreground'>
                {messages.length}
              </span>
              <span className='text-xs text-muted-foreground font-medium'>
                received
              </span>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              All contact requests from your bio link.
            </p>
          </div>
        </Card>

        {/* Card 2: Unread Pending */}
        <Card className='p-4 gap-3 bg-card/60 backdrop-blur-md border-border/80 hover:border-amber-500/30 transition-all shadow-xs relative overflow-hidden group flex flex-col justify-between'>
          <div className='absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none' />
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Unread Inquiries
            </span>
            <div className={cn(
              'p-2 rounded-xl transition-transform group-hover:scale-105',
              unreadCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
            )}>
              <LuInbox className='w-4 h-4' />
            </div>
          </div>
          <div>
            <div className='flex items-baseline gap-2'>
              <span className='text-3xl font-bold tracking-tight text-foreground'>
                {unreadCount}
              </span>
              {unreadCount > 0 ? (
                <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold border border-amber-500/20'>
                  Pending reply
                </span>
              ) : (
                <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/20'>
                  <LuCircleCheck className='w-3 h-3' />
                  All caught up
                </span>
              )}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Messages awaiting your attention.
            </p>
          </div>
        </Card>

        {/* Card 3: Archived */}
        <Card className='p-4 gap-3 bg-card/60 backdrop-blur-md border-border/80 hover:border-border transition-all shadow-xs relative overflow-hidden group flex flex-col justify-between'>
          <div className='absolute top-0 right-0 w-28 h-28 bg-muted/20 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none' />
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Archived
            </span>
            <div className='p-2 rounded-xl bg-muted text-muted-foreground group-hover:scale-105 transition-transform'>
              <LuArchive className='w-4 h-4' />
            </div>
          </div>
          <div>
            <div className='flex items-baseline gap-2'>
              <span className='text-3xl font-bold tracking-tight text-foreground'>
                {archivedCount}
              </span>
              <span className='text-xs text-muted-foreground font-medium'>
                archived
              </span>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Stored inquiries for historical reference.
            </p>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border/80 shadow-xs'>
        {/* Filter Pills */}
        <div className='flex items-center gap-1 p-1 bg-muted/60 rounded-xl overflow-x-auto shrink-0'>
          <Button
            type='button'
            variant={tab === 'all' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setTab('all')}
            className='gap-1.5 text-xs font-semibold rounded-lg h-8 px-3 transition-all'
          >
            <LuInbox className='w-3.5 h-3.5' />
            <span>Inbox</span>
            <span className={cn(
              'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
              tab === 'all' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/15 text-muted-foreground'
            )}>
              {inboxCount}
            </span>
          </Button>

          <Button
            type='button'
            variant={tab === 'unread' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setTab('unread')}
            className='gap-1.5 text-xs font-semibold rounded-lg h-8 px-3 transition-all'
          >
            <LuCircle className='w-3.5 h-3.5' />
            <span>Unread</span>
            <span className={cn(
              'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
              tab === 'unread' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/15 text-muted-foreground'
            )}>
              {unreadCount}
            </span>
          </Button>

          <Button
            type='button'
            variant={tab === 'archived' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setTab('archived')}
            className='gap-1.5 text-xs font-semibold rounded-lg h-8 px-3 transition-all'
          >
            <LuArchive className='w-3.5 h-3.5' />
            <span>Archived</span>
            <span className={cn(
              'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
              tab === 'archived' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/15 text-muted-foreground'
            )}>
              {archivedCount}
            </span>
          </Button>
        </div>

        {/* Search Box */}
        <div className='relative flex-1 sm:max-w-xs'>
          <LuSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none' />
          <input
            type='text'
            placeholder='Search name, email, or message...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all'
          />
          {searchQuery && (
            <button
              type='button'
              onClick={() => setSearchQuery('')}
              className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              aria-label='Clear search'
            >
              <LuX className='w-3.5 h-3.5' />
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      {filteredMessages.length === 0 ? (
        <div className='p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center space-y-3'>
          <div className='w-12 h-12 rounded-2xl bg-muted/80 flex items-center justify-center text-muted-foreground'>
            {searchQuery ? (
              <LuSearch className='w-6 h-6' />
            ) : tab === 'unread' ? (
              <LuCircleCheck className='w-6 h-6 text-emerald-500' />
            ) : tab === 'archived' ? (
              <LuArchive className='w-6 h-6' />
            ) : (
              <LuMessageSquare className='w-6 h-6' />
            )}
          </div>
          <div className='space-y-1 max-w-sm'>
            <h4 className='font-bold text-sm sm:text-base text-foreground'>
              {searchQuery
                ? 'No matching inquiries'
                : tab === 'unread'
                ? 'All caught up!'
                : tab === 'archived'
                ? 'Archive is empty'
                : 'No inquiries yet'}
            </h4>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              {searchQuery
                ? `No messages matched "${searchQuery}". Try a different keyword or clear the search.`
                : tab === 'unread'
                ? 'You have reviewed all incoming messages. New inquiries will appear here.'
                : tab === 'archived'
                ? 'Archived messages will appear here for historical reference.'
                : 'When visitors send you messages via your public bio "Get in Touch" form, they will arrive here.'}
            </p>
          </div>
          {searchQuery && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setSearchQuery('')}
              className='text-xs font-semibold rounded-xl'
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className='space-y-3.5'>
          {filteredMessages.map((msg) => {
            const isUnread = msg.status === 'unread';
            const isArchived = msg.status === 'archived';
            const initials = getInitials(msg.sender_name);
            const formattedDate = new Date(msg.created_at).toLocaleDateString(
              undefined,
              {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            );

            return (
              <div
                key={msg.id}
                className={cn(
                  'p-4 sm:p-5 rounded-2xl border transition-all duration-200',
                  isUnread
                    ? 'bg-card border-primary/40 shadow-xs ring-1 ring-primary/20'
                    : 'bg-card/70 border-border/80 hover:border-border'
                )}
              >
                {/* Header row */}
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/50'>
                  <div className='flex items-center gap-3 min-w-0'>
                    {/* Avatar Initials */}
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs',
                      isUnread ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {initials}
                    </div>

                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        {isUnread && (
                          <span className='w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse' title='Unread' />
                        )}
                        <span className='font-bold text-sm text-foreground truncate'>
                          {msg.sender_name}
                        </span>
                      </div>

                      <div className='flex items-center gap-1.5 mt-0.5'>
                        <span className='text-xs text-muted-foreground truncate'>
                          {msg.sender_email}
                        </span>

                        <button
                          type='button'
                          onClick={() => handleCopyEmail(msg.id, msg.sender_email)}
                          className='text-muted-foreground/70 hover:text-foreground p-0.5 rounded transition-colors cursor-pointer'
                          title='Copy email address'
                          aria-label='Copy email address'
                        >
                          {copiedId === msg.id ? (
                            <LuCheck className='w-3 h-3 text-emerald-500' />
                          ) : (
                            <LuCopy className='w-3 h-3' />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <span className='text-[11px] sm:text-xs text-muted-foreground self-start sm:self-auto shrink-0'>
                    {formattedDate}
                  </span>
                </div>

                {/* Message Body */}
                <div className='py-3.5 text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap selection:bg-primary/20'>
                  {msg.message}
                </div>

                {/* Actions Toolbar */}
                <div className='flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50 text-xs'>
                  {/* Left: Quick Reply */}
                  <div className='flex items-center gap-2'>
                    <Button
                      size='sm'
                      asChild
                      className='gap-1.5 rounded-xl font-semibold text-xs shadow-xs h-8 cursor-pointer'
                    >
                      <a
                        href={`mailto:${msg.sender_email}?subject=${encodeURIComponent(
                          'Re: Inquiry from Bio'
                        )}`}
                      >
                        <LuMail className='w-3.5 h-3.5' />
                        <span>Reply via Email</span>
                      </a>
                    </Button>

                    {isUnread ? (
                      <Button
                        type='button'
                        variant='secondary'
                        size='sm'
                        disabled={isPending}
                        onClick={() => handleStatusUpdate(msg.id, 'read')}
                        className='gap-1.5 text-xs font-medium rounded-xl h-8 cursor-pointer'
                      >
                        <LuCircleCheck className='w-3.5 h-3.5' />
                        <span>Mark Read</span>
                      </Button>
                    ) : (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={isPending}
                        onClick={() => handleStatusUpdate(msg.id, 'unread')}
                        className='gap-1.5 text-xs font-medium rounded-xl h-8 cursor-pointer'
                      >
                        <LuCircle className='w-3.5 h-3.5' />
                        <span>Mark Unread</span>
                      </Button>
                    )}
                  </div>

                  {/* Right: Archive & Delete */}
                  <div className='flex items-center gap-1'>
                    {isArchived ? (
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon-sm'
                        disabled={isPending}
                        onClick={() => handleStatusUpdate(msg.id, 'read')}
                        className='rounded-xl text-muted-foreground hover:text-foreground cursor-pointer'
                        aria-label='Move back to Inbox'
                        title='Move back to Inbox'
                      >
                        <LuInbox className='w-4 h-4' />
                      </Button>
                    ) : (
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon-sm'
                        disabled={isPending}
                        onClick={() => handleStatusUpdate(msg.id, 'archived')}
                        className='rounded-xl text-muted-foreground hover:text-foreground cursor-pointer'
                        aria-label='Archive inquiry'
                        title='Archive inquiry'
                      >
                        <LuArchive className='w-4 h-4' />
                      </Button>
                    )}

                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      disabled={isPending}
                      onClick={() => handleDelete(msg.id)}
                      className='rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer'
                      aria-label='Delete inquiry'
                      title='Delete inquiry'
                    >
                      <LuTrash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
