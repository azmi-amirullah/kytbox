import { describe, it, expect } from 'vitest';
import {
  detectColumnMapping,
  detectDatasetDateFormat,
  normalizeDate,
  normalizeAmount,
  autoGuessCategory,
  inferTransactionType,
  resolveCategory,
  processParsedRows,
} from '@/features/cashflow/lib/csvParser';
import {
  importCashflowEntryItemSchema,
  importCashflowEntriesSchema,
} from '@/features/cashflow/schemas.server';

describe('detectColumnMapping', () => {
  it('detects standard English headers', () => {
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category'];
    const mapping = detectColumnMapping(headers);

    expect(mapping.dateCol).toBe('Date');
    expect(mapping.descriptionCol).toBe('Description');
    expect(mapping.amountCol).toBe('Amount');
    expect(mapping.typeCol).toBe('Type');
    expect(mapping.categoryCol).toBe('Category');
  });

  it('detects Indonesian bank statement headers', () => {
    const headers = ['Tanggal Transaksi', 'Keterangan', 'Jumlah Mutasi', 'Tipe', 'Kategori'];
    const mapping = detectColumnMapping(headers);

    expect(mapping.dateCol).toBe('Tanggal Transaksi');
    expect(mapping.descriptionCol).toBe('Keterangan');
    expect(mapping.amountCol).toBe('Jumlah Mutasi');
    expect(mapping.typeCol).toBe('Tipe');
    expect(mapping.categoryCol).toBe('Kategori');
  });

  it('detects alternate aliases like Payee, Memo, and Nominal', () => {
    const headers = ['Txn_Date', 'Payee / Memo', 'Nominal'];
    const mapping = detectColumnMapping(headers);

    expect(mapping.dateCol).toBe('Txn_Date');
    expect(mapping.descriptionCol).toBe('Payee / Memo');
    expect(mapping.amountCol).toBe('Nominal');
    expect(mapping.typeCol).toBe('');
    expect(mapping.categoryCol).toBe('');
  });
});

describe('detectDatasetDateFormat', () => {
  it('detects DMY when any row has day > 12 in first position', () => {
    const rows = [
      { Date: '14/08/2026' },
      { Date: '01/08/2026' },
      { Date: '02/08/2026' },
    ];
    expect(detectDatasetDateFormat(rows, 'Date')).toBe('DMY');
  });

  it('detects MDY when any row has day > 12 in second position', () => {
    const rows = [
      { Date: '08/25/2026' },
      { Date: '8/1/2026' },
      { Date: '8/2/2026' },
    ];
    expect(detectDatasetDateFormat(rows, 'Date')).toBe('MDY');
  });

  it('detects MDY via statistical variance when month is constant and day varies', () => {
    const rows = [
      { Date: '8/1/2026' },
      { Date: '8/2/2026' },
      { Date: '8/3/2026' },
      { Date: '8/4/2026' },
      { Date: '8/5/2026' },
    ];
    expect(detectDatasetDateFormat(rows, 'Date')).toBe('MDY');
  });

  it('detects YMD for ISO format', () => {
    const rows = [{ Date: '2026-08-14' }, { Date: '2026-08-15' }];
    expect(detectDatasetDateFormat(rows, 'Date')).toBe('YMD');
  });
});

describe('normalizeDate', () => {
  it('parses YYYY-MM-DD', () => {
    expect(normalizeDate('2026-08-14')).toBe('2026-08-14');
  });

  it('parses DD/MM/YYYY when format preference is DMY or day > 12', () => {
    expect(normalizeDate('14/08/2026')).toBe('2026-08-14');
    expect(normalizeDate('05/09/2026', 'DMY')).toBe('2026-09-05');
  });

  it('parses MM/DD/YYYY when format preference is MDY (e.g. 8/1/2026 -> 2026-08-01)', () => {
    expect(normalizeDate('8/1/2026', 'MDY')).toBe('2026-08-01');
    expect(normalizeDate('08/25/2026')).toBe('2026-08-25');
  });

  it('parses DD-MM-YYYY and DD.MM.YYYY', () => {
    expect(normalizeDate('14-08-2026')).toBe('2026-08-14');
    expect(normalizeDate('14.08.2026')).toBe('2026-08-14');
  });

  it('parses ISO date string', () => {
    expect(normalizeDate('2026-08-14T09:30:00.000Z')).toBe('2026-08-14');
  });

  it('returns null for invalid dates', () => {
    expect(normalizeDate('')).toBeNull();
    expect(normalizeDate('invalid-date')).toBeNull();
    expect(normalizeDate('2026-02-31')).toBeNull();
  });
});

describe('normalizeAmount', () => {
  it('normalizes standard number and string amounts', () => {
    expect(normalizeAmount(150.5)).toEqual({ amount: 150.5, isNegative: false });
    expect(normalizeAmount('150.50')).toEqual({ amount: 150.5, isNegative: false });
  });

  it('strips currency symbols and commas', () => {
    expect(normalizeAmount('$1,250.00')).toEqual({ amount: 1250, isNegative: false });
    expect(normalizeAmount('Rp 50.000')).toEqual({ amount: 50000, isNegative: false });
    expect(normalizeAmount('€ 1.250,50')).toEqual({ amount: 1250.5, isNegative: false });
  });

  it('detects negative signs, parentheses, and debit indicators', () => {
    expect(normalizeAmount('-45.00')).toEqual({ amount: 45, isNegative: true });
    expect(normalizeAmount('(120.00)')).toEqual({ amount: 120, isNegative: true });
    expect(normalizeAmount('85.50 DR')).toEqual({ amount: 85.5, isNegative: true });
  });

  it('returns null for zero or invalid inputs', () => {
    expect(normalizeAmount(0)).toBeNull();
    expect(normalizeAmount('0.00')).toBeNull();
    expect(normalizeAmount('N/A')).toBeNull();
    expect(normalizeAmount(null)).toBeNull();
  });
});

describe('inferTransactionType', () => {
  it('infers income from keywords when type column is mapped', () => {
    expect(inferTransactionType('income', false, true)).toEqual({ type: 'income' });
    expect(inferTransactionType('CR', false, true)).toEqual({ type: 'income' });
    expect(inferTransactionType('Credit', false, true)).toEqual({ type: 'income' });
    expect(inferTransactionType('Kredit', false, true)).toEqual({ type: 'income' });
    expect(inferTransactionType('Masuk', false, true)).toEqual({ type: 'income' });
  });

  it('infers expense from keywords when type column is mapped', () => {
    expect(inferTransactionType('expense', false, true)).toEqual({ type: 'expense' });
    expect(inferTransactionType('DR', false, true)).toEqual({ type: 'expense' });
    expect(inferTransactionType('Debit', false, true)).toEqual({ type: 'expense' });
    expect(inferTransactionType('Keluar', false, true)).toEqual({ type: 'expense' });
  });

  it('returns unselected error when mapped type is unrecognized garbage like asd', () => {
    const result = inferTransactionType('asd', false, true);
    expect(result.type).toBe('unselected');
    expect(result.error).toBeDefined();
    expect(result.error).toContain("Unrecognized type 'asd'");
  });

  it('infers type from amount negative flag when type column is not mapped', () => {
    expect(inferTransactionType(undefined, true, false)).toEqual({ type: 'expense' });
    expect(inferTransactionType(undefined, false, false)).toEqual({ type: 'expense' });
  });
});

describe('autoGuessCategory and resolveCategory', () => {
  it('categorizes common food merchants', () => {
    expect(autoGuessCategory('STARBUCKS COFFEE INDONESIA', 'expense')).toBe('food');
    expect(autoGuessCategory('GrabFood Delivery', 'expense')).toBe('food');
    expect(autoGuessCategory('Indomaret Supermarket', 'expense')).toBe('food');
    expect(autoGuessCategory('McDonalds Kemang', 'expense')).toBe('food');
  });

  it('categorizes transport merchants', () => {
    expect(autoGuessCategory('Grab Ride Trip', 'expense')).toBe('transport');
    expect(autoGuessCategory('Gojek GoCar', 'expense')).toBe('transport');
    expect(autoGuessCategory('Pertamina Gas Station', 'expense')).toBe('transport');
    expect(autoGuessCategory('Tol Jakarta Cikampek', 'expense')).toBe('transport');
  });

  it('categorizes utilities', () => {
    expect(autoGuessCategory('PLN Postpaid Electricity', 'expense')).toBe('utilities');
    expect(autoGuessCategory('Telkom IndiHome WiFi', 'expense')).toBe('utilities');
    expect(autoGuessCategory('Water Bill PDAM', 'expense')).toBe('utilities');
  });

  it('categorizes entertainment', () => {
    expect(autoGuessCategory('Netflix Subscription', 'expense')).toBe('entertainment');
    expect(autoGuessCategory('Spotify Premium', 'expense')).toBe('entertainment');
    expect(autoGuessCategory('Steam Game Purchase', 'expense')).toBe('entertainment');
    expect(autoGuessCategory('Cinema XXI Ticket', 'expense')).toBe('entertainment');
  });

  it('categorizes shopping', () => {
    expect(autoGuessCategory('Tokopedia Transaction', 'expense')).toBe('shopping');
    expect(autoGuessCategory('Shopee Pay Merchant', 'expense')).toBe('shopping');
    expect(autoGuessCategory('Uniqlo Mall', 'expense')).toBe('shopping');
  });

  it('categorizes health', () => {
    expect(autoGuessCategory('Apotek Kimia Farma', 'expense')).toBe('health');
    expect(autoGuessCategory('Guardian Pharmacy', 'expense')).toBe('health');
    expect(autoGuessCategory('Dental Clinic', 'expense')).toBe('health');
  });

  it('categorizes income sources', () => {
    expect(autoGuessCategory('Monthly Salary Payroll', 'income')).toBe('salary');
    expect(autoGuessCategory('Gaji PT Tech Solutions', 'income')).toBe('salary');
    expect(autoGuessCategory('Upwork Freelance Client Payout', 'income')).toBe('freelance');
    expect(autoGuessCategory('Stock Dividend BBCA', 'income')).toBe('investment');
  });

  it('falls back to null (Uncategorized) when unrecognized', () => {
    expect(resolveCategory('asd', 'Unknown Misc Memo', 'expense')).toBeNull();
    expect(resolveCategory(undefined, 'Direct Transfer 1234', 'income')).toBeNull();
  });
});

describe('processParsedRows', () => {
  it('maps raw CSV rows to structured preview items with smart date sniffing and strict type checking', () => {
    const rawRows = [
      {
        Date: '8/1/2026',
        Description: 'Salary Deposit',
        Amount: '5000.00',
        Type: 'CR',
        Category: 'salary',
      },
      {
        Date: '8/2/2026',
        Description: 'Starbucks Coffee',
        Amount: '55000',
        Type: 'expense',
        Category: 'food',
      },
      {
        Date: '8/3/2026',
        Description: 'Misc Test Entry',
        Amount: '123.00',
        Type: 'asd',
        Category: 'asd',
      },
      {
        Date: 'bad-date',
        Description: '',
        Amount: 'invalid',
      },
    ];

    const mapping = {
      dateCol: 'Date',
      descriptionCol: 'Description',
      amountCol: 'Amount',
      typeCol: 'Type',
      categoryCol: 'Category',
    };

    const processed = processParsedRows(rawRows, mapping);

    expect(processed).toHaveLength(4);

    // Row 1: Valid Income, correctly sniffed as 2026-08-01 (M/D/YYYY)
    expect(processed[0].isValid).toBe(true);
    expect(processed[0].date).toBe('2026-08-01');
    expect(processed[0].type).toBe('income');
    expect(processed[0].amount).toBe(5000);
    expect(processed[0].category).toBe('salary');

    // Row 2: Valid Expense
    expect(processed[1].isValid).toBe(true);
    expect(processed[1].date).toBe('2026-08-02');
    expect(processed[1].type).toBe('expense');
    expect(processed[1].amount).toBe(55000);
    expect(processed[1].category).toBe('food');

    // Row 3: Invalid Type (asd) -> unselected error, category is null (Uncategorized)
    expect(processed[2].isValid).toBe(false);
    expect(processed[2].type).toBe('unselected');
    expect(processed[2].category).toBeNull();
    expect(processed[2].rawCategory).toBe('asd');
    expect(processed[2].errors.some((e) => e.includes('Unrecognized type'))).toBe(true);
    expect(processed[2].warnings.some((w) => w.includes("Unrecognized category 'asd'"))).toBe(true);
    expect(processed[2].selected).toBe(false);

    // Row 4: Multiple missing/invalid fields
    expect(processed[3].isValid).toBe(false);
    expect(processed[3].errors.length).toBeGreaterThan(0);
    expect(processed[3].selected).toBe(false);
  });
});

describe('importCashflowEntriesSchema', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';

  it('validates a correct import payload', () => {
    const payload = {
      cashflowId: validUUID,
      entries: [
        {
          date: '2026-08-14',
          description: 'Groceries at Supermarket',
          amount: 150.75,
          type: 'expense',
          category: 'food',
        },
        {
          date: '2026-08-15',
          description: 'Client Consulting',
          amount: 1200,
          type: 'income',
          category: 'freelance',
        },
      ],
    };

    const result = importCashflowEntriesSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects invalid cashflowId', () => {
    const payload = {
      cashflowId: 'not-a-uuid',
      entries: [
        {
          date: '2026-08-14',
          description: 'Test',
          amount: 50,
          type: 'expense',
        },
      ],
    };

    const result = importCashflowEntriesSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects empty entries array', () => {
    const payload = {
      cashflowId: validUUID,
      entries: [],
    };

    const result = importCashflowEntriesSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects entry item with negative amount or invalid date', () => {
    const itemResult1 = importCashflowEntryItemSchema.safeParse({
      date: '2026-08-14',
      description: 'Test',
      amount: -50,
      type: 'expense',
    });
    expect(itemResult1.success).toBe(false);

    const itemResult2 = importCashflowEntryItemSchema.safeParse({
      date: '14/08/2026', // must be normalized YYYY-MM-DD for server action
      description: 'Test',
      amount: 50,
      type: 'expense',
    });
    expect(itemResult2.success).toBe(false);
  });
});
