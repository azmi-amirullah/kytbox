'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  LuArrowLeftRight,
  LuTrendingUp,
  LuTrendingDown,
  LuMinus,
  LuSearch,
  LuCalendar,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader } from '@/components/ui/loader';
import type { CashflowEntryDTO, CashflowChartAggregateDTO } from '@/types/dto';
import {
  compareMonths,
  getAvailableMonths,
  formatMonthLabel,
  formatCategoryName,
  type CategoryComparisonDiff,
} from '../math';
import { formatCurrencyCompact } from '@/lib/currency';
import { useContainerSize } from '../lib/useContainerSize';
import { cn } from '@/lib/utils';

interface MonthlyComparisonProps {
  entries: Array<CashflowEntryDTO | CashflowChartAggregateDTO>;
  currency: string | null;
}

export function MonthlyComparison({ entries, currency }: MonthlyComparisonProps) {
  const [containerRef, width, height] = useContainerSize();

  const availableMonths = useMemo(() => getAvailableMonths(entries), [entries]);

  // Default month B to latest available month, month A to preceding month (or same if only 1)
  const defaultMonthB = availableMonths[0]?.key ?? '';
  const defaultMonthA =
    availableMonths.length > 1 ? availableMonths[1]?.key : defaultMonthB;

  const [monthA, setMonthA] = useState<string>(defaultMonthA);
  const [monthB, setMonthB] = useState<string>(defaultMonthB);
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categorySearch, setCategorySearch] = useState('');
  const [chartMode, setChartMode] = useState<'overview' | 'categories'>('overview');

  // Handle month swap
  const handleSwapMonths = () => {
    setMonthA(monthB);
    setMonthB(monthA);
  };

  // Run calculation
  const comparison = useMemo(() => {
    if (!monthA || !monthB) return null;
    return compareMonths(entries, monthA, monthB);
  }, [entries, monthA, monthB]);

  // Filtered categories for diff table
  const filteredCategories = useMemo(() => {
    if (!comparison) return [];
    return comparison.categories.filter((cat) => {
      if (categoryTypeFilter !== 'all' && cat.type !== categoryTypeFilter) return false;
      if (categorySearch.trim()) {
        const query = categorySearch.toLowerCase().trim();
        const formatted = formatCategoryName(cat.category).toLowerCase();
        if (!cat.category.toLowerCase().includes(query) && !formatted.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [comparison, categoryTypeFilter, categorySearch]);

  // Category comparison chart dataset (top 6 spend categories)
  const categoryChartData = useMemo(() => {
    if (!comparison) return [];
    const expenseCategories = comparison.categories
      .filter((c) => c.type === 'expense')
      .slice(0, 6);

    return expenseCategories.map((c) => ({
      metric: formatCategoryName(c.category),
      monthAAmount: c.amountA,
      monthBAmount: c.amountB,
    }));
  }, [comparison]);

  if (availableMonths.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center p-8 text-center border rounded-xl bg-card'>
        <LuCalendar className='w-10 h-10 text-muted-foreground mb-3 opacity-40' />
        <h3 className='text-sm font-semibold mb-1'>No transaction history yet</h3>
        <p className='text-xs text-muted-foreground max-w-sm'>
          Add transactions across different months to see detailed side-by-side financial comparisons, delta percentages, and category spending variances.
        </p>
      </div>
    );
  }

  const { summary, chartData } = comparison || {
    summary: null,
    chartData: [],
  };

  const activeChartData = chartMode === 'overview' ? chartData : categoryChartData;

  const monthALabel = formatMonthLabel(monthA);
  const monthBLabel = formatMonthLabel(monthB);

  return (
    <div className='space-y-6 @container'>
      {/* Month Selection Bar */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg border'>
        <div className='flex flex-1 items-center gap-2'>
          {/* Month A Selector */}
          <div className='flex-1 min-w-30'>
            <span className='block text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wider'>
              Base Month (A)
            </span>
            <Select value={monthA} onValueChange={setMonthA}>
              <SelectTrigger className='h-9 text-xs bg-background' aria-label='Select base month A'>
                <SelectValue placeholder='Select Month A' />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((m) => (
                  <SelectItem key={`a-${m.key}`} value={m.key} className='text-xs'>
                    {m.label} ({m.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Swap Button */}
          <div className='pt-5'>
            <Button
              type='button'
              variant='outline'
              size='icon'
              className='h-9 w-9 shrink-0'
              onClick={handleSwapMonths}
              title='Swap Month A and Month B'
              aria-label='Swap comparison months'
            >
              <LuArrowLeftRight className='w-3.5 h-3.5' />
            </Button>
          </div>

          {/* Month B Selector */}
          <div className='flex-1 min-w-30'>
            <span className='block text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wider'>
              Compare Month (B)
            </span>
            <Select value={monthB} onValueChange={setMonthB}>
              <SelectTrigger className='h-9 text-xs bg-background' aria-label='Select compare month B'>
                <SelectValue placeholder='Select Month B' />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((m) => (
                  <SelectItem key={`b-${m.key}`} value={m.key} className='text-xs'>
                    {m.label} ({m.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart View Toggle */}
        <div className='sm:self-end pt-1 sm:pt-0'>
          <Tabs
            value={chartMode}
            onValueChange={(v) => {
              if (v === 'overview' || v === 'categories') setChartMode(v);
            }}
            className='w-full sm:w-auto'
          >
            <TabsList className='h-9 w-full sm:w-auto'>
              <TabsTrigger value='overview' className='text-xs px-3'>
                Overview
              </TabsTrigger>
              <TabsTrigger value='categories' className='text-xs px-3'>
                Top Expenses
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Delta KPI Summary Cards */}
      {summary && (
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4'>
          {/* Income KPI */}
          <div className='p-4 rounded-xl border bg-card/60 relative overflow-hidden'>
            <div className='flex items-center justify-between mb-1'>
              <span className='text-xs font-medium text-muted-foreground'>Total Income</span>
              <DeltaBadge
                delta={summary.deltas.income}
                pct={summary.deltas.incomePct}
                isIncome
              />
            </div>
            <div className='text-xl sm:text-2xl font-bold tracking-tight'>
              {formatCurrencyCompact(summary.monthB.income, currency)}
            </div>
            <div className='text-[11px] text-muted-foreground mt-1 flex items-center justify-between'>
              <span>Base: {formatCurrencyCompact(summary.monthA.income, currency)}</span>
              <span className='font-mono'>
                {summary.deltas.income >= 0 ? '+' : ''}
                {formatCurrencyCompact(summary.deltas.income, currency)}
              </span>
            </div>
          </div>

          {/* Expense KPI */}
          <div className='p-4 rounded-xl border bg-card/60 relative overflow-hidden'>
            <div className='flex items-center justify-between mb-1'>
              <span className='text-xs font-medium text-muted-foreground'>Total Expenses</span>
              <DeltaBadge
                delta={summary.deltas.expense}
                pct={summary.deltas.expensePct}
                isIncome={false}
              />
            </div>
            <div className='text-xl sm:text-2xl font-bold tracking-tight'>
              {formatCurrencyCompact(summary.monthB.expense, currency)}
            </div>
            <div className='text-[11px] text-muted-foreground mt-1 flex items-center justify-between'>
              <span>Base: {formatCurrencyCompact(summary.monthA.expense, currency)}</span>
              <span className='font-mono'>
                {summary.deltas.expense >= 0 ? '+' : ''}
                {formatCurrencyCompact(summary.deltas.expense, currency)}
              </span>
            </div>
          </div>

          {/* Net Savings & Rate KPI */}
          <div className='p-4 rounded-xl border bg-card/60 relative overflow-hidden'>
            <div className='flex items-center justify-between mb-1'>
              <span className='text-xs font-medium text-muted-foreground'>Net Savings</span>
              <DeltaBadge
                delta={summary.deltas.net}
                pct={summary.deltas.netPct}
                isIncome
              />
            </div>
            <div
              className={cn(
                'text-xl sm:text-2xl font-bold tracking-tight',
                summary.monthB.net >= 0 ? 'text-foreground' : 'text-destructive',
              )}
            >
              {formatCurrencyCompact(summary.monthB.net, currency)}
            </div>
            <div className='text-[11px] text-muted-foreground mt-1 flex items-center justify-between'>
              <span>
                Rate: {summary.monthB.savingsRate}%
                {summary.deltas.savingsRate !== 0 && (
                  <span className='ml-1 text-[10px] opacity-80'>
                    ({summary.deltas.savingsRate >= 0 ? '+' : ''}
                    {summary.deltas.savingsRate}%)
                  </span>
                )}
              </span>
              <span>Base: {formatCurrencyCompact(summary.monthA.net, currency)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Dual-Bar Visual Comparison Chart */}
      <div className='border rounded-xl p-4 bg-card'>
        <div className='flex items-center justify-between mb-3'>
          <div>
            <h4 className='text-sm font-semibold'>
              {chartMode === 'overview'
                ? 'Side-by-Side Financial Comparison'
                : 'Top Category Spend Variance'}
            </h4>
            <p className='text-xs text-muted-foreground'>
              {monthALabel} (Month A) vs {monthBLabel} (Month B)
            </p>
          </div>
        </div>

        <div ref={containerRef} className='h-70 w-full'>
          {width === 0 || height === 0 ? (
            <Loader size='md' className='h-full w-full py-0' text='' />
          ) : (
            <BarChart
              data={activeChartData}
              width={width}
              height={height}
              margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
              barGap={4}
            >
              <CartesianGrid
                vertical={false}
                className='stroke-border'
                strokeDasharray='3 3'
              />
              <XAxis
                dataKey='metric'
                stroke='hsl(var(--muted-foreground))'
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke='hsl(var(--muted-foreground))'
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                }
                width={48}
              />
              <Tooltip
                content={
                  <ComparisonChartTooltip
                    monthALabel={monthALabel}
                    monthBLabel={monthBLabel}
                    currency={currency}
                  />
                }
                cursor={{ fill: 'transparent' }}
                animationDuration={150}
              />
              <Legend
                verticalAlign='top'
                align='right'
                iconType='circle'
                wrapperStyle={{ fontSize: '12px', paddingBottom: '8px' }}
                formatter={(val: string) => (val === 'monthAAmount' ? monthALabel : monthBLabel)}
              />
              <Bar
                dataKey='monthAAmount'
                name='monthAAmount'
                fill='var(--chart-2)'
                radius={[4, 4, 0, 0]}
                barSize={28}
                minPointSize={1}
              />
              <Bar
                dataKey='monthBAmount'
                name='monthBAmount'
                fill='var(--chart-1)'
                radius={[4, 4, 0, 0]}
                barSize={28}
                minPointSize={1}
              />
            </BarChart>
          )}
        </div>
      </div>

      {/* Category Variance Diff Table */}
      <div className='border rounded-xl bg-card overflow-hidden'>
        <div className='p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
          <div>
            <h4 className='text-sm font-semibold'>Category Variance Breakdown</h4>
            <p className='text-xs text-muted-foreground'>
              Detailed line-item differences between {monthALabel} and {monthBLabel}
            </p>
          </div>

          <div className='flex items-center gap-2'>
            {/* Filter Tabs */}
            <Tabs
              value={categoryTypeFilter}
              onValueChange={(v) => {
                if (v === 'all' || v === 'expense' || v === 'income') {
                  setCategoryTypeFilter(v);
                }
              }}
              className='w-auto'
            >
              <TabsList className='h-8'>
                <TabsTrigger value='all' className='text-xs px-2.5'>
                  All
                </TabsTrigger>
                <TabsTrigger value='expense' className='text-xs px-2.5'>
                  Expenses
                </TabsTrigger>
                <TabsTrigger value='income' className='text-xs px-2.5'>
                  Income
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search Input */}
            <div className='relative w-36 sm:w-44'>
              <LuSearch className='absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground' />
              <Input
                placeholder='Search...'
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className='h-8 pl-8 text-xs'
              />
            </div>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='text-xs font-semibold'>Category</TableHead>
                <TableHead className='text-xs font-semibold text-right'>
                  {monthALabel} (A)
                </TableHead>
                <TableHead className='text-xs font-semibold text-right'>
                  {monthBLabel} (B)
                </TableHead>
                <TableHead className='text-xs font-semibold text-right'>Variance ($)</TableHead>
                <TableHead className='text-xs font-semibold text-right'>Change (%)</TableHead>
                <TableHead className='text-xs font-semibold text-center'>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center text-xs text-muted-foreground'>
                    No categories found for the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((cat) => (
                  <CategoryDiffRow
                    key={`${cat.category}-${cat.type}`}
                    item={cat}
                    currency={currency}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

/**
 * Delta percentage badge with positive/negative semantic colors.
 */
function DeltaBadge({
  delta,
  pct,
  isIncome,
}: {
  delta: number;
  pct: number;
  isIncome: boolean;
}) {
  if (delta === 0) {
    return (
      <Badge variant='outline' className='text-[10px] px-1.5 py-0 font-mono text-muted-foreground gap-1'>
        <LuMinus className='w-2.5 h-2.5' /> 0%
      </Badge>
    );
  }

  // For Income/Net: positive delta is good (green), negative is bad (red)
  // For Expenses: positive delta is bad (red), negative is good (green)
  const isPositiveTrend = isIncome ? delta > 0 : delta < 0;

  return (
    <Badge
      variant='outline'
      className={cn(
        'text-[10px] px-1.5 py-0 font-mono gap-1 font-semibold border',
        isPositiveTrend
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      )}
    >
      {delta > 0 ? (
        <LuTrendingUp className='w-2.5 h-2.5' />
      ) : (
        <LuTrendingDown className='w-2.5 h-2.5' />
      )}
      {pct > 0 ? '+' : ''}
      {pct}%
    </Badge>
  );
}

/**
 * Category Diff Table Row Component.
 */
function CategoryDiffRow({
  item,
  currency,
}: {
  item: CategoryComparisonDiff;
  currency: string | null;
}) {
  const isIncome = item.type === 'income';
  const formattedCategory = formatCategoryName(item.category);

  // Status & Trend styling
  const isGood = isIncome ? item.diff > 0 : item.diff < 0;
  const isBad = isIncome ? item.diff < 0 : item.diff > 0;

  return (
    <TableRow className='text-xs'>
      <TableCell className='font-medium'>
        <div className='flex items-center gap-2'>
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              isIncome ? 'bg-emerald-500' : 'bg-rose-500',
            )}
          />
          <span className='capitalize'>{formattedCategory}</span>
          <span className='text-[10px] text-muted-foreground uppercase'>({item.type})</span>
        </div>
      </TableCell>
      <TableCell className='text-right font-mono text-muted-foreground'>
        {formatCurrencyCompact(item.amountA, currency)}
      </TableCell>
      <TableCell className='text-right font-mono font-medium'>
        {formatCurrencyCompact(item.amountB, currency)}
      </TableCell>
      <TableCell
        className={cn(
          'text-right font-mono font-semibold',
          item.diff === 0
            ? 'text-muted-foreground'
            : isGood
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400',
        )}
      >
        {item.diff > 0 ? '+' : ''}
        {formatCurrencyCompact(item.diff, currency)}
      </TableCell>
      <TableCell className='text-right font-mono'>
        <span
          className={cn(
            item.diffPct === 0
              ? 'text-muted-foreground'
              : isGood
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400',
          )}
        >
          {item.diffPct > 0 ? '+' : ''}
          {item.diffPct}%
        </span>
      </TableCell>
      <TableCell className='text-center'>
        {item.trend === 'increased' && (
          <Badge
            variant='outline'
            className={cn(
              'text-[10px] px-1.5 py-0 gap-1',
              isBad
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            )}
          >
            <LuTrendingUp className='w-2.5 h-2.5' /> +{Math.abs(item.diffPct)}%
          </Badge>
        )}
        {item.trend === 'decreased' && (
          <Badge
            variant='outline'
            className={cn(
              'text-[10px] px-1.5 py-0 gap-1',
              isGood
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
            )}
          >
            <LuTrendingDown className='w-2.5 h-2.5' /> -{Math.abs(item.diffPct)}%
          </Badge>
        )}
        {item.trend === 'unchanged' && (
          <Badge variant='outline' className='text-[10px] px-1.5 py-0 text-muted-foreground'>
            <LuMinus className='w-2.5 h-2.5' /> 0%
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

/**
 * Custom tooltip for comparison dual-bar chart.
 */
interface TooltipEntry {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
}

interface ComparisonChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  monthALabel: string;
  monthBLabel: string;
  currency: string | null;
}

function ComparisonChartTooltip({
  active,
  payload,
  label,
  monthALabel,
  monthBLabel,
  currency,
}: ComparisonChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const valA = Number(payload.find((p) => p.dataKey === 'monthAAmount')?.value ?? 0);
  const valB = Number(payload.find((p) => p.dataKey === 'monthBAmount')?.value ?? 0);
  const diff = valB - valA;
  const pct = valA !== 0 ? Math.round(((diff / Math.abs(valA)) * 100 + Number.EPSILON) * 100) / 100 : (valB > 0 ? 100 : 0);

  return (
    <div className='bg-popover border border-border text-popover-foreground p-3 rounded-lg shadow-md text-xs space-y-1.5 min-w-42.5'>
      <p className='font-semibold text-sm border-b pb-1'>{label}</p>
      <div className='flex items-center justify-between gap-3'>
        <span className='text-muted-foreground'>{monthALabel}:</span>
        <span className='font-mono font-medium'>{formatCurrencyCompact(valA, currency)}</span>
      </div>
      <div className='flex items-center justify-between gap-3'>
        <span className='text-muted-foreground'>{monthBLabel}:</span>
        <span className='font-mono font-semibold'>{formatCurrencyCompact(valB, currency)}</span>
      </div>
      <div className='border-t pt-1 flex items-center justify-between gap-3 font-mono font-semibold'>
        <span>Variance:</span>
        <span className={diff >= 0 ? 'text-foreground' : 'text-destructive'}>
          {diff >= 0 ? '+' : ''}
          {formatCurrencyCompact(diff, currency)} ({pct >= 0 ? '+' : ''}{pct}%)
        </span>
      </div>
    </div>
  );
}
