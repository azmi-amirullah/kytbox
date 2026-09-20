import { describe, it, expect } from 'vitest';
import {
  normalizeMerchantDescription,
  resolveMerchantCategory,
  learnMerchantRulesFromEntries,
} from '@/features/cashflow/lib/merchant-rules';
import type { CashflowEntryDTO } from '@/types/dto';

describe('Merchant Alias & Auto-Categorization Rule Engine', () => {
  describe('normalizeMerchantDescription', () => {
    it('strips common banking transaction noise and prefixes', () => {
      expect(
        normalizeMerchantDescription('POS DEBIT 0918 SQ *STARBUCKS COFFEE'),
      ).toBe('0918 sq starbucks coffee');
      expect(
        normalizeMerchantDescription('QRIS INDOMARET POINT JKT ID: 12345'),
      ).toBe('indomaret point jkt');
      expect(
        normalizeMerchantDescription('TRANSFER KE REKENING PLN PREPAID'),
      ).toBe('rekening pln prepaid');
      expect(
        normalizeMerchantDescription('PURCHASE AUTH GRAB *RIDE 84920'),
      ).toBe('grab ride 84920');
    });

    it('handles empty or blank inputs gracefully', () => {
      expect(normalizeMerchantDescription('')).toBe('');
      expect(normalizeMerchantDescription('   ')).toBe('');
    });
  });

  describe('resolveMerchantCategory (Built-In Rules)', () => {
    it('accurately resolves food and dining merchants', () => {
      const matchStarbucks = resolveMerchantCategory('Starbucks Reserve Senopati');
      expect(matchStarbucks).not.toBeNull();
      expect(matchStarbucks?.category).toBe('food');
      expect(matchStarbucks?.suggestedType).toBe('expense');

      const matchGrabFood = resolveMerchantCategory('GrabFood Order #12345');
      expect(matchGrabFood?.category).toBe('food');

      const matchMcd = resolveMerchantCategory('McDonalds Sarinah');
      expect(matchMcd?.category).toBe('food');
    });

    it('accurately resolves groceries and supermarkets', () => {
      const matchIndomaret = resolveMerchantCategory('Indomaret Kebayoran');
      expect(matchIndomaret?.category).toBe('food');
      expect(matchIndomaret?.suggestedTags).toContain('groceries');

      const matchSupermarket = resolveMerchantCategory('Superindo Duren Tiga');
      expect(matchSupermarket?.category).toBe('food');
    });

    it('accurately resolves transport and commute', () => {
      const matchGrab = resolveMerchantCategory('Grab Ride to Airport');
      expect(matchGrab?.category).toBe('transport');

      const matchShell = resolveMerchantCategory('SPBU Shell Gatot Subroto');
      expect(matchShell?.category).toBe('transport');

      const matchMRT = resolveMerchantCategory('MRT Jakarta Dukuh Atas');
      expect(matchMRT?.category).toBe('transport');
    });

    it('accurately resolves utilities and telecom', () => {
      const matchPln = resolveMerchantCategory('Token PLN Listrik Rumah');
      expect(matchPln?.category).toBe('utilities');

      const matchTelkom = resolveMerchantCategory('Tagihan Indihome Telkom');
      expect(matchTelkom?.category).toBe('utilities');
    });

    it('accurately resolves entertainment and subscriptions', () => {
      const matchNetflix = resolveMerchantCategory('Netflix Subscription Monthly');
      expect(matchNetflix?.category).toBe('entertainment');

      const matchSpotify = resolveMerchantCategory('Spotify Premium Family');
      expect(matchSpotify?.category).toBe('entertainment');
    });

    it('accurately resolves shopping and retail', () => {
      const matchTokopedia = resolveMerchantCategory('Tokopedia Transaksi #991');
      expect(matchTokopedia?.category).toBe('shopping');

      const matchUniqlo = resolveMerchantCategory('Uniqlo Grand Indonesia');
      expect(matchUniqlo?.category).toBe('shopping');
    });

    it('accurately resolves health and pharmacy', () => {
      const matchApotek = resolveMerchantCategory('Kimia Farma Apotek');
      expect(matchApotek?.category).toBe('health');
    });

    it('accurately resolves income categories', () => {
      const matchSalary = resolveMerchantCategory('Payroll Gaji Bulanan');
      expect(matchSalary?.category).toBe('salary');
      expect(matchSalary?.suggestedType).toBe('income');

      const matchFreelance = resolveMerchantCategory('Upwork Escrow Client Payout');
      expect(matchFreelance?.category).toBe('freelance');
      expect(matchFreelance?.suggestedType).toBe('income');

      const matchInvestment = resolveMerchantCategory('Bibit Reksadana Dividen');
      expect(matchInvestment?.category).toBe('investment');
      expect(matchInvestment?.suggestedType).toBe('income');
    });

    it('returns null for unknown generic strings', () => {
      expect(resolveMerchantCategory('Unknown random XYZ memo 9871')).toBeNull();
    });
  });

  describe('learnMerchantRulesFromEntries (Transaction History Learning)', () => {
    const mockEntries: CashflowEntryDTO[] = [
      {
        id: '1',
        cashflow_id: 'book-1',
        description: 'Warung Kopi Tante',
        amount: 35000,
        type: 'expense',
        category: 'food',
        date: '2026-09-01',
        is_recurring: false,
        goal_id: null,
        recurrence_interval: null,
        yearly_calculation: null,
        tags: ['coffee', 'hangout'],
        created_at: '2026-09-01T00:00:00Z',
      },
      {
        id: '2',
        cashflow_id: 'book-1',
        description: 'Warung Kopi Tante',
        amount: 42000,
        type: 'expense',
        category: 'food',
        date: '2026-09-05',
        is_recurring: false,
        goal_id: null,
        recurrence_interval: null,
        yearly_calculation: null,
        tags: ['coffee'],
        created_at: '2026-09-05T00:00:00Z',
      },
      {
        id: '3',
        cashflow_id: 'book-1',
        description: 'Bengkel Motor Langganan',
        amount: 150000,
        type: 'expense',
        category: 'transport',
        date: '2026-09-07',
        is_recurring: false,
        goal_id: null,
        recurrence_interval: null,
        yearly_calculation: null,
        tags: ['maintenance'],
        created_at: '2026-09-07T00:00:00Z',
      },
      {
        id: '4',
        cashflow_id: 'book-1',
        description: 'Bengkel Motor Langganan',
        amount: 85000,
        type: 'expense',
        category: 'transport',
        date: '2026-09-12',
        is_recurring: false,
        goal_id: null,
        recurrence_interval: null,
        yearly_calculation: null,
        tags: ['maintenance'],
        created_at: '2026-09-12T00:00:00Z',
      },
    ];

    it('learns custom merchants from user transaction history', () => {
      const learnedIndex = learnMerchantRulesFromEntries(mockEntries);

      // Exact match for custom un-indexed merchant
      const matchKopi = resolveMerchantCategory(
        'Warung Kopi Tante',
        'expense',
        learnedIndex,
      );
      expect(matchKopi).not.toBeNull();
      expect(matchKopi?.confidence).toBe('learned');
      expect(matchKopi?.category).toBe('food');
      expect(matchKopi?.suggestedTags).toContain('coffee');

      // Token match for custom mechanic
      const matchBengkel = resolveMerchantCategory(
        'Bengkel Motor Langganan',
        'expense',
        learnedIndex,
      );
      expect(matchBengkel?.confidence).toBe('learned');
      expect(matchBengkel?.category).toBe('transport');
      expect(matchBengkel?.suggestedTags).toContain('maintenance');
    });

    it('prioritizes user learned history over generic built-in rules if customized', () => {
      // User custom-categorized Starbucks as "business" or "other" in their past entries
      const customStarbucksEntries: CashflowEntryDTO[] = [
        {
          id: '5',
          cashflow_id: 'book-1',
          description: 'Starbucks Meeting',
          amount: 85000,
          type: 'expense',
          category: 'other',
          date: '2026-09-10',
          is_recurring: false,
          goal_id: null,
          recurrence_interval: null,
          yearly_calculation: null,
          tags: ['business'],
          created_at: '2026-09-10T00:00:00Z',
        },
      ];

      const learned = learnMerchantRulesFromEntries(customStarbucksEntries);
      const match = resolveMerchantCategory('Starbucks Meeting', 'expense', learned);
      expect(match?.confidence).toBe('learned');
      expect(match?.category).toBe('other');
      expect(match?.suggestedTags).toContain('business');
    });
  });

  describe('isTagDuplicateOfCategory & category duplicate prevention', () => {
    it('accurately identifies tags that duplicate category slugs or labels', async () => {
      const { isTagDuplicateOfCategory } = await import('@/features/cashflow/constants');

      // Exact matches
      expect(isTagDuplicateOfCategory('transport', 'transport')).toBe(true);
      expect(isTagDuplicateOfCategory('Transport', 'transport')).toBe(true);
      expect(isTagDuplicateOfCategory('#transport', 'transport')).toBe(true);
      expect(isTagDuplicateOfCategory('Food', 'food')).toBe(true);
      expect(isTagDuplicateOfCategory('Shopping', 'shopping')).toBe(true);

      // Plural / singular variations
      expect(isTagDuplicateOfCategory('transports', 'transport')).toBe(true);
      expect(isTagDuplicateOfCategory('Utilities', 'utilities')).toBe(true);
      expect(isTagDuplicateOfCategory('Utility', 'utilities')).toBe(true);
      expect(isTagDuplicateOfCategory('Bills', 'utilities')).toBe(true);
      expect(isTagDuplicateOfCategory('Bill', 'utilities')).toBe(true);

      // Non-duplicates
      expect(isTagDuplicateOfCategory('Groceries', 'food')).toBe(false);
      expect(isTagDuplicateOfCategory('Taxi', 'transport')).toBe(false);
      expect(isTagDuplicateOfCategory('Fuel', 'transport')).toBe(false);
      expect(isTagDuplicateOfCategory('Fashion', 'shopping')).toBe(false);
    });

    it('does not suggest tags that duplicate the category in resolveMerchantCategory', () => {
      // Transport rule should NOT suggest 'transport'
      const matchGrab = resolveMerchantCategory('Grab Ride to Airport');
      expect(matchGrab?.category).toBe('transport');
      expect(matchGrab?.suggestedTags).toBeUndefined();

      // Food rule with non-duplicate tag (Indomaret -> groceries) should still be suggested
      const matchIndomaret = resolveMerchantCategory('Indomaret Kebayoran');
      expect(matchIndomaret?.category).toBe('food');
      expect(matchIndomaret?.suggestedTags).toContain('groceries');
    });
  });
});
