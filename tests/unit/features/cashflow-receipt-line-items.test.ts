import { describe, it, expect } from 'vitest';
import { sanitizeReceiptLineItems } from '@/features/cashflow/lib/receipt-line-items';

describe('sanitizeReceiptLineItems', () => {
  it('keeps a multi-line breakdown whose sum matches the receipt total', () => {
    const result = sanitizeReceiptLineItems(
      [
        { name: 'Groceries', amount: 70 },
        { name: 'Cleaning Supplies', amount: 30 },
      ],
      100,
    );

    expect(result).toEqual([
      { name: 'Groceries', amount: 70 },
      { name: 'Cleaning Supplies', amount: 30 },
    ]);
  });

  it('drops the breakdown when there is only one item', () => {
    expect(
      sanitizeReceiptLineItems([{ name: 'Coffee', amount: 10.5 }], 10.5),
    ).toEqual([]);
  });

  it('drops the breakdown when the AI returns nothing', () => {
    expect(sanitizeReceiptLineItems([], 100)).toEqual([]);
  });

  it('drops the breakdown when the sum disagrees with the total', () => {
    // Subtotal 100 vs total 110 (tax/service left out)
    expect(
      sanitizeReceiptLineItems(
        [
          { name: 'Item A', amount: 60 },
          { name: 'Item B', amount: 40 },
        ],
        110,
      ),
    ).toEqual([]);
  });

  it('tolerates rounding slop within 1% of the total', () => {
    // Sum 99.50 vs total 100 → 0.5% gap, inside the 1% tolerance
    expect(
      sanitizeReceiptLineItems(
        [
          { name: 'Item A', amount: 33.5 },
          { name: 'Item B', amount: 33 },
          { name: 'Item C', amount: 33 },
        ],
        100,
      ),
    ).toHaveLength(3);
  });

  it('keeps items when the receipt total is unknown', () => {
    expect(
      sanitizeReceiptLineItems(
        [
          { name: 'Item A', amount: 40 },
          { name: 'Item B', amount: 60 },
        ],
        null,
      ),
    ).toHaveLength(2);
  });

  it('discards blank names and non-positive amounts', () => {
    expect(
      sanitizeReceiptLineItems(
        [
          { name: '   ', amount: 10 },
          { name: 'Coffee', amount: 0 },
          { name: 'Tea', amount: -5 },
          { name: 'Cake', amount: 20 },
          { name: 'Juice', amount: 15 },
        ],
        35,
      ),
    ).toEqual([
      { name: 'Cake', amount: 20 },
      { name: 'Juice', amount: 15 },
    ]);
  });
});
