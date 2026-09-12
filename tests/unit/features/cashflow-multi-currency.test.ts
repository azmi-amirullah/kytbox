import { describe, it, expect } from 'vitest';
import {
  getExchangeRate,
  convertCurrencyAmount,
} from '@/features/cashflow/lib/exchange-rates';

describe('Cashflow Multi-Currency & Live Exchange Engine', () => {
  it('returns 1.0 when from and to currencies are the same', () => {
    expect(getExchangeRate('USD', 'USD')).toBe(1.0);
    expect(getExchangeRate('IDR', 'IDR')).toBe(1.0);
    expect(getExchangeRate('EUR', 'EUR')).toBe(1.0);
  });

  it('calculates cross-rates via USD base correctly', () => {
    // 1 USD = 15750 IDR, 1 USD = 0.92 EUR
    // 1 EUR in IDR = 15750 / 0.92 = ~17119.56 IDR
    const eurToIdr = getExchangeRate('EUR', 'IDR');
    expect(eurToIdr).toBeCloseTo(15750 / 0.92, 2);

    const idrToUsd = getExchangeRate('IDR', 'USD');
    expect(idrToUsd).toBeCloseTo(1 / 15750, 6);
  });

  it('formats zero-decimal currencies without fractional parts', () => {
    // Converting $10 USD to IDR (@ 15750) -> 157,500 IDR (no decimals)
    const resultIdr = convertCurrencyAmount(10, 'USD', 'IDR');
    expect(resultIdr.convertedAmount).toBe(157500);
    expect(Number.isInteger(resultIdr.convertedAmount)).toBe(true);

    // Converting $10 USD to JPY (@ 155) -> 1,550 JPY (no decimals)
    const resultJpy = convertCurrencyAmount(10, 'USD', 'JPY');
    expect(resultJpy.convertedAmount).toBe(1550);
    expect(Number.isInteger(resultJpy.convertedAmount)).toBe(true);
  });

  it('formats standard decimal currencies with 2 decimal places', () => {
    // Converting $100 USD to EUR (@ 0.92) -> €92.00
    const resultEur = convertCurrencyAmount(100, 'USD', 'EUR');
    expect(resultEur.convertedAmount).toBe(92);

    // Converting €50 EUR to USD (@ 1 / 0.92 = ~1.087) -> ~$54.35
    const resultUsd = convertCurrencyAmount(50, 'EUR', 'USD');
    expect(resultUsd.convertedAmount).toBeCloseTo(54.35, 2);
  });

  it('respects custom exchange rate override when provided', () => {
    // Override rate: 1 EUR = 16000 IDR
    const customResult = convertCurrencyAmount(50, 'EUR', 'IDR', 16000);
    expect(customResult.effectiveRate).toBe(16000);
    expect(customResult.convertedAmount).toBe(800000);
  });

  it('allows updating runtime exchange rates dynamically', () => {
    const customRates = { EUR: 0.85, IDR: 16000 };
    const rateWithMatrix = getExchangeRate('EUR', 'USD', { USD: 1.0, ...customRates });
    expect(rateWithMatrix).toBeCloseTo(1 / 0.85, 4);
  });

  it('fetches live rates or falls back safely to static baseline', async () => {
    const { fetchLiveDailyExchangeRates } = await import('@/features/cashflow/lib/exchange-rates');
    const res = await fetchLiveDailyExchangeRates({ forceInstant: true });
    expect(res).toBeDefined();
    expect(res.rates.USD).toBe(1.0);
    expect(res.rates.IDR).toBeGreaterThan(0);
    expect(res.rates.EUR).toBeGreaterThan(0);
  });
});
