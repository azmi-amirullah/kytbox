import { describe, it, expect } from 'vitest';
import { validateSplitTotal } from '@/features/cashflow/math';
import { cashflowSplitItemSchema } from '@/features/cashflow/schemas.server';
import { splitItemDtoSchema } from '@/features/cashflow/schemas.client';
import { mapCashflowEntryToDTO } from '@/lib/mappers';
import type { CashflowEntry, CashflowSplitEntry } from '@/types/database';

describe('Cashflow Split Transactions', () => {
  describe('validateSplitTotal', () => {
    it('returns true when sum of split items matches parent amount', () => {
      const parentAmount = 10000;
      const items = [
        { amount: 1000 },
        { amount: 1000 },
        { amount: 8000 },
      ];
      const result = validateSplitTotal(parentAmount, items);
      expect(result.isValid).toBe(true);
      expect(result.sum).toBe(10000);
      expect(result.diff).toBe(0);
    });

    it('returns false when sum of split items does not match parent amount', () => {
      const parentAmount = 10000;
      const items = [
        { amount: 1000 },
        { amount: 1000 },
      ];
      const result = validateSplitTotal(parentAmount, items);
      expect(result.isValid).toBe(false);
      expect(result.sum).toBe(2000);
      expect(result.diff).toBe(8000);
    });

    it('handles floating point precision accurately', () => {
      const parentAmount = 15.30;
      const items = [
        { amount: 10.10 },
        { amount: 5.20 },
      ];
      const result = validateSplitTotal(parentAmount, items);
      expect(result.isValid).toBe(true);
      expect(result.sum).toBe(15.30);
    });
  });

  describe('Schemas', () => {
    it('parses valid split item server input', () => {
      const parsed = cashflowSplitItemSchema.parse({
        itemName: 'Choco',
        category: 'food',
        amount: '1000',
      });
      expect(parsed.itemName).toBe('Choco');
      expect(parsed.amount).toBe(1000);
    });

    it('parses split item DTO client schema', () => {
      const dto = splitItemDtoSchema.parse({
        id: 'split-1',
        parent_entry_id: 'entry-1',
        item_name: 'Water',
        category: 'utilities',
        amount: 1000,
      });
      expect(dto.item_name).toBe('Water');
      expect(dto.amount).toBe(1000);
    });
  });

  describe('mapCashflowEntryToDTO', () => {
    it('maps entry with child split entries into DTO with items property', () => {
      const rawEntry: CashflowEntry & { cashflow_split_entries?: CashflowSplitEntry[] } = {
        id: 'entry-100',
        cashflow_id: 'cf-100',
        goal_id: null,
        description: 'Supermarket Store Purchase',
        amount: 10000,
        type: 'expense',
        category: 'shopping',
        date: '2026-08-13',
        is_recurring: false,
        recurrence_interval: null,
        yearly_calculation: null,
        created_at: '2026-08-13T10:00:00Z',
        tags: [],
        cashflow_split_entries: [
          {
            id: 's-1',
            parent_entry_id: 'entry-100',
            item_name: 'Choco',
            category: 'food',
            amount: 1000,
            created_at: '2026-08-13T10:00:00Z',
          },
          {
            id: 's-2',
            parent_entry_id: 'entry-100',
            item_name: 'Water',
            category: 'food',
            amount: 1000,
            created_at: '2026-08-13T10:00:00Z',
          },
        ],
      };

      const dto = mapCashflowEntryToDTO(rawEntry);
      expect(dto.amount).toBe(10000);
      expect(dto.items).toBeDefined();
      expect(dto.items?.length).toBe(2);
      expect(dto.items?.[0].item_name).toBe('Choco');
      expect(dto.items?.[1].item_name).toBe('Water');
    });
  });
});
