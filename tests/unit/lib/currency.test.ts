import { getCurrency, formatCurrency, getCurrencySymbol } from '@/lib/currency';

describe('getCurrency', () => {
  it('returns the correct currency for a known code', () => {
    const currency = getCurrency('IDR');
    expect(currency.code).toBe('IDR');
    expect(currency.symbol).toBe('Rp');
  });

  it('falls back to USD for an unknown code', () => {
    expect(getCurrency('XYZ').code).toBe('USD');
  });

  it('falls back to USD for null', () => {
    expect(getCurrency(null).code).toBe('USD');
  });

  it('falls back to USD for undefined', () => {
    expect(getCurrency(undefined).code).toBe('USD');
  });
});

describe('getCurrencySymbol', () => {
  it('returns correct symbol for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
  });

  it('returns correct symbol for EUR', () => {
    expect(getCurrencySymbol('EUR')).toBe('€');
  });

  it('returns USD symbol as fallback for unknown code', () => {
    expect(getCurrencySymbol('FAKE')).toBe('$');
  });
});

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    const result = formatCurrency(1000, 'USD');
    expect(result).toContain('1,000');
    expect(result).toContain('$');
  });

  it('formats zero as currency', () => {
    const result = formatCurrency(0, 'USD');
    expect(result).toContain('0');
  });

  it('falls back to USD formatting for unknown currency', () => {
    const result = formatCurrency(500, 'XYZ');
    expect(result).toContain('$');
  });
});
