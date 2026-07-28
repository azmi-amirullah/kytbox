const spreadsheetFormulaPrefix = /^[=+\-@]/;

export function escapeCsvField(value: string | number | boolean): string {
  const text = String(value);
  const safeText =
    typeof value === 'string' && spreadsheetFormulaPrefix.test(text)
      ? `'${text}`
      : text;

  return `"${safeText.replace(/"/g, '""')}"`;
}
