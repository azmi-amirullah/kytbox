import { describe, expect, it } from 'vitest';
import { escapeCsvField } from '@/features/cashflow/lib/csv';

describe('escapeCsvField', () => {
  it('escapes commas and quotes', () => {
    expect(escapeCsvField('Goal: Weekend, "fund"')).toBe(
      '"Goal: Weekend, ""fund"""',
    );
  });

  it('preserves newlines inside a CSV field', () => {
    expect(escapeCsvField('line 1\nline 2')).toBe('"line 1\nline 2"');
  });

  it('neutralizes spreadsheet formulas in user-provided text', () => {
    expect(escapeCsvField('=HYPERLINK("https://evil.example")')).toBe(
      '"\'=HYPERLINK(""https://evil.example"")"',
    );
  });
});
