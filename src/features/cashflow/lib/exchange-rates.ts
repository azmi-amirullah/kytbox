import { ZERO_DECIMAL_CURRENCIES } from '@/lib/currency';
import { z } from 'zod';

const frankfurterResponseSchema = z.object({
  base: z.string(),
  date: z.string().optional(),
  rates: z.record(z.string(), z.number()),
});

/**
 * Static baseline exchange rates (USD base: 1 USD = X target currency).
 * Updated with resilient daily fallback rates (European Central Bank baseline).
 */
export const FALLBACK_EXCHANGE_RATES_USD_BASE: Record<string, number> = {
  USD: 1.0,
  IDR: 15750.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155.0,
  SGD: 1.35,
  MYR: 4.45,
  AUD: 1.55,
  CNY: 7.25,
  KRW: 1380.0,
  THB: 36.5,
  INR: 83.5,
};

// In-memory runtime matrix (hydrated with live daily rates when available)
let currentRatesMatrix: Record<string, number> = {
  ...FALLBACK_EXCHANGE_RATES_USD_BASE,
};
let lastFetchedAt: number | null = null;
let lastRatesDate: string | null = null;
let inFlightFetch: Promise<{
  rates: Record<string, number>;
  isLive: boolean;
  date: string;
}> | null = null;

/**
 * Updates the runtime matrix with fresh rates.
 */
export function updateExchangeRates(newRates: Record<string, number>): void {
  currentRatesMatrix = {
    ...FALLBACK_EXCHANGE_RATES_USD_BASE,
    ...newRates,
    USD: 1.0,
  };
}

/**
 * Retrieves the current in-memory rates matrix.
 */
export function getCurrentRatesMatrix(): Record<string, number> {
  return { ...currentRatesMatrix };
}

/**
 * Resolves the exchange rate between any two currencies using the USD base matrix.
 * Returns how many units of `toCurrency` 1 unit of `fromCurrency` buys.
 */
export function getExchangeRate(
  fromCurrency: string | null | undefined,
  toCurrency: string | null | undefined,
  ratesMatrix: Record<string, number> = currentRatesMatrix
): number {
  const from = (fromCurrency || 'USD').toUpperCase();
  const to = (toCurrency || 'USD').toUpperCase();

  if (from === to) return 1.0;

  const fromUsdRate = ratesMatrix[from] || FALLBACK_EXCHANGE_RATES_USD_BASE[from] || 1.0;
  const toUsdRate = ratesMatrix[to] || FALLBACK_EXCHANGE_RATES_USD_BASE[to] || 1.0;

  // Rate: (1 / fromUsdRate) * toUsdRate
  return toUsdRate / fromUsdRate;
}

export interface ConvertedCurrencyResult {
  originalAmount: number;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount: number;
  effectiveRate: number;
  formattedPreview: string;
}

/**
 * Converts an amount from one currency to another, respecting zero-decimal currency standards.
 */
export function convertCurrencyAmount(
  amount: number,
  fromCurrency: string | null | undefined,
  toCurrency: string | null | undefined,
  customRate?: number | null,
  ratesMatrix: Record<string, number> = currentRatesMatrix
): ConvertedCurrencyResult {
  const from = (fromCurrency || 'USD').toUpperCase();
  const to = (toCurrency || 'USD').toUpperCase();

  const rate =
    customRate && customRate > 0
      ? customRate
      : getExchangeRate(from, to, ratesMatrix);

  const rawConverted = amount * rate;
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(to);
  const convertedAmount = isZeroDecimal
    ? Math.round(rawConverted)
    : Math.round(rawConverted * 100) / 100;

  const formattedPreview = isZeroDecimal
    ? convertedAmount.toLocaleString()
    : convertedAmount.toFixed(2);

  return {
    originalAmount: amount,
    fromCurrency: from,
    toCurrency: to,
    convertedAmount,
    effectiveRate: rate,
    formattedPreview,
  };
}

export interface FetchExchangeRatesOptions {
  forceInstant?: boolean;
}

/**
 * Fetches live daily exchange rates from the European Central Bank feed (via Frankfurter API).
 * - Instantly fetches on boot / new deployment if no fetch has occurred before.
 * - Caches in-memory and in Next.js data cache for 24 hours (86,400s).
 * - Deduplicates concurrent in-flight requests.
 * - Fails safely to resilient static fallbacks if offline or timed out.
 */
export async function fetchLiveDailyExchangeRates(
  options?: FetchExchangeRatesOptions
): Promise<{
  rates: Record<string, number>;
  isLive: boolean;
  date: string;
}> {
  const isExpired = !lastFetchedAt || Date.now() - lastFetchedAt >= 86400 * 1000;

  // Return existing in-memory rates if cached within 24h and not forcing instant
  if (!options?.forceInstant && !isExpired && lastRatesDate) {
    return {
      rates: currentRatesMatrix,
      isLive: true,
      date: lastRatesDate,
    };
  }

  // Deduplicate concurrent in-flight fetches
  if (inFlightFetch) {
    return inFlightFetch;
  }

  inFlightFetch = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('https://api.frankfurter.app/latest?from=USD', {
        next: { revalidate: 86400 },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const rawJson: unknown = await res.json();
      const parsed = frankfurterResponseSchema.safeParse(rawJson);

      if (parsed.success) {
        const data = parsed.data;
        const merged = {
          ...FALLBACK_EXCHANGE_RATES_USD_BASE,
          ...data.rates,
          USD: 1.0,
        };
        updateExchangeRates(merged);
        lastFetchedAt = Date.now();
        lastRatesDate = data.date || new Date().toISOString().split('T')[0];
        return {
          rates: merged,
          isLive: true,
          date: lastRatesDate,
        };
      }
    } catch (err) {
      console.warn(
        '[ExchangeRates] Live fetch failed or timed out, falling back to static baseline:',
        err
      );
    } finally {
      inFlightFetch = null;
    }

    return {
      rates: currentRatesMatrix,
      isLive: false,
      date: lastRatesDate || new Date().toISOString().split('T')[0],
    };
  })();

  return inFlightFetch;
}

