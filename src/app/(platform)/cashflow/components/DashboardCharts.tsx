'use client';

import { useMemo, useState } from 'react';
import type { CashflowWithSummaryDTO } from '@/types/dto';
import { aggregateEntriesByMonth } from '../lib/aggregateEntries';
import { LuChartBarBig, LuTrendingUp, LuWallet } from 'react-icons/lu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { BalanceTrendChart } from './BalanceTrendChart';
import { CategoryChart } from './CategoryChart';

interface DashboardChartsProps {
  cashflows: CashflowWithSummaryDTO[];
  includedSharedIds: Set<string>;
  currentUserId?: string;
  currency: string | null;
}

const DASHBOARD_COLORS = [
  'var(--chart-1)', // Rust
  'var(--chart-2)', // Indigo
  'oklch(0.65 0.2 145)', // Green
  'oklch(0.75 0.2 80)', // Yellow/Amber
  'oklch(0.65 0.15 210)', // Cyan/Teal
  'oklch(0.65 0.25 15)', // Coral Red
  'oklch(0.6 0.15 300)', // Purple
  'oklch(0.7 0.15 40)', // Orange
  'oklch(0.6 0.15 250)', // Light Blue
  'oklch(0.65 0.2 330)', // Pink
];

export function DashboardCharts({
  cashflows,
  includedSharedIds,
  currentUserId,
  currency,
}: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState('income-expense');
  const [cashflowType, setCashflowType] = useState<'income' | 'expense'>(
    'income',
  );

  const activeCashflows = useMemo(() => {
    const owned = cashflows.filter((c) => c.user_id === currentUserId);
    const includedShared = cashflows.filter(
      (c) => c.user_id !== currentUserId && includedSharedIds.has(c.id),
    );
    return [...owned, ...includedShared];
  }, [cashflows, includedSharedIds, currentUserId]);

  const entries = useMemo(() => {
    return activeCashflows.flatMap((c) => c.entries);
  }, [activeCashflows]);

  const monthlyData = useMemo(
    () => aggregateEntriesByMonth(entries),
    [entries],
  );

  const cashflowData = useMemo(() => {
    return activeCashflows
      .map((c, index) => ({
        name: c.title,
        value: cashflowType === 'income' ? c.income : c.expense,
        fill: DASHBOARD_COLORS[index % DASHBOARD_COLORS.length],
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [activeCashflows, cashflowType]);

  if (monthlyData.length === 0) return null;

  return (
    <div className='bg-card border rounded-xl p-4 sm:p-6 overflow-hidden'>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        aria-label='Dashboard charts'
      >
        <TabsList className='mb-4 flex-wrap'>
          <TabsTrigger value='income-expense' className='gap-1.5'>
            <LuChartBarBig className='w-3.5 h-3.5' />
            Income vs Expense
          </TabsTrigger>
          <TabsTrigger value='balance-trend' className='gap-1.5'>
            <LuTrendingUp className='w-3.5 h-3.5' />
            Balance Trend
          </TabsTrigger>
          <TabsTrigger value='cashflows' className='gap-1.5'>
            <LuWallet className='w-3.5 h-3.5' />
            Cashflows
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'income-expense' && (
        <IncomeExpenseChart data={monthlyData} currency={currency} />
      )}
      {activeTab === 'balance-trend' && (
        <BalanceTrendChart data={monthlyData} currency={currency} />
      )}
      {activeTab === 'cashflows' && (
        <div className='space-y-4'>
          <div className='flex justify-center'>
            <Tabs
              value={cashflowType}
              onValueChange={(val) => {
                if (val === 'income' || val === 'expense') setCashflowType(val);
              }}
              className='w-auto'
            >
              <TabsList className='h-8'>
                <TabsTrigger value='income' className='text-xs px-3'>
                  Income
                </TabsTrigger>
                <TabsTrigger value='expense' className='text-xs px-3'>
                  Expense
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CategoryChart
            data={cashflowData}
            currency={currency}
            title={`${cashflowType === 'income' ? 'Income' : 'Expense'} by Cashflow`}
          />
        </div>
      )}
    </div>
  );
}
