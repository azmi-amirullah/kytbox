import { shiftToCurrentMonth } from '@/features/cashflow/math';

describe('shiftToCurrentMonth', () => {
  it('shifts year and month to target Date while keeping day of month', () => {
    const fixedDate = new Date(Date.UTC(2026, 7, 15)); // August 15, 2026
    expect(shiftToCurrentMonth('2025-01-10', fixedDate)).toBe('2026-08-10');
  });

  it('clamps day of month if target month has fewer days (e.g. Feb 30 -> Feb 28)', () => {
    const febDate = new Date(Date.UTC(2026, 1, 10)); // February 2026
    expect(shiftToCurrentMonth('2026-01-31', febDate)).toBe('2026-02-28');
  });

  it('handles leap year in February correctly', () => {
    const leapFeb = new Date(Date.UTC(2028, 1, 10)); // February 2028 (leap year)
    expect(shiftToCurrentMonth('2026-01-31', leapFeb)).toBe('2028-02-29');
  });

  it('returns current date string for invalid date formats', () => {
    const fixedDate = new Date(Date.UTC(2026, 7, 15));
    expect(shiftToCurrentMonth('invalid-date', fixedDate)).toBe('2026-08-15');
  });
});
