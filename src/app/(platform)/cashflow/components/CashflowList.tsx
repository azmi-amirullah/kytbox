'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LuPlus, LuWallet, LuChevronRight } from 'react-icons/lu';
import type { Cashflow } from '@/types/supabase';
import { formatCurrencyCompact } from '@/lib/currency';
import CashflowModal from './CashflowModal';

interface CashflowWithSummary extends Cashflow {
  entryCount: number;
  income: number;
  expense: number;
  balance: number;
}

interface CashflowListProps {
  cashflows: CashflowWithSummary[];
  currency: string | null;
}

export default function CashflowList({
  cashflows,
  currency,
}: CashflowListProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Calculate overall stats
  const totalIncome = cashflows.reduce((sum, c) => sum + c.income, 0);
  const totalExpense = cashflows.reduce((sum, c) => sum + c.expense, 0);
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

      {/* Cashflow List */}
      {cashflows.length === 0 ? (
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
        <div className='grid gap-3'>
          {cashflows.map((cashflow) => (
            <Link
              key={cashflow.id}
              href={`/cashflow/${cashflow.id}`}
              className='group bg-card border rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all'
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='p-2.5 rounded-lg bg-emerald-500/10'>
                    <LuWallet className='w-5 h-5 text-emerald-600' />
                  </div>
                  <div>
                    <h2 className='font-semibold text-lg group-hover:text-primary transition-colors'>
                      {cashflow.title}
                    </h2>
                    <div className='flex gap-3 mt-0.5 text-sm text-muted-foreground'>
                      <span>{cashflow.entryCount} entries</span>
                      <span>•</span>
                      <span className='text-green-600'>
                        +{formatCurrencyCompact(cashflow.income, currency)}
                      </span>
                      <span className='text-red-600'>
                        -{formatCurrencyCompact(cashflow.expense, currency)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <span
                    className={`font-semibold ${cashflow.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {cashflow.balance >= 0 ? '+' : ''}
                    {formatCurrencyCompact(cashflow.balance, currency)}
                  </span>
                  <LuChevronRight className='w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all' />
                </div>
              </div>
            </Link>
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
