'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LuPlus, LuWallet } from 'react-icons/lu';
import type { Cashflow, CashflowEntry } from '@/types/database';
import CashflowModal from './CashflowModal';
import CashflowCard from './CashflowCard';

interface CashflowDashboardProps {
  initialCashflows: Cashflow[];
  initialEntries: CashflowEntry[];
  currentUserId?: string;
  currency: string | null;
}

export default function CashflowDashboard({
  initialCashflows,
  initialEntries,
  currentUserId,
  currency,
}: CashflowDashboardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Calculate overall stats
  const totalIncome = initialEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpense = initialEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Cashflow</h1>
          <p className='text-muted-foreground text-sm'>
            Track your income and expenses
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className='gap-2'>
          <LuPlus className='w-4 h-4' />
          New Cashflow
        </Button>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Total Income</p>
          <p className='text-2xl font-bold text-green-600'>
            +{totalIncome.toLocaleString()}
          </p>
        </div>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Total Expense</p>
          <p className='text-2xl font-bold text-red-600'>
            -{totalExpense.toLocaleString()}
          </p>
        </div>
        <div className='bg-card border rounded-xl p-4'>
          <p className='text-sm text-muted-foreground'>Balance</p>
          <p
            className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {balance >= 0 ? '+' : ''}
            {balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Cashflow List */}
      {initialCashflows.length === 0 ? (
        <div className='bg-card border border-dashed rounded-xl p-12 text-center'>
          <div className='mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4'>
            <LuWallet className='w-6 h-6 text-muted-foreground' />
          </div>
          <h3 className='font-semibold mb-1'>No cashflows yet</h3>
          <p className='text-sm text-muted-foreground mb-4'>
            Create your first cashflow to start tracking
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)} className='gap-2'>
            <LuPlus className='w-4 h-4' />
            Create Cashflow
          </Button>
        </div>
      ) : (
        <div className='space-y-6'>
          {initialCashflows.map((cashflow) => (
            <CashflowCard
              key={cashflow.id}
              cashflow={cashflow}
              currentUserId={currentUserId}
              entries={initialEntries.filter(
                (e) => e.cashflow_id === cashflow.id,
              )}
              currency={currency}
            />
          ))}
        </div>
      )}

      {/* Create Cashflow Modal */}
      <CashflowModal
        mode='create'
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
