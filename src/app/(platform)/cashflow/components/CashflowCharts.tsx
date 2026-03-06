'use client';

import { useMemo, useState } from 'react';
import { LuChartBarBig, LuTrendingUp, LuChartPie } from 'react-icons/lu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CashflowEntryDTO } from '@/types/dto';
import { aggregateEntriesByMonth } from '../lib/aggregateEntries';
import { aggregateEntriesByCategory } from '../lib/aggregateCategories';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { BalanceTrendChart } from './BalanceTrendChart';
import { CategoryChart } from './CategoryChart';

interface CashflowChartsProps {
  entries: CashflowEntryDTO[];
  currency: string | null;
}

export function CashflowCharts({ entries, currency }: CashflowChartsProps) {
  const [activeTab, setActiveTab] = useState('income-expense');
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>(
    'income',
  );

  const monthlyData = useMemo(
    () => aggregateEntriesByMonth(entries),
    [entries],
  );

  const categoryData = useMemo(
    () => aggregateEntriesByCategory(entries, categoryType),
    [entries, categoryType],
  );

  return (
    <div className='bg-card border rounded-xl p-4 sm:p-6 overflow-hidden'>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        aria-label='Cashflow charts'
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
          <TabsTrigger value='categories' className='gap-1.5'>
            <LuChartPie className='w-3.5 h-3.5' />
            Categories
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'income-expense' && (
        <IncomeExpenseChart data={monthlyData} currency={currency} />
      )}
      {activeTab === 'balance-trend' && (
        <BalanceTrendChart data={monthlyData} currency={currency} />
      )}
      {activeTab === 'categories' && (
        <div className='space-y-4'>
          <div className='flex justify-center'>
            <Tabs
              value={categoryType}
              onValueChange={(val) => {
                if (val === 'income' || val === 'expense') setCategoryType(val);
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
            data={categoryData}
            currency={currency}
            title={`${categoryType === 'income' ? 'Income' : 'Expense'} Breakdown`}
          />
        </div>
      )}
    </div>
  );
}
