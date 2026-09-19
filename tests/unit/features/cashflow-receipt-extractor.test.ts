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

  it('accurately parses mobile e-commerce screenshots with status bars and order lists (e.g. Shopee)', () => {
    const rawText = `
      2:52 al 4G @
      & Pesanan Saya @ 4
      Semua  BelumBayar Dikemas Dikirim Selesai Pen
      AEROSTREET Official Shop Dikemas
      Aerostreet 37-41 Ortiz Natural Natural Krem...
      Natural Krem,37 a
      Rp299.800Rp189.900
      Total 1 produk: Rp141.298
      Estimasi Tiba: 23 Ags - 25 Ags
      Hubungi Penjual
       KORMESIC Beauty Dikemas
      BPOM] CLABEAU Clarity Beauty Brightenin...
      v Rp120.000 Rp60.199
      Total 1 produk: Rp60.801
      Estimasi Tiba: 21 Ags - 24 Ags
      Hubungi Penjual
      ———— Kamu Mungkin Juga Suka ———
    `;

    const result = parseReceiptText(rawText);
    expect(result.merchant).toBe('Clothing & Apparel');
    expect(result.category).toBe('shopping');
    expect(result.suggestedTags).toContain('fashion');
    expect(result.amount).toBe(141298);
  });

  it('accurately parses thermal supermarket receipts with multiline totals and logo artifacts (e.g. Top 100)', () => {
    const rawText = `
      i = i
      |
      \\
      ? TOP 100, Po
      ae Plaza Top 100 Regency #A1
      Terminal : T0211   17/08/2026 05:52:01 PM
      Cashier : 0211
      MULTI MP-08 SOFT 1KG @ 28,500
      8992931025000   2 PCS = 57,000
      WIPOL RF 1400G CEMARA @ 23,500
      899999595968   1 PCS = 23,500
      INDOMIE SOTO MEDAN 70G @ 2,900
      089686010312   6 PCS = 17,400
      Total Rp.:
      610,815
      Debit Card 610,815
    `;

    const result = parseReceiptText(rawText);
    expect(result.merchant).toBe('Top 100');
    expect(result.category).toBe('food');
    expect(result.amount).toBe(610815);
    expect(result.date).toBe('2026-08-17');
    expect(result.suggestedTags).toContain('groceries');
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
