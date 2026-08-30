'use client';

import React from 'react';
import type { FinancialReportData } from '../math';
import { formatCategoryName } from '../constants';
import { formatCurrency } from '@/lib/currency';
import { formatAppDate } from '@/lib/date-only';
import { cn } from '@/lib/utils';
import {
  LuTrendingUp,
  LuTrendingDown,
  LuPercent,
  LuCalendar,
  LuClock,
  LuFileSpreadsheet,
} from 'react-icons/lu';

interface FinancialReportViewProps {
  data: FinancialReportData;
  showSplits?: boolean;
}

export function FinancialReportView({
  data,
  showSplits = true,
}: FinancialReportViewProps) {
  const { kpi, currency } = data;
  const isNetPositive = kpi.netSavings >= 0;

  return (
    <div
      id='cashflow-financial-statement'
      className='cashflow-printable-container mx-auto w-full rounded-2xl border border-border/80 bg-card p-4 sm:p-8 md:p-10 text-foreground shadow-sm print:max-w-none print:w-full print:border-none print:bg-white print:p-0 print:text-black print:shadow-none'
    >
      {/* ── Document Header ────────────────────────────────────────────── */}
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-border/80 pb-6 gap-4 print:border-zinc-300 print:pb-4'>
        <div>
          <div className='flex items-center gap-2'>
            <span className='font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 print:text-emerald-700'>
              Financial Statement
            </span>
            <span className='text-xs px-2 py-0.5 rounded-full font-normal bg-muted text-muted-foreground print:border print:border-zinc-300 print:bg-zinc-100 print:text-zinc-700'>
              {data.currency}
            </span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1 print:text-black'>
            {data.title}
          </h1>
          <p className='text-sm text-muted-foreground mt-1 flex items-center gap-1.5 print:text-zinc-600'>
            <LuCalendar className='w-4 h-4 shrink-0' />
            <span>Period: </span>
            <span className='font-bold text-foreground print:text-black'>
              {data.periodLabel}
            </span>
          </p>
        </div>

        <div className='flex flex-col sm:items-end text-xs text-muted-foreground space-y-1 print:text-zinc-600'>
          <div className='flex items-center gap-1.5'>
            <LuClock className='w-3.5 h-3.5' />
            <span>Generated: {formatAppDate(data.generatedAt)}</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <LuFileSpreadsheet className='w-3.5 h-3.5' />
            <span>
              {kpi.totalTransactions} transactions
              {kpi.splitItemsCount > 0 && ` (${kpi.splitItemsCount} split items)`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Summary KPI Strip ──────────────────────────────────────────── */}
      <div className='my-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 break-inside-avoid print:my-4 print:grid-cols-4'>
        {/* Total Income */}
        <div className='rounded-xl border border-border/60 bg-emerald-500/5 p-4 min-w-0 flex flex-col justify-between overflow-hidden print:border-zinc-300 print:bg-zinc-50'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium uppercase tracking-wider text-muted-foreground print:text-zinc-600'>
              Total Income
            </span>
            <LuTrendingUp className='w-4 h-4 text-emerald-600 dark:text-emerald-400 print:text-emerald-700 shrink-0' />
          </div>
          <p
            className='text-base sm:text-lg lg:text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1 truncate print:text-emerald-700'
            title={formatCurrency(kpi.totalIncome, currency)}
          >
            {formatCurrency(kpi.totalIncome, currency)}
          </p>
          <span className='text-[11px] text-muted-foreground print:text-zinc-500'>
            {kpi.incomeCount} entries
          </span>
        </div>

        {/* Total Expenses */}
        <div className='rounded-xl border border-border/60 bg-rose-500/5 p-4 min-w-0 flex flex-col justify-between overflow-hidden print:border-zinc-300 print:bg-zinc-50'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium uppercase tracking-wider text-muted-foreground print:text-zinc-600'>
              Total Expense
            </span>
            <LuTrendingDown className='w-4 h-4 text-rose-500 print:text-rose-700 shrink-0' />
          </div>
          <p
            className='text-base sm:text-lg lg:text-xl font-bold tracking-tight text-rose-500 mt-1 truncate print:text-rose-700'
            title={formatCurrency(kpi.totalExpense, currency)}
          >
            {formatCurrency(kpi.totalExpense, currency)}
          </p>
          <span className='text-[11px] text-muted-foreground print:text-zinc-500'>
            {kpi.expenseCount} entries
          </span>
        </div>

        {/* Net Savings */}
        <div
          className={cn(
            'rounded-xl border border-border/60 p-4 min-w-0 flex flex-col justify-between overflow-hidden print:border-zinc-300 print:bg-zinc-50',
            isNetPositive ? 'bg-emerald-500/5' : 'bg-rose-500/5',
          )}
        >
          <div className='flex items-center justify-between gap-1 flex-wrap'>
            <span className='text-xs font-medium uppercase tracking-wider text-muted-foreground print:text-zinc-600'>
              Net Cashflow
            </span>
            <span
              className={cn(
                'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0',
                isNetPositive
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 print:bg-emerald-100 print:text-emerald-800'
                  : 'bg-rose-500/15 text-rose-600 print:bg-rose-100 print:text-rose-800',
              )}
            >
              {isNetPositive ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <p
            className={cn(
              'text-base sm:text-lg lg:text-xl font-bold tracking-tight mt-1 truncate',
              isNetPositive
                ? 'text-emerald-600 dark:text-emerald-400 print:text-emerald-700'
                : 'text-rose-500 print:text-rose-700',
            )}
            title={`${isNetPositive ? '+' : ''}${formatCurrency(kpi.netSavings, currency)}`}
          >
            {isNetPositive ? '+' : ''}
            {formatCurrency(kpi.netSavings, currency)}
          </p>
          <span className='text-[11px] text-muted-foreground print:text-zinc-500'>
            {isNetPositive ? 'Net Saved' : 'Net Overspend'}
          </span>
        </div>

        {/* Savings Rate */}
        <div className='rounded-xl border border-border/60 bg-muted/20 p-4 min-w-0 flex flex-col justify-between overflow-hidden print:border-zinc-300 print:bg-zinc-50'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium uppercase tracking-wider text-muted-foreground print:text-zinc-600'>
              Savings Rate
            </span>
            <LuPercent className='w-4 h-4 text-muted-foreground print:text-zinc-600 shrink-0' />
          </div>
          <p className='text-base sm:text-lg lg:text-xl font-bold tracking-tight text-foreground mt-1 truncate print:text-black'>
            {kpi.savingsRate}%
          </p>
          <span className='text-[11px] text-muted-foreground print:text-zinc-500'>
            of total income
          </span>
        </div>
      </div>

      {/* ── Category Breakdown Section ─────────────────────────────────── */}
      {(data.expenseCategories.length > 0 || data.incomeCategories.length > 0) && (
        <div className='my-6 grid grid-cols-1 md:grid-cols-2 gap-6 break-inside-avoid print:my-4'>
          {/* Income Sources (Left) */}
          <div className='rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 print:border-zinc-300 print:bg-white'>
            <h2 className='text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3 flex items-center justify-between print:text-zinc-700'>
              <span>Income Sources</span>
              <span className='font-mono text-[11px] font-normal text-muted-foreground'>
                {data.incomeCategories.length} sources
              </span>
            </h2>
            {data.incomeCategories.length === 0 ? (
              <p className='text-xs text-muted-foreground italic'>No income entries in this period.</p>
            ) : (
              <div className='space-y-2.5'>
                {data.incomeCategories.slice(0, 6).map((cat) => (
                  <div key={cat.category} className='space-y-1'>
                    <div className='flex justify-between items-center gap-2 text-xs'>
                      <span
                        className='font-normal text-foreground truncate print:text-black min-w-0'
                        title={formatCategoryName(cat.category)}
                      >
                        {formatCategoryName(cat.category)}
                      </span>
                      <div className='flex items-center gap-1.5 shrink-0'>
                        <span className='font-bold text-foreground print:text-black'>
                          {formatCurrency(cat.total, currency)}
                        </span>
                        <span className='text-muted-foreground font-mono text-[11px] print:text-zinc-500'>
                          ({cat.percentage}%)
                        </span>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className='h-1.5 w-full rounded-full bg-emerald-500/15 overflow-hidden print:bg-zinc-200'>
                      <div
                        className='h-full bg-emerald-500 rounded-full print:bg-emerald-600'
                        style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expense Categories (Right) */}
          <div className='rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 sm:p-5 print:border-zinc-300 print:bg-white'>
            <h2 className='text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3 flex items-center justify-between print:text-zinc-700'>
              <span>Top Expense Categories</span>
              <span className='font-mono text-[11px] font-normal text-muted-foreground'>
                {data.expenseCategories.length} categories
              </span>
            </h2>
            {data.expenseCategories.length === 0 ? (
              <p className='text-xs text-muted-foreground italic'>No expense entries in this period.</p>
            ) : (
              <div className='space-y-2.5'>
                {data.expenseCategories.slice(0, 6).map((cat) => (
                  <div key={cat.category} className='space-y-1'>
                    <div className='flex justify-between items-center gap-2 text-xs'>
                      <span
                        className='font-normal text-foreground truncate print:text-black min-w-0'
                        title={formatCategoryName(cat.category)}
                      >
                        {formatCategoryName(cat.category)}
                      </span>
                      <div className='flex items-center gap-1.5 shrink-0'>
                        <span className='font-bold text-foreground print:text-black'>
                          {formatCurrency(cat.total, currency)}
                        </span>
                        <span className='text-muted-foreground font-mono text-[11px] print:text-zinc-500'>
                          ({cat.percentage}%)
                        </span>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className='h-1.5 w-full rounded-full bg-rose-500/15 overflow-hidden print:bg-zinc-200'>
                      <div
                        className='h-full bg-rose-500 rounded-full print:bg-rose-600'
                        style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Top Expenses Spotlight ──────────────────────────────────────── */}
      {data.topExpenses.length > 0 && (
        <div className='my-6 break-inside-avoid print:my-4'>
          <h2 className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 print:text-zinc-700'>
            Largest Expenses Spotlight
          </h2>
          <div className='overflow-x-auto rounded-xl border border-border/60 print:border-zinc-300'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-muted/40 text-muted-foreground border-b border-border/60 print:bg-zinc-100 print:text-zinc-700 print:border-zinc-300'>
                <tr>
                  <th className='py-2 px-3 font-bold'>Date</th>
                  <th className='py-2 px-3 font-bold'>Description</th>
                  <th className='py-2 px-3 font-bold'>Category</th>
                  <th className='py-2 px-3 text-right font-bold'>Amount</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/60 print:divide-zinc-200'>
                {data.topExpenses.map((exp) => (
                  <tr key={exp.id} className='hover:bg-muted/20 print:hover:bg-transparent'>
                    <td className='py-2 px-3 font-mono text-muted-foreground whitespace-nowrap print:text-zinc-600'>
                      {formatAppDate(exp.date)}
                    </td>
                    <td className='py-2 px-3 font-normal text-foreground print:text-black'>
                      {exp.description}
                    </td>
                    <td className='py-2 px-3 text-muted-foreground print:text-zinc-600'>
                      {formatCategoryName(exp.category || 'uncategorized')}
                    </td>
                    <td className='py-2 px-3 text-right font-bold text-rose-500 print:text-rose-700'>
                      -{formatCurrency(exp.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detailed Itemized Transaction Ledger ───────────────────────── */}
      <div className='mt-8 print:mt-6'>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-zinc-700'>
            Itemized Transaction Ledger ({data.entries.length})
          </h2>
          <span className='text-xs text-muted-foreground print:text-zinc-500'>
            Oldest to Newest
          </span>
        </div>

        {data.entries.length === 0 ? (
          <div className='rounded-xl border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground print:border-zinc-300'>
            No transactions found for this period.
          </div>
        ) : (
          <div className='overflow-x-auto rounded-xl border border-border/80 print:border-zinc-300'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-muted/40 text-muted-foreground border-b border-border/80 uppercase tracking-wider text-[11px] print:bg-zinc-100 print:text-zinc-700 print:border-zinc-300'>
                <tr>
                  <th className='py-2.5 px-3 font-bold'>Date</th>
                  <th className='py-2.5 px-3 font-bold'>Description</th>
                  <th className='py-2.5 px-3 font-bold'>Category</th>
                  <th className='py-2.5 px-3 font-bold'>Type</th>
                  <th className='py-2.5 px-3 text-right font-bold'>Amount</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/60 print:divide-zinc-200'>
                {data.entries.map((entry) => {
                  const isIncome = entry.type === 'income';
                  const hasSplits = Boolean(showSplits && entry.items && entry.items.length > 0);

                  return (
                    <React.Fragment key={entry.id}>
                      <tr className='hover:bg-muted/20 print:hover:bg-transparent break-inside-avoid'>
                        <td className='py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap align-top print:text-zinc-600'>
                          {formatAppDate(entry.date)}
                        </td>
                        <td className='py-2.5 px-3 align-top'>
                          <div className='font-normal text-foreground print:text-black'>
                            {entry.description}
                          </div>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className='flex flex-wrap gap-1 mt-1'>
                              {entry.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className='text-[10px] px-1.5 py-0.2 rounded font-medium bg-muted text-muted-foreground border border-border/50 print:border-zinc-300 print:bg-zinc-100 print:text-zinc-700'
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className='py-2.5 px-3 text-muted-foreground align-top print:text-zinc-600'>
                          {formatCategoryName(entry.category || 'uncategorized')}
                        </td>
                        <td className='py-2.5 px-3 align-top'>
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full',
                              isIncome
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 print:bg-emerald-100 print:text-emerald-800'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 print:bg-rose-100 print:text-rose-800',
                            )}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td
                          className={cn(
                            'py-2.5 px-3 text-right font-bold align-top whitespace-nowrap',
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400 print:text-emerald-700'
                              : 'text-rose-500 print:text-rose-700',
                          )}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(Number(entry.amount), currency)}
                        </td>
                      </tr>

                      {/* Split Entries Breakdown Sub-Rows */}
                      {hasSplits &&
                        entry.items!.map((split, sIdx) => (
                          <tr
                            key={split.id || `${entry.id}-split-${sIdx}`}
                            className='bg-muted/15 text-[11px] text-muted-foreground print:bg-zinc-50 print:text-zinc-600 break-inside-avoid'
                          >
                            <td className='py-1.5 px-3 font-mono text-center'>
                              <span className='text-muted-foreground/60'>↳</span>
                            </td>
                            <td className='py-1.5 px-3 pl-6 font-normal text-muted-foreground print:text-zinc-700'>
                              {split.item_name}
                            </td>
                            <td className='py-1.5 px-3 italic'>
                              {formatCategoryName(split.category || entry.category || 'uncategorized')}
                            </td>
                            <td className='py-1.5 px-3'>
                              <span className='text-[9px] uppercase tracking-wider text-muted-foreground/80 font-mono'>
                                split item
                              </span>
                            </td>
                            <td className='py-1.5 px-3 text-right font-normal text-muted-foreground print:text-zinc-700'>
                              {formatCurrency(Number(split.amount), currency)}
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              {/* Ledger Summary Footer */}
              <tfoot className='bg-muted/50 font-bold border-t-2 border-border/80 print:bg-zinc-100 print:border-zinc-400'>
                <tr>
                  <td colSpan={3} className='py-3 px-3 text-foreground print:text-black'>
                    Statement Period Totals ({data.entries.length} transactions)
                  </td>
                  <td className='py-3 px-3 text-xs uppercase text-muted-foreground print:text-zinc-600'>
                    Net Result:
                  </td>
                  <td
                    className={cn(
                      'py-3 px-3 text-right text-sm font-bold',
                      isNetPositive
                        ? 'text-emerald-600 dark:text-emerald-400 print:text-emerald-700'
                        : 'text-rose-500 print:text-rose-700',
                    )}
                  >
                    {isNetPositive ? '+' : ''}
                    {formatCurrency(kpi.netSavings, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Statement Footer & Verification ────────────────────────────── */}
      <div className='mt-10 border-t border-border/80 pt-6 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-4 break-inside-avoid print:border-zinc-300 print:pt-4 print:text-zinc-600'>
        <div>
          <p className='font-bold text-foreground print:text-black'>
            Kytbox Cashflow
          </p>
          <p className='mt-0.5 text-[11px]'>
            Cashflow statement export. For budgeting, tax preparation, and expense tracking.
          </p>
        </div>
        <div className='text-left sm:text-right text-[11px] font-mono'>
          <p>Page 1 of 1</p>
        </div>
      </div>
    </div>
  );
}
