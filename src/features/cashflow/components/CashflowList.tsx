'use client';

import { useState } from 'react';
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
import CashflowModal from './CashflowModal';
import ShareModal from './ShareModal';
import { DashboardCharts } from './DashboardCharts';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import type { CashflowWithSummaryDTO } from '@/types/dto';

interface CashflowListProps {
  cashflows: CashflowWithSummaryDTO[];
  currency: string | null;
  currentUserId?: string;
}

export default function CashflowList({
  cashflows,
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

  // Calculate overall stats for OWNED cashflows + INCLUDED shared cashflows
  const ownedCashflows = cashflows.filter((c) => c.user_id === currentUserId);
  const sharedCashflows = cashflows.filter((c) => c.user_id !== currentUserId);

  const flowsToCount = [
    ...ownedCashflows,
    ...sharedCashflows.filter((c) => includedSharedIds.has(c.id)),
  ];

  const totalIncome = flowsToCount.reduce((sum, c) => sum + c.income, 0);
  const totalExpense = flowsToCount.reduce((sum, c) => sum + c.expense, 0);
  const balance = totalIncome - totalExpense;

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
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Total Income</p>
          <p className='text-2xl font-bold text-green-600'>
            +{formatCurrencyCompact(totalIncome, currency)}
          </p>
        </div>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Total Expense</p>
          <p className='text-2xl font-bold text-red-600'>
            -{formatCurrencyCompact(totalExpense, currency)}
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

      {/* Cashflow Sections */}
      {(() => {
        const renderCashflowItem = (cashflow: CashflowWithSummaryDTO) => (
          <div
            key={cashflow.id}
            onClick={() => router.push(`/cashflow/${cashflow.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push(`/cashflow/${cashflow.id}`);
              }
            }}
            role='button'
            tabIndex={0}
            className='group relative bg-card border rounded-2xl p-4 sm:p-5 hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer'
          >
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div className='flex items-center gap-4'>
                <div className='p-3 rounded-xl bg-emerald-500/10 text-emerald-600'>
                  <LuWallet className='w-6 h-6' />
                </div>
                <div className='min-w-0'>
                  <h2 className='font-bold text-lg sm:text-xl group-hover:text-primary transition-colors truncate'>
                    {cashflow.title}
                  </h2>
                  <p className='text-xs sm:text-sm text-muted-foreground font-medium'>
                    {cashflow.entryCount} transactions
                  </p>
                </div>
              </div>

              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-8'>
                <div className='grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-0'>
                  <div className='flex flex-col sm:items-end'>
                    <span className='text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                      Income
                    </span>
                    <span className='text-sm sm:text-base font-semibold text-green-600'>
                      +{formatCurrencyCompact(cashflow.income, currency)}
                    </span>
                  </div>
                  <div className='flex flex-col sm:items-end'>
                    <span className='text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                      Expense
                    </span>
                    <span className='text-sm sm:text-base font-semibold text-red-600'>
                      -{formatCurrencyCompact(cashflow.expense, currency)}
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between sm:justify-end gap-4 p-3 sm:p-0 rounded-xl bg-muted/30 sm:bg-transparent'>
                  <div className='flex flex-col sm:items-end'>
                    <span className='text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider sm:hidden'>
                      Balance
                    </span>
                    <span
                      className={`text-lg sm:text-xl font-black tracking-tight ${cashflow.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {cashflow.balance >= 0 ? '+' : ''}
                      {formatCurrencyCompact(cashflow.balance, currency)}
                    </span>
                  </div>

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
                          className='h-8 w-8 rounded-full cursor-pointer focus-visible:ring-0 focus-visible:ring-offset-0'
                        >
                          <LuEllipsisVertical className='w-4 h-4' />
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
                    <div className='flex items-center gap-2'>
                      <div className='h-6 w-px bg-border mx-1' />
                      <div
                        className='flex items-center gap-2 mr-2'
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                          }
                        }}
                        role='presentation'
                      >
                        <Switch
                          id={`include-${cashflow.id}`}
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
        <DashboardCharts
          cashflows={cashflows}
          includedSharedIds={includedSharedIds}
          currentUserId={currentUserId}
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
