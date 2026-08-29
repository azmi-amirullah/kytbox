'use client'

import { useMemo, useState } from 'react'
import {
  LuChartBarBig,
  LuTrendingUp,
  LuChartPie,
  LuArrowLeftRight,
  LuWallet,
  LuArrowDownUp,
} from 'react-icons/lu'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import type {
  CashflowEntryDTO,
  CashflowWithSummaryDTO,
  CashflowChartAggregateDTO,
} from '@/types/dto'
import { aggregateEntriesByMonth } from '../lib/aggregateEntries'
import { aggregateEntriesByCategory } from '../lib/aggregateCategories'
import { IncomeExpenseChart } from './IncomeExpenseChart'
import { BalanceTrendChart } from './BalanceTrendChart'
import { CategoryChart } from './CategoryChart'
import { MonthlyComparison } from './MonthlyComparison'
import { ResponsiveTabsList } from './ResponsiveTabsList'

interface CashflowChartsProps {
  entries?: Array<CashflowEntryDTO | CashflowChartAggregateDTO>
  aggregates?: CashflowChartAggregateDTO[]
  cashflows?: CashflowWithSummaryDTO[]
  currency: string | null
}

const DASHBOARD_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'oklch(0.65 0.2 145)',
  'oklch(0.75 0.2 80)',
  'oklch(0.65 0.15 210)',
  'oklch(0.65 0.25 15)',
  'oklch(0.6 0.15 300)',
  'oklch(0.7 0.15 40)',
  'oklch(0.6 0.15 250)',
  'oklch(0.65 0.2 330)',
]

export function CashflowCharts({
  entries,
  aggregates,
  cashflows,
  currency,
}: CashflowChartsProps) {
  const [activeTab, setActiveTab] = useState('income-expense')
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>(
    'expense',
  )
  const [cashflowType, setCashflowType] = useState<
    'income' | 'expense' | 'balance'
  >('income')

  const chartDataItems = useMemo(
    () => aggregates ?? entries ?? [],
    [aggregates, entries],
  )

  const monthlyData = useMemo(
    () => aggregateEntriesByMonth(chartDataItems),
    [chartDataItems],
  )

  const categoryData = useMemo(
    () => aggregateEntriesByCategory(chartDataItems, categoryType),
    [chartDataItems, categoryType],
  )

  const cashflowDistributionData = useMemo(() => {
    if (!cashflows || cashflows.length === 0) return []
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
      .sort((a, b) => b.value - a.value)
  }, [cashflows, cashflowType])

  const hasCashflows = Boolean(cashflows && cashflows.length > 0)

  const tabs = useMemo(() => {
    const baseTabs = [
      {
        value: 'income-expense',
        label: 'Income vs Expense',
        icon: LuArrowDownUp,
      },
      { value: 'balance-trend', label: 'Balance Trend', icon: LuTrendingUp },
      { value: 'categories', label: 'Categories', icon: LuChartPie },
      { value: 'comparison', label: 'Compare Months', icon: LuArrowLeftRight },
    ]
    if (hasCashflows) {
      baseTabs.push({ value: 'cashflows', label: 'Cashflows', icon: LuWallet })
    }
    return baseTabs
  }, [hasCashflows])

  if (chartDataItems.length === 0 && (!cashflows || cashflows.length === 0)) {
    return (
      <Card className='p-8 text-center flex flex-col items-center justify-center rounded-xl'>
        <LuChartBarBig className='w-10 h-10 text-muted-foreground/40 mb-3' />
        <h3 className='text-sm font-semibold mb-1'>
          No transaction history yet
        </h3>
        <p className='text-xs text-muted-foreground max-w-sm'>
          Add transactions to view monthly breakdowns, category analytics, and
          comparison trends.
        </p>
      </Card>
    )
  }

  return (
    <Card className='gap-0 py-0 rounded-xl overflow-hidden shadow-xs'>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        aria-label='Cashflow charts'
      >
        <CardHeader className='p-4 sm:p-5 border-b border-border/40 pb-4'>
          <div className='flex flex-wrap items-center justify-between gap-4 sm:gap-6'>
            <div className='shrink-0'>
              <CardTitle className='text-base sm:text-lg font-bold tracking-tight flex items-center gap-2'>
                <LuChartBarBig className='w-5 h-5 text-primary shrink-0' />
                Financial Overview
              </CardTitle>
              <CardDescription className='text-xs text-muted-foreground mt-0.5'>
                Monthly breakdown of your transactions
              </CardDescription>
            </div>
            <div className='w-full sm:w-auto'>
              <ResponsiveTabsList
                tabs={tabs}
                value={activeTab}
                onValueChange={setActiveTab}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className='p-4 sm:p-6'>
          <TabsContent value='income-expense' className='m-0 outline-none'>
            <IncomeExpenseChart data={monthlyData} currency={currency} />
          </TabsContent>
          <TabsContent value='balance-trend' className='m-0 outline-none'>
            <BalanceTrendChart data={monthlyData} currency={currency} />
          </TabsContent>
          <TabsContent value='categories' className='m-0 outline-none'>
            <div className='space-y-4'>
              <Tabs
                value={categoryType}
                onValueChange={(val) => {
                  if (val === 'income' || val === 'expense')
                    setCategoryType(val)
                }}
                className='w-full'
              >
                <div className='flex justify-center'>
                  <TabsList className='h-8 bg-muted/60 p-0.5 rounded-lg'>
                    <TabsTrigger
                      value='income'
                      className='text-xs px-3 rounded-md'
                    >
                      Income
                    </TabsTrigger>
                    <TabsTrigger
                      value='expense'
                      className='text-xs px-3 rounded-md'
                    >
                      Expense
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value='income' className='mt-4 outline-none'>
                  <CategoryChart
                    data={categoryData}
                    currency={currency}
                    title='Income Breakdown'
                  />
                </TabsContent>
                <TabsContent value='expense' className='mt-4 outline-none'>
                  <CategoryChart
                    data={categoryData}
                    currency={currency}
                    title='Expense Breakdown'
                  />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
          <TabsContent value='comparison' className='m-0 outline-none'>
            <MonthlyComparison entries={chartDataItems} currency={currency} />
          </TabsContent>
          {hasCashflows && (
            <TabsContent value='cashflows' className='m-0 outline-none'>
              <div className='space-y-4'>
                <Tabs
                  value={cashflowType}
                  onValueChange={(val) => {
                    if (
                      val === 'income' ||
                      val === 'expense' ||
                      val === 'balance'
                    )
                      setCashflowType(val)
                  }}
                  className='w-full'
                >
                  <div className='flex justify-center'>
                    <TabsList className='h-8 bg-muted/60 p-0.5 rounded-lg'>
                      <TabsTrigger
                        value='income'
                        className='text-xs px-3 rounded-md'
                      >
                        Income
                      </TabsTrigger>
                      <TabsTrigger
                        value='expense'
                        className='text-xs px-3 rounded-md'
                      >
                        Expense
                      </TabsTrigger>
                      <TabsTrigger
                        value='balance'
                        className='text-xs px-3 rounded-md'
                      >
                        Balance
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value='income' className='mt-4 outline-none'>
                    <CategoryChart
                      data={cashflowDistributionData}
                      currency={currency}
                      title='Income by Cashflow'
                    />
                  </TabsContent>
                  <TabsContent value='expense' className='mt-4 outline-none'>
                    <CategoryChart
                      data={cashflowDistributionData}
                      currency={currency}
                      title='Expense by Cashflow'
                    />
                  </TabsContent>
                  <TabsContent value='balance' className='mt-4 outline-none'>
                    <CategoryChart
                      data={cashflowDistributionData}
                      currency={currency}
                      title='Balance by Cashflow'
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
          )}
        </CardContent>
      </Tabs>
    </Card>
  )
}
