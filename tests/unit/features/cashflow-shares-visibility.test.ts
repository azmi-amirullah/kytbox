import { describe, it, expect } from 'vitest';
import type { CashflowWithSummaryDTO, CashflowChartAggregateDTO } from '@/types/dto';

describe('Cashflow Shares Visibility & Partitioning', () => {
  const currentUserId = 'user-123';

  const mockCashflows: CashflowWithSummaryDTO[] = [
    {
      id: 'cf-owned-1',
      title: 'My Primary Cashflow',
      is_public: false,
      user_id: 'user-123',
      created_at: '2026-08-01T00:00:00Z',
      entryCount: 5,
      income: 1000,
      expense: 300,
      balance: 700,
      isIncluded: true,
      isPinned: true,
    },
    {
      id: 'cf-shared-active',
      title: 'Shared Business Cashflow',
      is_public: false,
      user_id: 'user-456',
      created_at: '2026-08-02T00:00:00Z',
      entryCount: 10,
      income: 5000,
      expense: 2000,
      balance: 3000,
      isIncluded: true,
      isPinned: true,
    },
    {
      id: 'cf-shared-hidden',
      title: 'Shared Archived Cashflow',
      is_public: false,
      user_id: 'user-789',
      created_at: '2026-08-03T00:00:00Z',
      entryCount: 2,
      income: 800,
      expense: 100,
      balance: 700,
      isIncluded: false,
      isPinned: false,
    },
  ];

  it('correctly partitions owned, active shared, and hidden shared cashflows', () => {
    const owned = mockCashflows.filter((c) => c.user_id === currentUserId);
    const allShared = mockCashflows.filter((c) => c.user_id !== currentUserId);
    const activeShared = allShared.filter((c) => c.isPinned !== false);
    const hiddenShared = allShared.filter((c) => c.isPinned === false);

    expect(owned).toHaveLength(1);
    expect(owned[0].id).toBe('cf-owned-1');

    expect(activeShared).toHaveLength(1);
    expect(activeShared[0].id).toBe('cf-shared-active');

    expect(hiddenShared).toHaveLength(1);
    expect(hiddenShared[0].id).toBe('cf-shared-hidden');
  });

  it('calculates totals including only owned and active included shared cashflows', () => {
    const owned = mockCashflows.filter((c) => c.user_id === currentUserId);
    const allShared = mockCashflows.filter((c) => c.user_id !== currentUserId);
    const activeShared = allShared.filter((c) => c.isPinned !== false);

    const includedSharedIds = new Set(['cf-shared-active']);
    const flowsToCount = [
      ...owned,
      ...activeShared.filter((c) => includedSharedIds.has(c.id)),
    ];

    const totalIncome = flowsToCount.reduce((sum, c) => sum + c.income, 0);
    const totalExpense = flowsToCount.reduce((sum, c) => sum + c.expense, 0);
    const balance = totalIncome - totalExpense;

    // Owned (1000, 300) + Active Shared (5000, 2000) = Income 6000, Expense 2300, Balance 3700
    expect(totalIncome).toBe(6000);
    expect(totalExpense).toBe(2300);
    expect(balance).toBe(3700);
  });

  it('excludes hidden shared cashflows from active aggregate chart queries', () => {
    const mockAggregates: CashflowChartAggregateDTO[] = [
      {
        cashflow_id: 'cf-owned-1',
        month: '2026-08',
        type: 'income',
        category: 'Salary',
        total_amount: 1000,
      },
      {
        cashflow_id: 'cf-shared-active',
        month: '2026-08',
        type: 'income',
        category: 'Sales',
        total_amount: 5000,
      },
      {
        cashflow_id: 'cf-shared-hidden',
        month: '2026-08',
        type: 'income',
        category: 'Old Revenue',
        total_amount: 800,
      },
    ];

    const activeCashflowIds = new Set(['cf-owned-1', 'cf-shared-active']);
    const filteredAggregates = mockAggregates.filter((a) =>
      activeCashflowIds.has(a.cashflow_id),
    );

    expect(filteredAggregates).toHaveLength(2);
    expect(filteredAggregates.map((a) => a.cashflow_id)).not.toContain(
      'cf-shared-hidden',
    );
  });

  it('handles state transition when unpinning and restoring an item', () => {
    const pinnedOverrides: Record<string, boolean> = {};

    // 1. Initially pinned
    const allShared = mockCashflows.filter((c) => c.user_id !== currentUserId);
    let active = allShared.filter(
      (c) => (pinnedOverrides[c.id] ?? c.isPinned ?? true) === true,
    );
    let hidden = allShared.filter(
      (c) => (pinnedOverrides[c.id] ?? c.isPinned ?? true) === false,
    );
    expect(active).toHaveLength(1);
    expect(hidden).toHaveLength(1);

    // 2. Hide active item
    pinnedOverrides['cf-shared-active'] = false;
    active = allShared.filter(
      (c) => (pinnedOverrides[c.id] ?? c.isPinned ?? true) === true,
    );
    hidden = allShared.filter(
      (c) => (pinnedOverrides[c.id] ?? c.isPinned ?? true) === false,
    );
    expect(active).toHaveLength(0);
    expect(hidden).toHaveLength(2);

    // 3. Restore both items
    pinnedOverrides['cf-shared-active'] = true;
    pinnedOverrides['cf-shared-hidden'] = true;
    active = allShared.filter(
      (c) => (pinnedOverrides[c.id] ?? c.isPinned ?? true) === true,
    );
    hidden = allShared.filter(
      (c) => (pinnedOverrides[c.id] ?? c.isPinned ?? true) === false,
    );
    expect(active).toHaveLength(2);
    expect(hidden).toHaveLength(0);
  });
});
