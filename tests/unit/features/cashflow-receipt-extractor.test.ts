import { describe, it, expect } from 'vitest';
import { parseReceiptText } from '@/features/cashflow/lib/receipt-extractor';

describe('Client-Side Zero-Storage Receipt Extractor (parseReceiptText)', () => {
  it('accurately parses standard Western English receipt format', () => {
    const rawText = `
      STARBUCKS COFFEE #1042
      123 MARKET STREET, SAN FRANCISCO
      DATE: 2026-09-15 08:30 AM
      INVOICE: #94012

      1 CAFFE LATTE        $5.50
      1 BUTTER CROISSANT   $4.25
      SUBTOTAL             $9.75
      TAX (8.5%)           $0.83
      GRAND TOTAL         $10.58

      THANK YOU FOR VISITING!
    `;

    const result = parseReceiptText(rawText);
    expect(result.merchant).toBe('Food & Dining');
    expect(result.category).toBe('food');
    expect(result.amount).toBe(10.58);
    expect(result.date).toBe('2026-09-15');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('accurately parses Indonesian minimarket receipt format', () => {
    const rawText = `
      PT INDOMARCO PRISMATAMA
      INDOMARET POINT KEBAYORAN
      JL. KYAI MAJA NO. 12
      TANGGAL : 19/09/2026 14:22
      KASIR : BUDI

      1 ULTRA MILK 250ML     6.500
      1 OREO VANILLA         8.500
      SUBTOTAL              15.000
      PPN 11%                1.650
      TOTAL BAYAR           16.650
      TUNAI                 20.000
      KEMBALI                3.350

      TERIMA KASIH
    `;

    const result = parseReceiptText(rawText);
    expect(result.merchant).toBe('Groceries');
    expect(result.category).toBe('food');
    expect(result.amount).toBe(16650);
    expect(result.date).toBe('2026-09-19');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('accurately parses word-formatted dates (e.g. 14 Sep 2026)', () => {
    const rawText = `
      WARTEG BAHARI JAKARTA
      DATE: 14 SEP 2026
      NASI AYAM            25.000
      ES TEH                5.000
      TOTAL                30.000
    `;

    const result = parseReceiptText(rawText);
    expect(result.amount).toBe(30000);
    expect(result.date).toBe('2026-09-14');
  });

  it('handles noisy receipts with tax IDs and telephone lines without picking them as merchant', () => {
    const rawText = `
      NPWP: 01.234.567.8-901.000
      TELP: (021) 555-1234
      SHELL SPBU GATOT SUBROTO
      DATE: 2026-09-10
      V-POWER DIESEL
      TOTAL: 350.000
    `;

    const result = parseReceiptText(rawText);
    expect(result.merchant).toBe('Transport & Commute');
    expect(result.category).toBe('transport');
    expect(result.amount).toBe(350000);
    expect(result.date).toBe('2026-09-10');
  });

  it('returns null fields and zero confidence for blank or unparseable input', () => {
    const emptyResult = parseReceiptText('');
    expect(emptyResult.merchant).toBeNull();
    expect(emptyResult.amount).toBeNull();
    expect(emptyResult.date).toBeNull();
    expect(emptyResult.confidence).toBe(0);

    const blankResult = parseReceiptText('   \n  \n  ');
    expect(blankResult.confidence).toBe(0);
  });
});
