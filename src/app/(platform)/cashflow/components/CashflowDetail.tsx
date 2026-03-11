'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LuPlus,
  LuPencil,
  LuTrash2,
  LuEllipsisVertical,
  LuLoader,
  LuArrowLeft,
  LuShare2,
  LuBookmark,
  LuCheck,
  LuRepeat,
  LuDownload,
} from 'react-icons/lu';
import { toast } from 'react-toastify';
import type { CashflowDTO, CashflowEntryDTO, CashflowBudgetDTO } from '@/types/dto';
import { formatCurrencyCompact } from '@/lib/currency';
import { deleteCashflow, deleteEntry } from '../actions';
import CashflowModal from './CashflowModal';
import EntryModal from './EntryModal';
import ShareModal from './ShareModal';
import { CashflowCharts } from './CashflowCharts';
import { ProjectionsView } from './ProjectionsView';
import { subscribeToPublicCashflow, removeShare } from '../share-actions';
import BudgetManager from './BudgetManager';
import {
  DateFilter,
  resolveFilterRange,
  type DateFilterState,
} from './DateFilter';

interface CashflowDetailProps {
  cashflow: CashflowDTO;
  entries: CashflowEntryDTO[];
  budgets: CashflowBudgetDTO[];
  currency: string | null;
  currentUserId?: string;
  initialUserRole?: 'owner' | 'edit' | 'read' | 'public';
  initialShareId?: string | null;
  initialHasShare?: boolean;
}

export default function CashflowDetail({
  cashflow,
  entries,
  budgets,
  currency,
  currentUserId,
  initialUserRole = 'public',
  initialShareId = null,
  initialHasShare = false,
}: CashflowDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CashflowEntryDTO | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [isDeletingEntryId, setIsDeletingEntryId] = useState<string | null>(
    null,
  );

  const isOwner = currentUserId === cashflow.user_id;

  // Initialize state from server props
  const [hasShare, setHasShare] = useState(initialHasShare);
  const [shareId, setShareId] = useState<string | null>(initialShareId);
  const [userRole] = useState<'owner' | 'edit' | 'read' | 'public'>(
    isOwner ? 'owner' : initialUserRole,
  );

  // ── Date filter ──────────────────────────────────────────────────────────────
  const [filterState, setFilterState] = useState<DateFilterState>({
    preset: 'all-time',
    custom: { from: null, to: null },
  });

  const filteredEntries = useMemo(() => {
    const { from, to } = resolveFilterRange(filterState);
    if (!from && !to) return entries;
    return entries.filter((e) => {
      if (from && e.date < from) return false;
      if (to && e.date > to) return false;
      return true;
    });
  }, [entries, filterState]);
  // ─────────────────────────────────────────────────────────────────────────────

  const canEdit = isOwner || userRole === 'edit';

  // Calculate stats from filtered entries
  const income = filteredEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const expense = filteredEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = income - expense;

  async function handleDeleteCashflow() {
    setIsDeleting(true);
    startTransition(async () => {
      const result = await deleteCashflow(cashflow.id);
      if (result.error) {
        toast.error('Failed to delete cashflow');
        setIsDeleting(false);
        setDeleteDialogOpen(false);
      } else {
        setDeleteDialogOpen(false);
        toast.success('Cashflow deleted');
        router.push('/cashflow');
      }
    });
  }

  async function handleDeleteEntry(entryId: string) {
    setIsDeletingEntryId(entryId);
    startTransition(async () => {
      const result = await deleteEntry(entryId);
      if (result.error) {
        toast.error('Failed to delete entry');
        setIsDeletingEntryId(null);
        setDeletingEntryId(null);
      } else {
        setDeletingEntryId(null);
        toast.success('Entry deleted');
        router.refresh();
        // Keep isDeletingEntryId true to prevent flicker before refresh updates UI
      }
    });
  }

  async function handleBookmark() {
    startTransition(async () => {
      if (hasShare && shareId) {
        // Remove bookmark
        const result = await removeShare(shareId);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Removed from dashboard');
          setHasShare(false);
          setShareId(null);
          router.refresh();
        }
      } else {
        // Add bookmark
        const result = await subscribeToPublicCashflow(cashflow.id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Added to your dashboard');
          setHasShare(true);
          if (result.data) {
            setShareId(result.data.id);
          }
          router.refresh();
        }
      }
    });
  }

  function openEditEntry(entry: CashflowEntryDTO) {
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  }

  function openAddEntry() {
    setEditingEntry(null);
    setIsEntryModalOpen(true);
  }

  function handleExportCSV() {
    if (filteredEntries.length === 0) {
      toast.info('No entries to export');
      return;
    }

    const headers = [
      'Date',
      'Type',
      'Category',
      'Description',
      'Amount',
      'Currency',
      'Recurring',
      'Frequency',
    ];
    const rows = filteredEntries.map((e) => [
      e.date,
      e.type,
      e.category || '',
      `"${e.description.replace(/"/g, '""')}"`, // escape quotes
      e.amount.toString(),
      currency || '',
      e.is_recurring ? 'Yes' : 'No',
      e.recurrence_interval || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    let dateSuffix = 'all-time';
    if (filterState.preset !== 'all-time' && filterState.preset !== 'custom') {
      dateSuffix = filterState.preset;
    } else if (filterState.preset === 'custom') {
      if (filterState.custom.from && filterState.custom.to) {
        dateSuffix = `${filterState.custom.from}_to_${filterState.custom.to}`;
      } else if (filterState.custom.from) {
        dateSuffix = `from_${filterState.custom.from}`;
      } else if (filterState.custom.to) {
        dateSuffix = `to_${filterState.custom.to}`;
      }
    }

    const safeTitle = cashflow.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = `export-${safeTitle}-${dateSuffix}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className='space-y-6'>
      {/* Back Link */}
      {currentUserId && (
        <Link
          href='/cashflow'
          className='inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
        >
          <LuArrowLeft className='w-4 h-4' />
          Back to Cashflows
        </Link>
      )}

      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold tracking-tight'>
              {cashflow.title}
            </h1>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon' className='h-8 w-8'>
                    <LuEllipsisVertical className='w-4 h-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start'>
                  <DropdownMenuItem
                    className='cursor-pointer'
                    onClick={() => setIsShareModalOpen(true)}
                  >
                    <LuShare2 className='w-4 h-4 mr-2' />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='cursor-pointer'
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <LuPencil className='w-4 h-4 mr-2' />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsDeleting(false);
                      setDeleteDialogOpen(true);
                    }}
                    className='text-destructive focus:text-destructive cursor-pointer'
                  >
                    <LuTrash2 className='w-4 h-4 mr-2' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!isOwner && (
              <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full'>
                {userRole === 'edit' ? 'Editor Access' : 'View Only'}
              </span>
            )}
          </div>
          <p className='text-muted-foreground text-sm'>
            {filterState.preset !== 'all-time'
              ? `${filteredEntries.length} of ${entries.length} entries`
              : `${entries.length} entries`}
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={handleExportCSV} className='gap-2'>
            <LuDownload className='w-4 h-4' />
            <span className='hidden sm:inline'>Export CSV</span>
          </Button>

          {!isOwner && currentUserId && (cashflow.is_public || !!shareId) && (
            <Button
              onClick={handleBookmark}
              variant={hasShare ? 'secondary' : 'outline'}
              className={`gap-2 ${hasShare ? 'text-green-600' : ''}`}
              disabled={isPending}
            >
              {isPending ? (
                <LuLoader className='w-4 h-4 animate-spin' />
              ) : hasShare ? (
                <LuCheck className='w-4 h-4' />
              ) : (
                <LuBookmark className='w-4 h-4' />
              )}
              {hasShare ? 'Saved' : 'Add to Dashboard'}
            </Button>
          )}

          {canEdit && (
            <Button onClick={openAddEntry} className='gap-2'>
              <LuPlus className='w-4 h-4' />
              Add Entry
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Income</p>
          <p className='text-2xl font-bold text-green-600'>
            +{formatCurrencyCompact(income, currency)}
          </p>
        </div>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Expense</p>
          <p className='text-2xl font-bold text-red-600'>
            -{formatCurrencyCompact(expense, currency)}
          </p>
        </div>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Balance</p>
          <p
            className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {balance >= 0 ? '+' : ''}
            {formatCurrencyCompact(balance, currency)}
          </p>
        </div>
      </div>

      {/* Date Filter */}
      {entries.length > 0 && (
        <DateFilter
          state={filterState}
          onChange={setFilterState}
          filteredCount={filteredEntries.length}
          totalCount={entries.length}
        />
      )}

      {/* Projections View — always uses unfiltered entries (recurring logic is time-aware) */}
      <ProjectionsView entries={entries} currency={currency} />

      {/* Entries Table */}
      <div className='bg-card border rounded-xl overflow-hidden'>
        {filteredEntries.length === 0 ? (
          <div className='p-12 text-center text-muted-foreground'>
            <p className='text-sm mb-4'>
              {entries.length === 0
                ? 'No entries yet. Add your first transaction.'
                : 'No entries match the selected date range.'}
            </p>
            {entries.length === 0 && (
              <Button onClick={openAddEntry} variant='outline' className='gap-2'>
                <LuPlus className='w-4 h-4' />
                Add Entry
              </Button>
            )}
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[80px] border-r border-border/40'>
                    Date
                  </TableHead>
                  <TableHead className='w-[100px] border-r border-border/40'>
                    Type
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className='text-right'>Amount</TableHead>
                  <TableHead className='w-[80px]'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className='text-muted-foreground text-sm border-r border-border/30'>
                      {(() => {
                        // Parse YYYY-MM-DD directly to avoid UTC timezone shifts
                        const [year, month, day] = entry.date
                          .split('-')
                          .map(Number);
                        const date = new Date(year, month - 1, day);
                        return date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        });
                      })()}
                    </TableCell>
                    <TableCell className='border-r border-border/30'>
                      {entry.is_recurring && (
                        <div className='flex items-center gap-1.5'>
                          <LuRepeat className='w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400' />
                          <div className='flex flex-col items-start'>
                            <div className='text-[10px] font-bold capitalize leading-none text-emerald-600 dark:text-emerald-400'>
                              {entry.recurrence_interval}
                              {entry.recurrence_interval === 'yearly' && (
                                <div>
                                  - {entry.yearly_calculation || 'Prorated'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='font-medium'>{entry.description}</div>
                      {entry.category && (
                        <span className='inline-flex items-center px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground capitalize'>
                          {entry.category}
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {entry.type === 'income' ? '+' : '-'}
                      {formatCurrencyCompact(Number(entry.amount), currency)}
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7'
                            onClick={() => openEditEntry(entry)}
                          >
                            <LuPencil className='w-3.5 h-3.5' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7 text-destructive hover:text-destructive'
                            onClick={() => {
                              setIsDeletingEntryId(null);
                              setDeletingEntryId(entry.id);
                            }}
                          >
                            {isDeletingEntryId === entry.id ? (
                              <LuLoader className='w-3.5 h-3.5 animate-spin' />
                            ) : (
                              <LuTrash2 className='w-3.5 h-3.5' />
                            )}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className='space-y-4'>
        <div>
          <h2 className='text-lg font-bold tracking-tight'>
            Financial Overview
          </h2>
          <p className='text-sm text-muted-foreground'>
            Monthly breakdown of your transactions
          </p>
        </div>
        <CashflowCharts entries={filteredEntries} currency={currency} />
      </div>

      {/* Budget Tracker */}
      <BudgetManager
        cashflowId={cashflow.id}
        budgets={budgets}
        entries={entries}
        currency={currency}
        canEdit={canEdit}
      />

      {/* Edit Cashflow Modal */}
      <CashflowModal
        mode='edit'
        cashflow={cashflow}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      {/* Share Modal */}
      <ShareModal
        cashflow={cashflow}
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
      />

      {/* Entry Modal */}
      <EntryModal
        cashflowId={cashflow.id}
        entry={editingEntry}
        open={isEntryModalOpen}
        onOpenChange={setIsEntryModalOpen}
        currency={currency}
      />

      {/* Delete Cashflow Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cashflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{cashflow.title}&quot; and all
              its entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteCashflow();
              }}
              disabled={isPending}
              className='bg-destructive text-white hover:bg-destructive/90 min-w-[100px]'
            >
              {isDeleting ? (
                <div className='flex items-center gap-2'>
                  <LuLoader className='w-4 h-4 animate-spin' />
                  <span>Deleting...</span>
                </div>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Entry Dialog */}
      <AlertDialog
        open={!!deletingEntryId}
        onOpenChange={() => setDeletingEntryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this entry. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                const id = deletingEntryId;
                if (id) {
                  setIsDeletingEntryId(id);
                  handleDeleteEntry(id);
                }
              }}
              disabled={!!isDeletingEntryId}
              className='bg-destructive text-white hover:bg-destructive/90 min-w-[80px]'
            >
              {isDeletingEntryId ? (
                <div className='flex items-center gap-2'>
                  <LuLoader className='w-3.5 h-3.5 animate-spin' />
                  <span>Deleting...</span>
                </div>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
