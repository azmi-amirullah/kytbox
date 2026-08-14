import Papa from 'papaparse';
import type { ParsedCsvRow } from '../schemas.client';

export interface ColumnMapping {
  dateCol: string;
  descriptionCol: string;
  amountCol: string;
  typeCol?: string;
  categoryCol?: string;
}

export type DateFormatPreference = 'AUTO' | 'MDY' | 'DMY' | 'YMD';

export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string | undefined>[];
  errors: string[];
}

/**
 * Parses a CSV file client-side using PapaParse
 */
export async function parseCsvFile(file: File): Promise<CsvParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string | undefined>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data.filter((row) =>
          Object.values(row).some((val) => val && String(val).trim() !== '')
        );
        const errors = results.errors.map((e) => e.message);
        resolve({ headers, rows, errors });
      },
      error: (error) => {
        resolve({ headers: [], rows: [], errors: [error.message] });
      },
    });
  });
}

/**
 * Heuristically detects column mappings based on common header naming conventions
 */
export function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    dateCol: '',
    descriptionCol: '',
    amountCol: '',
    typeCol: '',
    categoryCol: '',
  };

  const lowerHeaders = headers.map((h) => ({ original: h, lower: h.toLowerCase().trim() }));

  // 1. Date Column
  const dateMatch = lowerHeaders.find(
    (h) =>
      /^(date|tanggal|tgl|txn_date|transaction_date|booking_date|posting_date|waktu)$/i.test(h.lower) ||
      h.lower.includes('date') ||
      h.lower.includes('tanggal') ||
      h.lower.includes('tgl')
  );
  if (dateMatch) mapping.dateCol = dateMatch.original;

  // 2. Description Column
  const descMatch = lowerHeaders.find(
    (h) =>
      /^(desc|description|keterangan|uraian|memo|payee|merchant|details?|narrative|particulars?|notes?)$/i.test(
        h.lower
      ) ||
      h.lower.includes('description') ||
      h.lower.includes('keterangan') ||
      h.lower.includes('memo') ||
      h.lower.includes('payee') ||
      h.lower.includes('uraian')
  );
  if (descMatch) mapping.descriptionCol = descMatch.original;

  // 3. Amount Column
  const amountMatch = lowerHeaders.find(
    (h) =>
      /^(amount|jumlah|nominal|total|nilai|mutasi|trans_amount|txn_amount)$/i.test(h.lower) ||
      h.lower.includes('amount') ||
      h.lower.includes('nominal') ||
      h.lower.includes('jumlah')
  );
  if (amountMatch) mapping.amountCol = amountMatch.original;

  // 4. Type Column (Optional)
  const typeMatch = lowerHeaders.find(
    (h) =>
      /^(type|tipe|jenis|d\/c|cr\/dr|dc|direction|transaction_type|mutasi_type)$/i.test(h.lower) ||
      h.lower.includes('type') ||
      h.lower.includes('tipe') ||
      h.lower.includes('jenis')
  );
  if (typeMatch) mapping.typeCol = typeMatch.original;

  // 5. Category Column (Optional)
  const catMatch = lowerHeaders.find(
    (h) =>
      /^(cat|category|kategori|tag|tags)$/i.test(h.lower) ||
      h.lower.includes('category') ||
      h.lower.includes('kategori')
  );
  if (catMatch) mapping.categoryCol = catMatch.original;

  return mapping;
}

/**
 * Sniffs all rows in the dataset to determine if the date format is definitively DMY, MDY, or YMD
 */
export function detectDatasetDateFormat(
  rawRows: Record<string, string | undefined>[],
  dateCol: string
): 'DMY' | 'MDY' | 'YMD' {
  if (!dateCol || rawRows.length === 0) return 'MDY';

  let hasYMD = false;
  let hasDefiniteDMY = false; // e.g. 25/08/2026 -> part1 > 12
  let hasDefiniteMDY = false; // e.g. 08/25/2026 -> part2 > 12

  const part1Values = new Set<number>();
  const part2Values = new Set<number>();

  for (const row of rawRows) {
    const val = (row[dateCol] || '').trim();
    if (!val) continue;

    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(val)) {
      hasYMD = true;
      continue;
    }

    const match = val.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (match) {
      const p1 = parseInt(match[1], 10);
      const p2 = parseInt(match[2], 10);
      part1Values.add(p1);
      part2Values.add(p2);

      if (p1 > 12 && p2 <= 12) {
        hasDefiniteDMY = true;
      } else if (p2 > 12 && p1 <= 12) {
        hasDefiniteMDY = true;
      }
    }
  }

  if (hasDefiniteDMY) return 'DMY';
  if (hasDefiniteMDY) return 'MDY';
  if (hasYMD) return 'YMD';

  // Statistical variance check for small / ambiguous batches where both numbers <= 12
  // In typical monthly exports: part1 (Month) stays constant (e.g. 8) while part2 (Day) increments (1, 2, 3...)
  if (part1Values.size === 1 && part2Values.size > 1) {
    return 'MDY'; // Month stays constant, Days change (e.g. 8/1, 8/2, 8/3)
  }
  if (part2Values.size === 1 && part1Values.size > 1) {
    return 'DMY'; // Day changes, Month stays constant (e.g. 1/8, 2/8, 3/8)
  }

  // Default fallback for slash/dash notation
  return 'MDY';
}

/**
 * Normalizes varied date strings into strict YYYY-MM-DD format based on dataset preference
 */
export function normalizeDate(
  rawDate: string,
  preferredFormat: DateFormatPreference = 'AUTO',
  datasetSniffedFormat: 'DMY' | 'MDY' | 'YMD' = 'MDY'
): string | null {
  if (!rawDate) return null;
  const trimmed = rawDate.trim();

  // 1. ISO 8601 string or YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    return isValidCalendarDate(year, month, day);
  }

  // 2. 2-part / 3-part dates with year at end: (D/M/YYYY or M/D/YYYY)
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const part1 = parseInt(dmyMatch[1], 10);
    const part2 = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    // If one part is definitively > 12, it must be the day
    if (part1 > 12 && part2 <= 12) {
      return isValidCalendarDate(year, part2, part1); // part1 is day, part2 is month
    }
    if (part2 > 12 && part1 <= 12) {
      return isValidCalendarDate(year, part1, part2); // part1 is month, part2 is day
    }

    // Ambiguous case (both <= 12): use explicit preference or dataset sniffed format
    const effectiveFormat = preferredFormat === 'AUTO' ? datasetSniffedFormat : preferredFormat;
    if (effectiveFormat === 'DMY') {
      return isValidCalendarDate(year, part2, part1); // part1 is day, part2 is month
    } else {
      return isValidCalendarDate(year, part1, part2); // part1 is month, part2 is day
    }
  }

  // 3. Fallback to Date.parse
  const parsedTimestamp = Date.parse(trimmed);
  if (!isNaN(parsedTimestamp)) {
    const d = new Date(parsedTimestamp);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
      d.getUTCDate()
    ).padStart(2, '0')}`;
  }

  return null;
}

function isValidCalendarDate(year: number, month: number, day: number): string | null {
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  if (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  ) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return null;
}

export interface NormalizedAmount {
  amount: number;
  isNegative: boolean;
}

/**
 * Normalizes raw string/number amounts into a clean positive float and negative indicator
 */
export function normalizeAmount(rawAmount: string | number | null | undefined): NormalizedAmount | null {
  if (rawAmount == null) return null;

  if (typeof rawAmount === 'number') {
    if (isNaN(rawAmount) || !isFinite(rawAmount) || rawAmount === 0) return null;
    return {
      amount: Math.round(Math.abs(rawAmount) * 100) / 100,
      isNegative: rawAmount < 0,
    };
  }

  let str = rawAmount.trim();
  if (!str) return null;

  // Check negative formatting: -100, (100), 100 DR, 100-
  const isNegative =
    str.startsWith('-') ||
    (str.startsWith('(') && str.endsWith(')')) ||
    /\b(DR|DEBIT)\b/i.test(str) ||
    str.endsWith('-');

  // Remove currency signs, letters, parentheses, quotes
  str = str.replace(/[^\d.,]/g, '');

  if (!str) return null;

  // Determine decimal separator vs thousand separator
  const lastDot = str.lastIndexOf('.');
  const lastComma = str.lastIndexOf(',');

  if (lastDot > -1 && lastComma > -1) {
    if (lastDot > lastComma) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/\./g, '').replace(',', '.');
    }
  } else if (lastComma > -1) {
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      str = str.replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (lastDot > -1) {
    const parts = str.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
      str = str.replace(/\./g, '');
    }
  }

  const num = parseFloat(str);
  if (isNaN(num) || !isFinite(num) || num <= 0) return null;

  return {
    amount: Math.round(num * 100) / 100,
    isNegative,
  };
}

export interface InferredTypeResult {
  type: 'income' | 'expense' | 'unselected';
  error?: string;
}

const KNOWN_INCOME_KEYWORDS = [
  'income',
  'cr',
  'credit',
  'kredit',
  'masuk',
  'in',
  'c',
  'pemasukan',
  'penjualan',
  'deposit',
];

const KNOWN_EXPENSE_KEYWORDS = [
  'expense',
  'dr',
  'debit',
  'keluar',
  'out',
  'd',
  'pengeluaran',
  'belanja',
  'biaya',
  'withdrawal',
];

/**
 * Infers transaction type with strict validation if Type column was mapped
 */
export function inferTransactionType(
  rawType: string | undefined,
  isAmountNegative: boolean,
  isTypeColumnMapped: boolean
): InferredTypeResult {
  if (isTypeColumnMapped) {
    if (!rawType || !rawType.trim()) {
      return {
        type: 'unselected',
        error: 'Missing transaction type. Please select Income or Expense.',
      };
    }

    const lower = rawType.toLowerCase().trim();
    if (KNOWN_INCOME_KEYWORDS.includes(lower)) {
      return { type: 'income' };
    }
    if (KNOWN_EXPENSE_KEYWORDS.includes(lower)) {
      return { type: 'expense' };
    }

    // Fail loudly if mapped type is unrecognized garbage like "asd"
    return {
      type: 'unselected',
      error: `Unrecognized type '${rawType}' — please select Type.`,
    };
  }

  // If Type column was not mapped, infer from amount sign
  return {
    type: isAmountNegative ? 'expense' : 'expense',
  };
}

const KNOWN_CATEGORIES = [
  'salary',
  'freelance',
  'investment',
  'food',
  'transport',
  'utilities',
  'entertainment',
  'shopping',
  'health',
  'other',
];

/**
 * Keyword-based category guesser for common merchants and payment memos
 */
export function autoGuessCategory(
  description: string,
  type: 'income' | 'expense'
): string | null {
  if (!description) return null;
  const desc = description.toLowerCase();

  if (type === 'income') {
    if (/(salary|gaji|payroll|bonus|thr|honor|upah)/i.test(desc)) return 'salary';
    if (/(freelance|upwork|fiverr|client|project|invoice|side gig)/i.test(desc)) return 'freelance';
    if (/(dividend|dividen|stock|saham|crypto|binance|tokocrypto|reksadana|bibit|bareksa|yield|interest|bunga)/i.test(desc))
      return 'investment';
    return null;
  }

  // Expense categories
  if (
    /(grabfood|gofood|shopeefood|starbucks|mcdonald|kfc|burger|pizza|resto|restaurant|cafe|coffee|kopi|bakery|supermarket|indomaret|alfamart|hypermart|food|dining|lunch|dinner|breakfast|foodcourt)/i.test(
      desc
    )
  ) {
    return 'food';
  }

  if (
    /(grab|gojek|goride|gocar|uber|lyft|taxi|pertamina|shell|bp |parking|parkir|toll|tol|train|kereta|mrt|lrt|krl|flight|airline|garuda|airasia|petrol|bensin|gas station)/i.test(
      desc
    )
  ) {
    return 'transport';
  }

  if (
    /(pln|listrik|pdam|air|telkom|indihome|wifi|biznet|myrepublic|bpjs|internet|phone|pulsa|paket data|utility|utilities|bill|water|electric)/i.test(
      desc
    )
  ) {
    return 'utilities';
  }

  if (
    /(netflix|spotify|youtube|disney|steam|playstation|xbox|nintendo|cinema|xxi|cgv|game|concert|ticket|entertainment|prime video)/i.test(
      desc
    )
  ) {
    return 'entertainment';
  }

  if (
    /(tokopedia|shopee|lazada|amazon|zalora|uniqlo|zara|h&m|mall|fashion|cloth|shopping|store|retail)/i.test(
      desc
    )
  ) {
    return 'shopping';
  }

  if (
    /(apotek|pharmacy|kimia farma|guardian|watsons|doctor|dokter|hospital|rs |klinik|clinic|gym|fitness|supplement|vitamin|dental|medical|health)/i.test(
      desc
    )
  ) {
    return 'health';
  }

  return null;
}

/**
 * Resolves a category value: if mapped and matches a standard category, use it;
 * otherwise fallback to auto-guess or null (Uncategorized). Never throws an error.
 */
export function resolveCategory(
  rawCategory: string | undefined,
  description: string,
  type: 'income' | 'expense'
): string | null {
  if (rawCategory && rawCategory.trim()) {
    const lower = rawCategory.toLowerCase().trim();
    if (KNOWN_CATEGORIES.includes(lower)) {
      return lower;
    }
  }
  return autoGuessCategory(description, type);
}

/**
 * Maps raw CSV rows using the column mapping to structured preview items
 */
export function processParsedRows(
  rawRows: Record<string, string | undefined>[],
  mapping: ColumnMapping,
  defaultDirection: 'auto' | 'all-expense' | 'all-income' = 'auto',
  dateFormatPreference: DateFormatPreference = 'AUTO'
): ParsedCsvRow[] {
  const datasetDateFormat = detectDatasetDateFormat(rawRows, mapping.dateCol);
  const isTypeColumnMapped = Boolean(mapping.typeCol && mapping.typeCol.trim());

  return rawRows.map((row, index) => {
    const rawDate = row[mapping.dateCol] || '';
    const rawDesc = row[mapping.descriptionCol] || '';
    const rawAmount = row[mapping.amountCol] || '';
    const rawType = mapping.typeCol ? row[mapping.typeCol] : undefined;
    const rawCategory = mapping.categoryCol ? row[mapping.categoryCol] : undefined;

    const errors: string[] = [];

    // 1. Normalize Date
    const normalizedDate = normalizeDate(rawDate, dateFormatPreference, datasetDateFormat);
    if (!normalizedDate) {
      errors.push(
        rawDate.trim()
          ? `Invalid date '${rawDate.trim()}' — please enter valid Date.`
          : 'Missing date — please enter Date.'
      );
    }

    // 2. Normalize Description
    const trimmedDesc = rawDesc.trim();
    if (!trimmedDesc) {
      errors.push('Missing description — please enter Description.');
    }

    // 3. Normalize Amount
    const normalizedAmt = normalizeAmount(rawAmount);
    if (!normalizedAmt) {
      errors.push(
        rawAmount.trim()
          ? `Invalid amount '${rawAmount.trim()}' — please enter valid Amount.`
          : 'Missing amount — please enter Amount.'
      );
    }

    // 4. Determine Type with strict validation
    let resolvedType: 'income' | 'expense' | 'unselected' = 'expense';
    if (defaultDirection === 'all-income') {
      resolvedType = 'income';
    } else if (defaultDirection === 'all-expense') {
      resolvedType = 'expense';
    } else {
      const typeResult = inferTransactionType(
        rawType,
        normalizedAmt?.isNegative ?? false,
        isTypeColumnMapped
      );
      resolvedType = typeResult.type;
      if (typeResult.error) {
        errors.push(typeResult.error);
      }
    }

    // 5. Determine Category (Optional: non-blocking warning / null)
    const category =
      resolvedType !== 'unselected'
        ? resolveCategory(rawCategory, trimmedDesc, resolvedType)
        : null;

    const warnings: string[] = [];
    if (!category) {
      if (rawCategory && rawCategory.trim()) {
        warnings.push(
          `Unrecognized category '${rawCategory.trim()}' — please verify or leave as Uncategorized.`
        );
      } else {
        warnings.push(
          'Uncategorized — please verify or leave as Uncategorized.'
        );
      }
    }

    const isValid = errors.length === 0 && resolvedType !== 'unselected';

    return {
      id: `csv-row-${index}-${Date.now()}`,
      date: normalizedDate || new Date().toISOString().split('T')[0],
      description: trimmedDesc || 'Untitled Transaction',
      amount: normalizedAmt?.amount || 0,
      type: resolvedType,
      category,
      rawCategory: rawCategory?.trim() || undefined,
      isValid,
      errors,
      warnings,
      selected: isValid,
    };
  });
}
