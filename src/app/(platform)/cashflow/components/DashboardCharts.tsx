'use client';

import { useMemo } from 'react';
import type { CashflowWithSummaryDTO } from '@/types/dto';
import { aggregateEntriesByMonth } from '../lib/aggregateEntries';
import { CashflowCharts } from './CashflowCharts';

interface DashboardChartsProps {
  cashflows: CashflowWithSummaryDTO[];
  includedSharedIds: Set<string>;
  currentUserId?: string;
  currency: string | null;
}

export function DashboardCharts({
  cashflows,
  includedSharedIds,
  currentUserId,
  currency,
}: DashboardChartsProps) {
  const entries = useMemo(() => {
    const owned = cashflows.filter((c) => c.user_id === currentUserId);
    const includedShared = cashflows.filter(
      (c) => c.user_id !== currentUserId && includedSharedIds.has(c.id),
    );
    return [...owned, ...includedShared].flatMap((c) => c.entries);
  }, [cashflows, includedSharedIds, currentUserId]);

  const monthlyData = useMemo(
    () => aggregateEntriesByMonth(entries),
    [entries],
  );

  if (monthlyData.length === 0) return null;

  return <CashflowCharts entries={entries} currency={currency} />;
}
