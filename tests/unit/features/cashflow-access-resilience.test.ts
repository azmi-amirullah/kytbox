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
    expect(result[0]).toEqual({
      id: 'cf-1',
      title: 'Personal Book',
      isShared: false,
      role: 'owner',
    });
  });

  it('correctly maps shared books with edit and read permissions', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'cashflows') {
          let isOwnedQuery = false;
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation(() => {
              isOwnedQuery = true;
              return {
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              };
            }),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockImplementation(() => {
              if (isOwnedQuery) {
                return Promise.resolve({ data: [], error: null });
              }
              return Promise.resolve({
                data: [
                  { id: 'cf-shared-edit', title: 'Team Edit Book', created_at: '2026-09-02T00:00:00Z' },
                  { id: 'cf-shared-read', title: 'Team Read Book', created_at: '2026-09-03T00:00:00Z' },
                ],
                error: null,
              });
            }),
          };
        }
        if (table === 'cashflow_shares') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [
                { cashflow_id: 'cf-shared-edit', role: 'edit' },
                { cashflow_id: 'cf-shared-read', role: 'read' },
              ],
              error: null,
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await getAccessibleCashflows(mockSupabase, userId, email);
    expect(result).toHaveLength(2);

    const editBook = result.find((b) => b.id === 'cf-shared-edit');
    expect(editBook).toEqual({
      id: 'cf-shared-edit',
      title: 'Team Edit Book',
      isShared: true,
      role: 'edit',
    });

    const readBook = result.find((b) => b.id === 'cf-shared-read');
    expect(readBook).toEqual({
      id: 'cf-shared-read',
      title: 'Team Read Book',
      isShared: true,
      role: 'read',
    });

    // Verify /quick filter logic: read-only books are strictly excluded
    const quickBooks = result.filter((b) => b.role === 'owner' || b.role === 'edit');
    expect(quickBooks.map((b) => b.id)).toEqual(['cf-shared-edit']);
    expect(quickBooks.some((b) => b.role === 'read')).toBe(false);
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
