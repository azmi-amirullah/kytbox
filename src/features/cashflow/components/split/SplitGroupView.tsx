'use client';

import { useState, useEffect } from 'react';
import type {
  CashflowSplitGroupDTO,
  CashflowSplitGroupExpenseDTO,
} from '@/types/dto';
import type { NetBalanceResult } from '../../lib/split-math';
import { AddSplitExpenseModal } from './AddSplitExpenseModal';
import { deleteSplitExpenseAction } from '../../split-actions';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import {
  LuPlus,
  LuCopy,
  LuCheck,
  LuTrash2,
  LuHandCoins,
  LuReceipt,
  LuUsers,
  LuArrowRight,
  LuWallet,
} from 'react-icons/lu';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

interface SplitGroupViewProps {
  group: CashflowSplitGroupDTO;
  initialExpenses: CashflowSplitGroupExpenseDTO[];
  initialMath: NetBalanceResult;
}

const DEVICE_STORAGE_KEY = 'kytbox_split_device_token';

export function SplitGroupView({
  group,
  initialExpenses,
  initialMath,
}: SplitGroupViewProps) {
  const [deviceToken, setDeviceToken] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [settlementPreFill, setSettlementPreFill] = useState<{
    from: string;
    to: string;
    amount: number;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Initialize or retrieve device token for ownership
  useEffect(() => {
    let token = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(DEVICE_STORAGE_KEY, token);
    }
    setDeviceToken(token);
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      toast.success('Share link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleOpenSettleModal = (settlement: {
    from: string;
    to: string;
    amount: number;
  }) => {
    setSettlementPreFill(settlement);
    setIsAddModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setSettlementPreFill(null);
    setIsAddModalOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to remove this expense?')) return;
    try {
      setIsDeletingId(expenseId);
      const res = await deleteSplitExpenseAction({
        expenseId,
        deviceToken,
        token: group.token,
      });
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Expense removed');
      }
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className='min-h-screen bg-background text-foreground pb-16'>
      {/* Top Header */}
      <header className='sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md'>
        <div className='max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3'>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <h1 className='text-lg sm:text-xl font-bold truncate text-foreground'>
                {group.title}
              </h1>
              <span className='px-2 py-0.5 text-xs font-semibold rounded bg-muted text-muted-foreground border shrink-0'>
                {group.currency}
              </span>
            </div>
            <p className='text-xs text-muted-foreground mt-0.5'>
              Zero-signup shared expense link
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleCopyLink}
              className='gap-1.5 h-8 text-xs'
            >
              {isCopied ? (
                <LuCheck className='w-3.5 h-3.5 text-emerald-500' />
              ) : (
                <LuCopy className='w-3.5 h-3.5' />
              )}
              <span className='hidden sm:inline'>
                {isCopied ? 'Copied' : 'Share Link'}
              </span>
            </Button>

            <Button
              type='button'
              size='sm'
              onClick={handleOpenAddModal}
              className='gap-1.5 h-8 text-xs'
            >
              <LuPlus className='w-4 h-4' />
              <span>Add Expense</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className='max-w-4xl mx-auto px-4 py-6 space-y-6'>
        {/* KPI Bento Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
          <div className='bg-card border rounded-2xl p-4 shadow-xs flex flex-col justify-between'>
            <span className='text-xs font-medium text-muted-foreground flex items-center gap-1.5'>
              <LuWallet className='w-3.5 h-3.5 text-primary' />
              Total Group Spend
            </span>
            <p className='text-xl sm:text-2xl font-extrabold mt-2 text-foreground'>
              {formatCurrency(initialMath.totalGroupSpend, group.currency)}
            </p>
          </div>

          <div className='bg-card border rounded-2xl p-4 shadow-xs flex flex-col justify-between'>
            <span className='text-xs font-medium text-muted-foreground flex items-center gap-1.5'>
              <LuReceipt className='w-3.5 h-3.5 text-emerald-500' />
              Expenses Logged
            </span>
            <p className='text-xl sm:text-2xl font-extrabold mt-2 text-foreground'>
              {initialExpenses.length}
            </p>
          </div>

          <div className='col-span-2 sm:col-span-1 bg-card border rounded-2xl p-4 shadow-xs flex flex-col justify-between'>
            <span className='text-xs font-medium text-muted-foreground flex items-center gap-1.5'>
              <LuUsers className='w-3.5 h-3.5 text-blue-500' />
              Participants
            </span>
            <p className='text-xl sm:text-2xl font-extrabold mt-2 text-foreground'>
              {initialMath.participants.length}
            </p>
          </div>
        </div>

        {/* Simplified Debt Settlements & Balances */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Net Balances */}
          <div className='bg-card border rounded-2xl p-4 sm:p-5 shadow-xs'>
            <h2 className='text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5'>
              <LuUsers className='w-4 h-4 text-primary' />
              Individual Balances
            </h2>

            {initialMath.balances.length === 0 ? (
              <p className='text-xs text-muted-foreground italic py-4 text-center'>
                No expenses logged yet. Add an expense to start calculating balances!
              </p>
            ) : (
              <div className='divide-y divide-border/50'>
                {initialMath.balances.map((b) => (
                  <div
                    key={b.name}
                    className='py-2.5 flex items-center justify-between text-sm'
                  >
                    <div>
                      <p className='font-semibold text-foreground'>{b.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        Paid {formatCurrency(b.paid, group.currency)} • Share{' '}
                        {formatCurrency(b.share, group.currency)}
                      </p>
                    </div>
                    <div className='text-right'>
                      <span
                        className={cn(
                          'inline-block text-xs font-bold px-2 py-0.5 rounded-full border',
                          b.netBalance > 0.01
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : b.netBalance < -0.01
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        )}
                      >
                        {b.netBalance > 0.01
                          ? `+${formatCurrency(b.netBalance, group.currency)}`
                          : b.netBalance < -0.01
                          ? formatCurrency(b.netBalance, group.currency)
                          : 'Settled Up'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settle Up Suggestions */}
          <div className='bg-card border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between'>
            <div>
              <h2 className='text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5'>
                <LuHandCoins className='w-4 h-4 text-emerald-500' />
                Simplified Debt Payoffs
              </h2>

              {initialMath.settlements.length === 0 ? (
                <div className='py-6 text-center text-xs text-muted-foreground space-y-1'>
                  <p className='font-semibold text-emerald-600 dark:text-emerald-400'>
                    ✨ Everyone is all settled up!
                  </p>
                  <p>No outstanding debts remain in this group.</p>
                </div>
              ) : (
                <div className='space-y-2.5'>
                  {initialMath.settlements.map((s, idx) => (
                    <div
                      key={idx}
                      className='p-3 rounded-xl bg-muted/40 border flex items-center justify-between gap-2'
                    >
                      <div className='min-w-0 flex items-center gap-2 text-xs sm:text-sm font-medium'>
                        <span className='font-bold text-foreground truncate'>
                          {s.from}
                        </span>
                        <LuArrowRight className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
                        <span className='font-bold text-foreground truncate'>
                          {s.to}
                        </span>
                      </div>

                      <div className='flex items-center gap-2 shrink-0'>
                        <span className='font-extrabold text-xs sm:text-sm text-foreground'>
                          {formatCurrency(s.amount, group.currency)}
                        </span>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          className='h-7 text-xs gap-1 rounded-lg'
                          onClick={() => handleOpenSettleModal(s)}
                        >
                          <span>Settle</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className='text-[11px] text-muted-foreground mt-4 border-t pt-2'>
              Settling debts creates a payoff entry that balances IOUs without inflating group spend.
            </p>
          </div>
        </div>

        {/* Expenses Feed */}
        <div className='bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
              <LuReceipt className='w-4 h-4 text-primary' />
              Expense Timeline ({initialExpenses.length})
            </h2>

            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={handleOpenAddModal}
              className='text-xs h-7 gap-1 text-primary'
            >
              <LuPlus className='w-3.5 h-3.5' />
              <span>Add</span>
            </Button>
          </div>

          {initialExpenses.length === 0 ? (
            <div className='text-center py-10 space-y-2'>
              <p className='text-sm font-medium text-muted-foreground'>
                No expenses recorded yet.
              </p>
              <Button
                type='button'
                size='sm'
                onClick={handleOpenAddModal}
                className='gap-1.5 text-xs'
              >
                <LuPlus className='w-3.5 h-3.5' />
                <span>Add the First Expense</span>
              </Button>
            </div>
          ) : (
            <div className='divide-y divide-border/50'>
              {initialExpenses.map((exp) => {
                const isOwner = exp.device_token === deviceToken;
                return (
                  <div
                    key={exp.id}
                    className='py-3 flex items-start justify-between gap-3 text-sm'
                  >
                    <div className='min-w-0 space-y-1'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='font-semibold text-foreground'>
                          {exp.description}
                        </span>
                        {exp.is_settlement ? (
                          <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
                            🤝 Debt Settlement
                          </span>
                        ) : (
                          <span className='text-xs text-muted-foreground'>
                            paid by <strong className='text-foreground'>{exp.paid_by}</strong>
                          </span>
                        )}
                      </div>

                      {!exp.is_settlement && exp.split_between?.length > 0 && (
                        <div className='flex items-center gap-1 text-xs text-muted-foreground flex-wrap'>
                          <span>Split between:</span>
                          {exp.split_between.map((p) => (
                            <span
                              key={p}
                              className='px-1.5 py-0.2 rounded bg-muted text-[11px]'
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className='text-right shrink-0 flex items-center gap-2'>
                      <span className='font-extrabold text-sm sm:text-base text-foreground'>
                        {formatCurrency(exp.amount, group.currency)}
                      </span>
                      {isOwner && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7 text-muted-foreground hover:text-destructive'
                          onClick={() => handleDeleteExpense(exp.id)}
                          disabled={isDeletingId === exp.id}
                          title='Delete your expense'
                        >
                          <LuTrash2 className='w-3.5 h-3.5' />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add Expense Modal */}
      <AddSplitExpenseModal
        groupId={group.id}
        currency={group.currency}
        deviceToken={deviceToken}
        knownParticipants={initialMath.participants}
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
        initialSettlement={settlementPreFill}
      />
    </div>
  );
}
