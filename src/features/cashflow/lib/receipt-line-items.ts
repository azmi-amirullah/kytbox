export interface ReceiptLineItem {
  name: string;
  amount: number;
}

/**
 * Relative tolerance between the item sum and the receipt total.
 * Loose enough for AI rounding slop, tight enough to catch the
 * subtotal-vs-total mistake (tax/service charge is 5-15%).
 */
const SUM_TOLERANCE_RATIO = 0.01;
const MIN_SUM_TOLERANCE = 0.01;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Validates AI-extracted receipt line items before they are offered as a
 * Transaction Breakdown. The receipt total stays authoritative: when the items
 * cannot be trusted, the breakdown is dropped and only the total is kept.
 *
 * Returns an empty array when there is no usable breakdown — a single line item
 * is not a breakdown.
 */
export function sanitizeReceiptLineItems(
  items: readonly ReceiptLineItem[],
  total: number | null,
): ReceiptLineItem[] {
  const cleaned: ReceiptLineItem[] = [];
  for (const item of items) {
    const name = item.name.trim();
    const amount = round2(item.amount);
    if (!name || !Number.isFinite(amount) || amount <= 0) continue;
    cleaned.push({ name, amount });
  }

  if (cleaned.length < 2) return [];

  if (total !== null && Number.isFinite(total)) {
    const sum = round2(cleaned.reduce((acc, item) => acc + item.amount, 0));
    const tolerance = Math.max(MIN_SUM_TOLERANCE, Math.abs(total) * SUM_TOLERANCE_RATIO);
    if (Math.abs(sum - total) > tolerance) return [];
  }

  return cleaned;
}
