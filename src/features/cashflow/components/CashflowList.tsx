'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LuPlus,
  LuWallet,
  LuEllipsisVertical,
  LuShare2,
  LuPencil,
  LuTrash2,
  LuLoader,
} from 'react-icons/lu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'react-toastify';
import { deleteCashflow } from '../actions';
import { toggleCashflowInclusion } from '../actions';
// import type { Cashflow } from '@/types/supabase';
import { formatCurrencyCompact } from '@/lib/currency';
import dynamic from 'next/dynamic';
import CashflowModal from './CashflowModal';
import ShareModal from './ShareModal';
import { Loader } from '@/components/ui/loader';
const CashflowCharts = dynamic(
  () => import('./CashflowCharts').then((mod) => mod.CashflowCharts),
  {
    ssr: false,
    loading: () => (
      <Loader
        className='min-h-90 py-12 bg-card border rounded-xl'
        text='Loading financial overview...'
      />
    ),
  },
);
import { CashflowSummaryStats } from './CashflowSummaryStats';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import type { CashflowWithSummaryDTO, CashflowChartAggregateDTO } from '@/types/dto';

interface CashflowListProps {
  cashflows: CashflowWithSummaryDTO[];
  aggregates?: CashflowChartAggregateDTO[];
  currency: string | null;
  currentUserId?: string;
}

export default function CashflowList({
  cashflows,
  aggregates = [],
  currency,
  currentUserId,
}: CashflowListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(action === 'add');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeCashflow, setActiveCashflow] =
    useState<CashflowWithSummaryDTO | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [prevAction, setPrevAction] = useState(action);

  if (action !== prevAction) {
    setPrevAction(action);
    if (action === 'add') {
      setIsCreateModalOpen(true);
    }
  }

  const handleCreateOpenChange = (open: boolean) => {
    setIsCreateModalOpen(open);
    if (!open && action === 'add') {
      const params = new URLSearchParams(window.location.search);
      params.delete('action');
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }
  };

  // Initialize from props
  const [includedSharedIds, setIncludedSharedIds] = useState<Set<string>>(
    () => {
      const included = new Set<string>();
      cashflows.forEach((c) => {
        if (c.user_id !== currentUserId && c.isIncluded) {
          included.add(c.id);
        }
      });
      return included;
    },
  );

  const ownedCashflows = useMemo(
    () => cashflows.filter((c) => c.user_id === currentUserId),
    [cashflows, currentUserId],
  );

  const sharedCashflows = useMemo(
    () => cashflows.filter((c) => c.user_id !== currentUserId),
    [cashflows, currentUserId],
  );

  // Calculate overall stats for OWNED cashflows + INCLUDED shared cashflows
  const flowsToCount = useMemo(() => {
    const shared = sharedCashflows.filter((c) => includedSharedIds.has(c.id));
    return [...ownedCashflows, ...shared];
  }, [ownedCashflows, sharedCashflows, includedSharedIds]);

  const totalIncome = flowsToCount.reduce((sum, c) => sum + c.income, 0);
  const totalExpense = flowsToCount.reduce((sum, c) => sum + c.expense, 0);
  const balance = totalIncome - totalExpense;

  const activeCashflowIds = useMemo(() => {
    return new Set(flowsToCount.map((c) => c.id));
  }, [flowsToCount]);

  const activeAggregates = useMemo(() => {
    return aggregates.filter((a) => activeCashflowIds.has(a.cashflow_id));
  }, [aggregates, activeCashflowIds]);

  async function handleToggleInclusion(cashflowId: string) {
    // Optimistic update
    const isIncluded = !includedSharedIds.has(cashflowId);

    setIncludedSharedIds((prev) => {
      const next = new Set(prev);
      if (isIncluded) {
        next.add(cashflowId);
      } else {
        next.delete(cashflowId);
      }
      return next;
    });

    // Server update
    const result = await toggleCashflowInclusion(cashflowId, isIncluded);
    if (result?.error) {
      toast.error('Failed to save preference');
      // Revert if failed
      setIncludedSharedIds((prev) => {
        const next = new Set(prev);
        if (!isIncluded) {
          next.add(cashflowId);
        } else {
          next.delete(cashflowId);
        }
        return next;
      });
    } else {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!activeCashflow) return;
    setIsDeleting(true);
    const result = await deleteCashflow(activeCashflow.id);
    if (result.error) {
      toast.error('Failed to delete cashflow');
      setIsDeleting(false);
    } else {
      setDeleteDialogOpen(false);
      toast.success('Cashflow deleted');
      router.refresh();
      // We don't setIsDeleting(false) here because the dialog is closing
    }
  }

  function openShare(e: React.MouseEvent, cashflow: CashflowWithSummaryDTO) {
    e.stopPropagation();
    setActiveCashflow(cashflow);
    setIsShareModalOpen(true);
  }

  function openEdit(e: React.MouseEvent, cashflow: CashflowWithSummaryDTO) {
    e.stopPropagation();
    setActiveCashflow(cashflow);
    setIsEditModalOpen(true);
  }

  function openDelete(e: React.MouseEvent, cashflow: CashflowWithSummaryDTO) {
    e.stopPropagation();
    setActiveCashflow(cashflow);
    setIsDeleting(false);
    setDeleteDialogOpen(true);
  }

  return (
    <div className='space-y-6'>
      {/* Breadcrumbs */}
      <div>
        <nav aria-label='breadcrumb' className='flex items-center gap-1 text-sm text-muted-foreground mb-2'>
          <Link
            href='/app'
            className='hover:text-foreground transition-colors'
          >
            Kytbox
          </Link>
          <span className='text-muted-foreground'>/</span>
          <span aria-current='page' className='text-foreground font-medium'>Cashflow</span>
        </nav>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-foreground'>
              Cashflow
            </h1>
            <p className='text-muted-foreground mt-1'>
              Track your income and expenses
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className='gap-2'>
            <LuPlus className='w-4 h-4' />
            New Cashflow
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <CashflowSummaryStats
        income={totalIncome}
        expense={totalExpense}
        balance={balance}
        currency={currency}
      />

      {/* Cashflow Sections */}
      {(() => {
        const renderCashflowItem = (cashflow: CashflowWithSummaryDTO) => (
          <div
            key={cashflow.id}
            className='group relative bg-card border rounded-2xl p-4 sm:p-5 hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden'
          >
            <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full min-w-0'>
              {/* Title & Icon & Actions Header */}
              <div className='flex items-center justify-between gap-3 min-w-0 flex-1'>
                <div className='flex items-center gap-3.5 min-w-0'>
                  <div className='p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0'>
                    <LuWallet className='w-5 h-5 sm:w-6 sm:h-6' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h2 className='font-bold text-base sm:text-lg lg:text-xl group-hover:text-primary transition-colors truncate'>
                      <Link
                        href={`/cashflow/${cashflow.id}`}
                        className='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm'
                      >
                        {cashflow.title}
                      </Link>
                    </h2>
                    <p className='text-xs sm:text-sm text-muted-foreground font-medium truncate'>
                      {cashflow.entryCount} transactions
                    </p>
                  </div>
                </div>

                {/* Action Menu on Mobile/Tablet */}
                <div className='lg:hidden shrink-0 flex items-center'>
                  {currentUserId === cashflow.user_id ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                      >
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 rounded-full cursor-pointer'
                          aria-label={'Actions for ' + cashflow.title}
                        >
                          <LuEllipsisVertical className='w-4 h-4' aria-hidden='true' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        onCloseAutoFocus={(e) => e.preventDefault()}
                      >
                        <DropdownMenuItem
                          className='cursor-pointer'
                          onClick={(e) => openShare(e, cashflow)}
                        >
                          <LuShare2 className='w-3.5 h-3.5 mr-2' />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className='cursor-pointer'
                          onClick={(e) => openEdit(e, cashflow)}
                        >
                          <LuPencil className='w-3.5 h-3.5 mr-2' />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className='text-destructive focus:text-destructive cursor-pointer'
                          onClick={(e) => openDelete(e, cashflow)}
                        >
                          <LuTrash2 className='w-3.5 h-3.5 mr-2' />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div
                      className='flex items-center gap-2'
                    >
                      <Switch
                        id={`include-mobile-${cashflow.id}`}
                        aria-label={`Include ${cashflow.title} in totals`}
                        checked={includedSharedIds.has(cashflow.id)}
                        onCheckedChange={() =>
                          handleToggleInclusion(cashflow.id)
                        }
                        className='scale-75 data-[state=checked]:bg-primary'
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Section: Grid of 3 columns */}
              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/50 shrink-0 min-w-0'>
                <div className='grid grid-cols-3 gap-2 sm:gap-4 flex-1 min-w-0'>
                  {/* Income */}
                  <div className='flex flex-col min-w-0 lg:items-end'>
                    <span className='text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate'>
                      Income
                    </span>
                    <span className='text-xs sm:text-sm lg:text-base font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums truncate'>
                      +{formatCurrencyCompact(cashflow.income, currency)}
                    </span>
                  </div>

                  {/* Expense */}
                  <div className='flex flex-col min-w-0 lg:items-end'>
                    <span className='text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate'>
                      Expense
                    </span>
                    <span className='text-xs sm:text-sm lg:text-base font-semibold text-rose-600 dark:text-rose-400 tabular-nums truncate'>
                      -{formatCurrencyCompact(cashflow.expense, currency)}
                    </span>
                  </div>

                  {/* Balance */}
                  <div className='flex flex-col min-w-0 lg:items-end'>
                    <span className='text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate'>
                      Balance
                    </span>
                    <span
                      className={cn(
                        'text-xs sm:text-sm lg:text-base font-black tracking-tight tabular-nums truncate',
                        cashflow.balance >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      )}
                    >
                      {cashflow.balance >= 0 ? '+' : ''}
                      {formatCurrencyCompact(cashflow.balance, currency)}
                    </span>
                  </div>
                </div>

                {/* Desktop Action Menu */}
                <div className='hidden lg:flex items-center shrink-0 pl-2'>
                  {currentUserId === cashflow.user_id ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                      >
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 rounded-full cursor-pointer'
                          aria-label={'Actions for ' + cashflow.title}
                        >
                          <LuEllipsisVertical className='w-4 h-4' aria-hidden='true' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        onCloseAutoFocus={(e) => e.preventDefault()}
                      >
                        <DropdownMenuItem
                          className='cursor-pointer'
                          onClick={(e) => openShare(e, cashflow)}
                        >
                          <LuShare2 className='w-3.5 h-3.5 mr-2' />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className='cursor-pointer'
                          onClick={(e) => openEdit(e, cashflow)}
                        >
                          <LuPencil className='w-3.5 h-3.5 mr-2' />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className='text-destructive focus:text-destructive cursor-pointer'
                          onClick={(e) => openDelete(e, cashflow)}
                        >
                          <LuTrash2 className='w-3.5 h-3.5 mr-2' />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div
                      className='flex items-center gap-2'
                    >
                      <Switch
                        id={`include-${cashflow.id}`}
                        aria-label={`Include ${cashflow.title} in totals`}
                        checked={includedSharedIds.has(cashflow.id)}
                        onCheckedChange={() =>
                          handleToggleInclusion(cashflow.id)
                        }
                        className='scale-75 data-[state=checked]:bg-primary'
                      />
                      <Label
                        htmlFor={`include-${cashflow.id}`}
                        className='cursor-pointer text-[10px] font-medium text-muted-foreground uppercase tracking-wider'
                      >
                        Include
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

        if (cashflows.length === 0) {
          return (
            <div className='bg-card border border-dashed rounded-xl p-12 text-center'>
              <div className='mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4'>
                <LuWallet className='w-6 h-6 text-muted-foreground' />
              </div>
              <h3 className='font-semibold mb-1'>No cashflows yet</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Create your first cashflow to start tracking
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className='gap-2'
              >
                <LuPlus className='w-4 h-4' />
                Create Cashflow
              </Button>
            </div>
          );
        }

        return (
          <div className='space-y-8'>
            {/* My Cashflows */}
            {ownedCashflows.length > 0 && (
              <div className='space-y-4'>
                <div className='grid gap-4'>
                  {ownedCashflows.map(renderCashflowItem)}
                </div>
              </div>
            )}

            {/* Shared With Me Section */}
            {sharedCashflows.length > 0 && (
              <div className='space-y-4'>
                <div className='flex items-center gap-2 mb-2 pt-2'>
                  <div className='p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500'>
                    <LuShare2 className='w-4 h-4' />
                  </div>
                  <h2 className='text-lg font-bold tracking-tight'>
                    Shared with me
                  </h2>
                </div>
                <div className='grid gap-4'>
                  {sharedCashflows.map(renderCashflowItem)}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Dashboard Charts */}
      <div className='space-y-4'>
        <div>
          <h2 className='text-lg font-bold tracking-tight'>
            Financial Overview
          </h2>
          <p className='text-sm text-muted-foreground'>
            Monthly breakdown of your transactions
          </p>
        </div>
        <CashflowCharts
          aggregates={activeAggregates}
          cashflows={flowsToCount}
          currency={currency}
        />
      </div>

      {/* Modals */}
      <CashflowModal
        mode='create'
        open={isCreateModalOpen}
        onOpenChange={handleCreateOpenChange}
      />

      <CashflowModal
        mode='edit'
        cashflow={activeCashflow}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      {activeCashflow && (
        <ShareModal
          cashflow={activeCashflow}
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cashflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{activeCashflow?.title}&quot;
              and all its entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
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
    </div>
  );
}
