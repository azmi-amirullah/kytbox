'use client';

import { useMemo, useState } from 'react';
import {
  LuChartBarBig,
  LuTrendingUp,
  LuChartPie,
  LuArrowLeftRight,
  LuWallet,
} from 'react-icons/lu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CashflowEntryDTO, CashflowWithSummaryDTO } from '@/types/dto';
import { aggregateEntriesByMonth } from '../lib/aggregateEntries';
import { aggregateEntriesByCategory } from '../lib/aggregateCategories';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { BalanceTrendChart } from './BalanceTrendChart';
import { CategoryChart } from './CategoryChart';
import { MonthlyComparison } from './MonthlyComparison';
import { ResponsiveTabsList } from './ResponsiveTabsList';

interface CashflowChartsProps {
  entries: CashflowEntryDTO[];
  cashflows?: CashflowWithSummaryDTO[];
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

export function CashflowCharts({ entries, cashflows, currency }: CashflowChartsProps) {
  const [activeTab, setActiveTab] = useState('income-expense');
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense');
  const [cashflowType, setCashflowType] = useState<'income' | 'expense' | 'balance'>('income');

  const monthlyData = useMemo(
    () => aggregateEntriesByMonth(entries),
    [entries],
  );

  const categoryData = useMemo(
    () => aggregateEntriesByCategory(entries, categoryType),
    [entries, categoryType],
  );

  const cashflowDistributionData = useMemo(() => {
    if (!cashflows || cashflows.length === 0) return [];
    return cashflows
      .map((c, index) => ({
        name: c.title,
        value:
          cashflowType === 'income'
            ? c.income
            : cashflowType === 'expense'
              ? c.expense
              : c.income - c.expense,
        fill: DASHBOARD_COLORS[index % DASHBOARD_COLORS.length],
      }))
      .filter((d) => d.value >= 0)
      .sort((a, b) => b.value - a.value);
  }, [cashflows, cashflowType]);

  const hasCashflows = Boolean(cashflows && cashflows.length > 0);

  const tabs = useMemo(() => {
    const baseTabs = [
      { value: 'income-expense', label: 'Income vs Expense', icon: LuChartBarBig },
      { value: 'balance-trend', label: 'Balance Trend', icon: LuTrendingUp },
      { value: 'categories', label: 'Categories', icon: LuChartPie },
      { value: 'comparison', label: 'Compare Months', icon: LuArrowLeftRight },
    ];
    if (hasCashflows) {
      baseTabs.push({ value: 'cashflows', label: 'Cashflows', icon: LuWallet });
    }
    return baseTabs;
  }, [hasCashflows]);

  if (entries.length === 0 && (!cashflows || cashflows.length === 0)) {
    return (
      <div className='bg-card border rounded-xl p-8 text-center flex flex-col items-center justify-center'>
        <LuChartBarBig className='w-10 h-10 text-muted-foreground/40 mb-3' />
        <h3 className='text-sm font-semibold mb-1'>No transaction history yet</h3>
        <p className='text-xs text-muted-foreground max-w-sm'>
          Add transactions to view monthly breakdowns, category analytics, and comparison trends.
        </p>
      </div>
    );
  }

  return (
    <div className='bg-card border rounded-xl p-4 sm:p-6 overflow-hidden'>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        aria-label='Cashflow charts'
      >
        <ResponsiveTabsList tabs={tabs} />
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
      {activeTab === 'comparison' && (
        <MonthlyComparison entries={entries} currency={currency} />
      )}
      {activeTab === 'cashflows' && hasCashflows && (
        <div className='space-y-4'>
          <div className='flex justify-center'>
            <Tabs
              value={cashflowType}
              onValueChange={(val) => {
                if (val === 'income' || val === 'expense' || val === 'balance')
                  setCashflowType(val);
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
                <TabsTrigger value='balance' className='text-xs px-3'>
                  Balance
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CategoryChart
            data={cashflowDistributionData}
            currency={currency}
            title={`${cashflowType === 'income' ? 'Income' : cashflowType === 'expense' ? 'Expense' : 'Balance'} by Cashflow`}
          />
        </div>
      )}
    </div>
  );
}
