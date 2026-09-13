/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getCashflowDashboardData } from '@/features/cashflow/db';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { DEFAULT_CURRENCY } from '@/lib/currency';

describe('getCashflowDashboardData Resilience & Fault Tolerance', () => {
  const userId = 'user-123';
  const email = 'user@example.com';

  const mockSummaryRow = {
    id: 'cf-1',
    user_id: userId,
    title: 'Personal Cashflow',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-02T00:00:00Z',
    is_public: false,
    is_pinned: false,
    is_archived: false,
    last_entry_at: '2026-09-02T00:00:00Z',
    entry_count: 5,
    income: 1000,
    expense: 200,
    balance: 800,
  };

  it('loads successfully on happy path with custom currency', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { default_currency: 'IDR' },
              error: null,
            }),
          };
        }
        if (table === 'cashflow_shares') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        if (table === 'cashflow_summaries') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockSummaryRow],
              error: null,
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await getCashflowDashboardData(mockSupabase, userId, email);
    expect(result.defaultCurrency).toBe('IDR');
    expect(result.cashflows).toHaveLength(1);
    expect(result.cashflows[0].title).toBe('Personal Cashflow');
  });

  it('throws PROFILE_NOT_FOUND when profile row does not exist (0 rows returned)', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        if (table === 'cashflow_shares') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    await expect(getCashflowDashboardData(mockSupabase, userId, email)).rejects.toThrow(
      'PROFILE_NOT_FOUND',
    );
  });

  it('throws PROFILE_NOT_FOUND when PostgREST returns PGRST116 code', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Row not found' },
            }),
          };
        }
        if (table === 'cashflow_shares') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    await expect(getCashflowDashboardData(mockSupabase, userId, email)).rejects.toThrow(
      'PROFILE_NOT_FOUND',
    );
  });

  it('recovers from transient 504 Gateway Timeout on profile lookup via retry', async () => {
    let profileCallCount = 0;

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockImplementation(() => {
              profileCallCount++;
              if (profileCallCount === 1) {
                // First attempt: 504 Gateway Timeout
                return Promise.resolve({
                  data: null,
                  error: { code: '504', message: 'Gateway Timeout' },
                });
              }
              // Second attempt: succeeds
              return Promise.resolve({
                data: { default_currency: 'EUR' },
                error: null,
              });
            }),
          };
        }
        if (table === 'cashflow_shares') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'cashflow_summaries') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockSummaryRow],
              error: null,
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as unknown as SupabaseClient<Database>;

    const result = await getCashflowDashboardData(mockSupabase, userId, email);
    expect(profileCallCount).toBe(2);
    expect(result.defaultCurrency).toBe('EUR');
    expect(result.cashflows).toHaveLength(1);
  });

  it('falls back to DEFAULT_CURRENCY without crashing when profile lookup persistently fails with 504', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '504', message: 'Gateway Timeout' },
            }),
          };
        }
        if (table === 'cashflow_shares') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'cashflow_summaries') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockSummaryRow],
              error: null,
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as unknown as SupabaseClient<Database>;

    const result = await getCashflowDashboardData(mockSupabase, userId, email);
    expect(result.defaultCurrency).toBe(DEFAULT_CURRENCY);
    expect(result.cashflows).toHaveLength(1);
  });

  it('recovers from transient failure on cashflow_shares lookup via retry', async () => {
    let sharesCallCount = 0;

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { default_currency: 'USD' },
              error: null,
            }),
          };
        }
        if (table === 'cashflow_shares') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation(() => {
              sharesCallCount++;
              if (sharesCallCount === 1) {
                return Promise.resolve({
                  data: null,
                  error: { code: '504', message: 'Gateway Timeout' },
                });
              }
              return Promise.resolve({
                data: [
                  {
                    cashflow_id: 'cf-shared-1',
                    is_included_in_totals: true,
                    is_pinned: true,
                  },
                ],
                error: null,
              });
            }),
          };
        }
        if (table === 'cashflow_summaries') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            or: vi.fn().mockResolvedValue({
              data: [
                mockSummaryRow,
                {
                  ...mockSummaryRow,
                  id: 'cf-shared-1',
                  user_id: 'other-user',
                  title: 'Shared Cashflow',
                },
              ],
              error: null,
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as unknown as SupabaseClient<Database>;

    const result = await getCashflowDashboardData(mockSupabase, userId, email);
    expect(sharesCallCount).toBe(2);
    expect(result.cashflows).toHaveLength(2);
  });

  it('degrades gracefully to empty shares when shares lookup persistently fails', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { default_currency: 'USD' },
              error: null,
            }),
          };
        }
        if (table === 'cashflow_shares') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '504', message: 'Gateway Timeout' },
            }),
          };
        }
        if (table === 'cashflow_summaries') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockSummaryRow],
              error: null,
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as unknown as SupabaseClient<Database>;

    const result = await getCashflowDashboardData(mockSupabase, userId, email);
    expect(result.cashflows).toHaveLength(1);
    expect(result.cashflows[0].id).toBe('cf-1');
  });

  it('does not crash if chart aggregates RPC fails', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { default_currency: 'USD' },
              error: null,
            }),
          };
        }
        if (table === 'cashflow_shares') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'cashflow_summaries') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockSummaryRow],
              error: null,
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { code: '504', message: 'RPC Timeout' },
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await getCashflowDashboardData(mockSupabase, userId, email);
    expect(result.aggregates).toEqual([]);
    expect(result.cashflows).toHaveLength(1);
  });
});
