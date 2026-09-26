import { getCurrency, formatCurrency, formatCurrencyCompact, formatCompactAmount, getCurrencySymbol } from '@/lib/currency';

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

describe('formatCompactAmount', () => {
  it('actually compacts where formatCurrencyCompact only groups', () => {
    expect(formatCompactAmount(1055800, 'IDR').length).toBeLessThan(
      formatCurrencyCompact(1055800, 'IDR').length,
    );
  });

  it('omits the currency symbol so a 7-column cell can fit the figure', () => {
    expect(formatCompactAmount(10000000, 'IDR')).not.toContain('Rp');
    expect(formatCompactAmount(10000000, 'USD')).not.toContain('$');
  });

  it('leaves sub-threshold amounts alone', () => {
    expect(formatCompactAmount(0, 'USD')).toBe('0');
    expect(formatCompactAmount(500, 'IDR')).toBe('500');
  });

  it('stays within the 5 characters a 320px day cell can render', () => {
    const realisticExpenses = [
      86, 1622, 86500, 450500, 999900, 1500000, 9900000, 10000000,
    ];
    for (const amount of realisticExpenses) {
      expect(
        formatCompactAmount(amount, 'IDR').length,
        `${amount} renders too wide`,
      ).toBeLessThanOrEqual(5);
    }
  });

  it('never implies a fraction of a zero-decimal currency', () => {
    expect(formatCompactAmount(450.5, 'IDR')).toBe('450');
    expect(formatCompactAmount(1055800.75, 'IDR')).toBe('1,1jt');
  });

  it('keeps the fractional unit where dropping it overstates the figure', () => {
    expect(formatCompactAmount(1500000, 'IDR')).toBe('1,5jt');
    expect(formatCompactAmount(1622, 'IDR')).toBe('1,6rb');
  });
});
