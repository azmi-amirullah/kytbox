import { getCurrency, formatCurrency, formatCurrencyCompact, getCurrencySymbol } from '@/lib/currency';

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

describe('formatCurrencyCompact', () => {
  it('never leaks fraction digits for zero-decimal currencies', () => {
    // Raw float used to render as "1.218.230,769" (reads as ~1000x the value).
    const result = formatCurrencyCompact(1218230.769230769, 'IDR');
    expect(result).toBe('Rp 1.218.231');
    expect(result).not.toContain(',');
  });

  it('caps non-zero-decimal currencies at 2 fraction digits', () => {
    expect(formatCurrencyCompact(1234.5678, 'USD')).toBe('$ 1,234.57');
  });

  it('leaves integers untouched (no padded decimals)', () => {
    expect(formatCurrencyCompact(1234, 'USD')).toBe('$ 1,234');
    expect(formatCurrencyCompact(1055800, 'IDR')).toBe('Rp 1.055.800');
  });

  it('leaves legitimate 2-decimal values untouched', () => {
    expect(formatCurrencyCompact(1234.56, 'USD')).toBe('$ 1,234.56');
  });

  it('rounds half away from zero rather than truncating', () => {
    expect(formatCurrencyCompact(1234.565, 'USD')).toBe('$ 1,234.57');
    expect(formatCurrencyCompact(0.5, 'IDR')).toBe('Rp 1');
  });

  it('handles zero', () => {
    expect(formatCurrencyCompact(0, 'USD')).toBe('$ 0');
  });
});
