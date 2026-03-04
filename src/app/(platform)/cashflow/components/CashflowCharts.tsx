'use client';

import { useMemo, useState } from 'react';
import { LuChartBarBig, LuTrendingUp } from 'react-icons/lu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CashflowEntryDTO } from '@/types/dto';
import { aggregateEntriesByMonth } from '../lib/aggregateEntries';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { BalanceTrendChart } from './BalanceTrendChart';

interface CashflowChartsProps {
  entries: CashflowEntryDTO[];
  currency: string | null;
}

export function CashflowCharts({ entries, currency }: CashflowChartsProps) {
  const [activeTab, setActiveTab] = useState('income-expense');

  const monthlyData = useMemo(
    () => aggregateEntriesByMonth(entries),
    [entries],
  );

  return (
    <div className='bg-card border rounded-xl p-4 sm:p-6 overflow-hidden'>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        aria-label='Cashflow charts'
      >
        <TabsList className='mb-4'>
          <TabsTrigger value='income-expense' className='gap-1.5'>
            <LuChartBarBig className='w-3.5 h-3.5' />
            Income vs Expense
          </TabsTrigger>
          <TabsTrigger value='balance-trend' className='gap-1.5'>
            <LuTrendingUp className='w-3.5 h-3.5' />
            Balance Trend
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'income-expense' && (
        <IncomeExpenseChart data={monthlyData} currency={currency} />
      )}
      {activeTab === 'balance-trend' && (
        <BalanceTrendChart data={monthlyData} currency={currency} />
      )}
    </div>
  );
}
