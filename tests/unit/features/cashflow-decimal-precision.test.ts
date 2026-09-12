import { describe, it, expect } from 'vitest';
import { convertCurrencyAmount, getExchangeRate } from '@/features/cashflow/lib/exchange-rates';
import { calculateNetBalances } from '@/features/cashflow/lib/split-math';
import { formatCurrency, ZERO_DECIMAL_CURRENCIES } from '@/lib/currency';
import type { CashflowSplitGroupExpenseDTO } from '@/types/dto';

describe('Cashflow Decimal Precision & Floating-Point Safety Audit (Day 14)', () => {
  describe('Multi-Party Split Remainder & Balance Arithmetic', () => {
    it('handles 3-way split of 100 without losing cents', () => {
      // 100 split among Alice, Bob, Charlie = 33.333333333333336
      const expense: CashflowSplitGroupExpenseDTO = {
        id: 'e-100',
        group_id: 'g-1',
        device_token: 'd-1',
        description: 'Team Lunch',
        amount: 100,
        paid_by: 'Alice',
        split_between: ['Alice', 'Bob', 'Charlie'],
        is_settlement: false,
        created_at: '2026-09-14T12:00:00Z',
        updated_at: null,
      };

      const result = calculateNetBalances([expense]);

      expect(result.totalGroupSpend).toBe(100);

      const alice = result.balances.find((b) => b.name === 'Alice')!;
      const bob = result.balances.find((b) => b.name === 'Bob')!;
      const charlie = result.balances.find((b) => b.name === 'Charlie')!;

      expect(alice.paid).toBe(100);
      expect(bob.paid).toBe(0);
      expect(charlie.paid).toBe(0);

      // Share per person is 33.33
      expect(alice.share).toBe(33.33);
      expect(bob.share).toBe(33.33);
      expect(charlie.share).toBe(33.33);

      // Alice net balance is +66.67
      expect(alice.netBalance).toBe(66.67);
      expect(bob.netBalance).toBe(-33.33);
      expect(charlie.netBalance).toBe(-33.33);

      // Sum of all net balances in closed system must be practically 0 (within 0.02 due to cent rounding)
      const sumNet = alice.netBalance + bob.netBalance + charlie.netBalance;
      expect(Math.abs(sumNet)).toBeLessThanOrEqual(0.02);

      // Settlements: Bob pays Alice 33.33, Charlie pays Alice 33.33 (Total = 66.66 settled)
      const totalSettled = result.settlements.reduce((acc, s) => acc + s.amount, 0);
      expect(totalSettled).toBeCloseTo(66.66, 2);
    });

    it('handles multiple overlapping expenses with settlement offsets', () => {
      const expenses: CashflowSplitGroupExpenseDTO[] = [
        {
          id: 'e1',
          group_id: 'g1',
          device_token: 'd1',
          description: 'Gas',
          amount: 45.50,
          paid_by: 'Dave',
          split_between: ['Dave', 'Emma'],
          is_settlement: false,
          created_at: '2026-09-14T10:00:00Z',
          updated_at: null,
        },
        {
          id: 'e2',
          group_id: 'g1',
          device_token: 'd2',
          description: 'Snacks',
          amount: 14.75,
          paid_by: 'Emma',
          split_between: ['Dave', 'Emma'],
          is_settlement: false,
          created_at: '2026-09-14T11:00:00Z',
          updated_at: null,
        },
      ];

      const result = calculateNetBalances(expenses);
      // Dave paid 45.50, share is 22.75 + 7.375 = 30.125
      // Emma paid 14.75, share is 22.75 + 7.375 = 30.125
      // Dave net = +15.37, Emma net = -15.38 (or -15.37)
      expect(result.totalGroupSpend).toBe(60.25);
      expect(result.settlements).toHaveLength(1);
      expect(result.settlements[0].from).toBe('Emma');
      expect(result.settlements[0].to).toBe('Dave');
      expect(result.settlements[0].amount).toBeCloseTo(15.37, 1);
    });
  });

  describe('Currency Conversion Precision & Zero-Decimal Bounds', () => {
    it('guarantees IDR and JPY never contain fractional cents', () => {
      const currencies = ['IDR', 'JPY', 'KRW'];
      for (const curr of currencies) {
        expect(ZERO_DECIMAL_CURRENCIES.has(curr)).toBe(true);

        const res = convertCurrencyAmount(33.333, 'USD', curr);
        expect(Number.isInteger(res.convertedAmount)).toBe(true);
        expect(res.formattedPreview).not.toContain('.');

        const formatted = formatCurrency(res.convertedAmount, curr);
        expect(formatted).not.toMatch(/[,.]00$/);
      }
    });

    it('maintains reciprocal accuracy in cross-currency conversion', () => {
      const rateUsdToEur = getExchangeRate('USD', 'EUR');
      const rateEurToUsd = getExchangeRate('EUR', 'USD');

      // Product of reciprocal rates must be 1.0
      expect(rateUsdToEur * rateEurToUsd).toBeCloseTo(1.0, 5);
    });
  });
});
