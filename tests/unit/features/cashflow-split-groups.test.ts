import { describe, it, expect } from 'vitest';
import { calculateNetBalances, canonicalizeName } from '@/features/cashflow/lib/split-math';
import type { CashflowSplitGroupExpenseDTO } from '@/types/dto';

describe('Cashflow Zero-Signup Split Group Engine', () => {
  it('correctly calculates equal splits among 3 people', () => {
    // Alice pays 90 for Dinner, split between Alice, Bob, Charlie (30 each)
    const expenses: CashflowSplitGroupExpenseDTO[] = [
      {
        id: 'e1',
        group_id: 'g1',
        device_token: 'd1',
        description: 'Dinner',
        amount: 90,
        paid_by: 'Alice',
        split_between: ['Alice', 'Bob', 'Charlie'],
        is_settlement: false,
        created_at: '2026-09-10T18:00:00Z',
        updated_at: null,
      },
    ];

    const result = calculateNetBalances(expenses);

    expect(result.totalGroupSpend).toBe(90);
    expect(result.participants).toContain('Alice');
    expect(result.participants).toContain('Bob');
    expect(result.participants).toContain('Charlie');

    const alice = result.balances.find((b) => b.name === 'Alice')!;
    const bob = result.balances.find((b) => b.name === 'Bob')!;
    const charlie = result.balances.find((b) => b.name === 'Charlie')!;

    // Alice paid 90, share is 30 -> net = +60
    expect(alice.paid).toBe(90);
    expect(alice.share).toBe(30);
    expect(alice.netBalance).toBe(60);

    // Bob paid 0, share is 30 -> net = -30
    expect(bob.paid).toBe(0);
    expect(bob.share).toBe(30);
    expect(bob.netBalance).toBe(-30);

    // Charlie paid 0, share is 30 -> net = -30
    expect(charlie.paid).toBe(0);
    expect(charlie.share).toBe(30);
    expect(charlie.netBalance).toBe(-30);

    // Simplified settlements: Bob pays Alice 30, Charlie pays Alice 30
    expect(result.settlements).toHaveLength(2);
    expect(result.settlements.some((s) => s.from === 'Bob' && s.to === 'Alice' && s.amount === 30)).toBe(true);
    expect(result.settlements.some((s) => s.from === 'Charlie' && s.to === 'Alice' && s.amount === 30)).toBe(true);
  });

  it('strictly excludes debt settlements from totalGroupSpend (Ghost Debt Guard)', () => {
    // 1. Alice pays 60 for Groceries split between Alice & Bob (30 each)
    // 2. Bob pays Alice 30 to settle up (is_settlement: true)
    const expenses: CashflowSplitGroupExpenseDTO[] = [
      {
        id: 'e1',
        group_id: 'g1',
        device_token: 'd1',
        description: 'Groceries',
        amount: 60,
        paid_by: 'Alice',
        split_between: ['Alice', 'Bob'],
        is_settlement: false,
        created_at: '2026-09-10T12:00:00Z',
        updated_at: null,
      },
      {
        id: 'e2',
        group_id: 'g1',
        device_token: 'd2',
        description: 'Bob settled with Alice',
        amount: 30,
        paid_by: 'Bob',
        split_between: ['Alice'],
        is_settlement: true, // Payoff transaction!
        created_at: '2026-09-10T14:00:00Z',
        updated_at: null,
      },
    ];

    const result = calculateNetBalances(expenses);

    // Group spend must be exactly 60 (NOT 90! No double-counting)
    expect(result.totalGroupSpend).toBe(60);
    expect(result.totalSettlementAmount).toBe(30);

    const alice = result.balances.find((b) => b.name === 'Alice')!;
    const bob = result.balances.find((b) => b.name === 'Bob')!;

    // Both should now be completely settled (net balance = 0)
    expect(alice.netBalance).toBe(0);
    expect(bob.netBalance).toBe(0);
    expect(result.settlements).toHaveLength(0);
  });

  it('canonicalizes participant names case-insensitively and trims whitespace', () => {
    const canonicalMap = new Map<string, string>();
    const n1 = canonicalizeName('Alice', canonicalMap);
    const n2 = canonicalizeName(' alice ', canonicalMap);
    const n3 = canonicalizeName('ALICE', canonicalMap);

    expect(n1).toBe('Alice');
    expect(n2).toBe('Alice');
    expect(n3).toBe('Alice');
    expect(canonicalMap.size).toBe(1);
  });
});
