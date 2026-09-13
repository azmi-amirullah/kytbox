/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getAccessibleCashflows } from '@/features/cashflow/access';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

describe('getAccessibleCashflows Resilience & Fault Tolerance', () => {
  const userId = 'user-123';
  const email = 'user@example.com';

  const mockOwned = [
    { id: 'cf-1', title: 'Personal Book', created_at: '2026-09-01T00:00:00Z' },
  ];

  it('resolves owned and shared cashflows on happy path', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'cashflows') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockOwned,
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
        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await getAccessibleCashflows(mockSupabase, userId, email);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 'cf-1', title: 'Personal Book' });
  });

  it('recovers from transient 504 on owned lookup via retry', async () => {
    let ownedCalls = 0;
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'cashflows') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockImplementation(() => {
              ownedCalls++;
              if (ownedCalls === 1) {
                return Promise.resolve({
                  data: null,
                  error: { code: '504', message: 'Gateway Timeout' },
                });
              }
              return Promise.resolve({
                data: mockOwned,
                error: null,
              });
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
        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await getAccessibleCashflows(mockSupabase, userId, email);
    expect(ownedCalls).toBe(2);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('cf-1');
  });

  it('gracefully degrades to empty array when owned lookup fails persistently without throwing', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'cashflows') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '500', message: 'Internal Server Error' },
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
        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await getAccessibleCashflows(mockSupabase, userId, email);
    expect(result).toEqual([]);
  });

  it('gracefully returns empty array on PGRST301 (JWT expired) without throwing', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'cashflows') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST301', message: 'JWT expired' },
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
        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await getAccessibleCashflows(mockSupabase, userId, email);
    expect(result).toEqual([]);
  });

  it('recovers from transient failure on shares query via retry', async () => {
    let sharesCalls = 0;
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'cashflows') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockOwned,
              error: null,
            }),
          };
        }
        if (table === 'cashflow_shares') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation(() => {
              sharesCalls++;
              if (sharesCalls === 1) {
                return Promise.resolve({
                  data: null,
                  error: { code: '504', message: 'Gateway Timeout' },
                });
              }
              return Promise.resolve({
                data: [],
                error: null,
              });
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await getAccessibleCashflows(mockSupabase, userId, email);
    expect(sharesCalls).toBe(2);
    expect(result).toHaveLength(1);
  });
});
