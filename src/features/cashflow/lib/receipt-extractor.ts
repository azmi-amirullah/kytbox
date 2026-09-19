import { resolveMerchantCategory } from './merchant-rules';

export interface ExtractedReceiptData {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  category: string | null;
  suggestedTags?: string[];
  rawText: string;
  confidence: number;
}

/**
 * Preprocesses an image file on an HTML Canvas:
 * 1. Resizes large images down to max 1500px dimension for faster, more accurate OCR.
 * 2. Converts pixels to grayscale and applies slight contrast stretching.
 * 3. Returns a high-contrast Blob suitable for OCR engine.
 */
export async function preprocessReceiptImage(file: File): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const maxDim = 1500;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Grayscale conversion and contrast stretch
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Luminance formula
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          // Slight contrast enhancement
          const enhanced = gray < 128 ? Math.max(0, gray * 0.8) : Math.min(255, gray * 1.2);

          data[i] = enhanced;
          data[i + 1] = enhanced;
          data[i + 2] = enhanced;
        }

        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          'image/png',
        );
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Intelligent regex and keyword extraction for raw receipt OCR text.
 * Extracts merchant name, total monetary amount, transaction date, and predicted category.
 */
export function parseReceiptText(rawText: string): ExtractedReceiptData {
  if (!rawText || !rawText.trim()) {
    return {
      merchant: null,
      amount: null,
      date: null,
      category: null,
      rawText: '',
      confidence: 0,
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let merchant: string | null = null;
  let category: string | null = null;
  let suggestedTags: string[] | undefined = undefined;

  // 1. Merchant Detection: Check header lines (first 6 lines)
  const headerLines = lines.slice(0, 6);
  for (const line of headerLines) {
    // Ignore lines that look like tax IDs, dates, or pure numbers
    if (/^(npwp|tax|telp|phone|date|tanggal|receipt|bill|invoice|no\.)/i.test(line)) {
      continue;
    }
    if (/^\d+$/.test(line.replace(/[\s\-_.:/]/g, ''))) {
      continue;
    }

    const match = resolveMerchantCategory(line);
    if (match) {
      merchant = match.merchantName || line;
      category = match.category;
      suggestedTags = match.suggestedTags;
      break;
    }
  }

  // Fallback merchant: first prominent non-noise line from the top
  if (!merchant && headerLines.length > 0) {
    const candidate = headerLines.find(
      (l) =>
        l.length >= 3 &&
        !/^(npwp|tax|telp|phone|date|tanggal|receipt|bill|invoice|table|meja|guest|order)/i.test(
          l,
        ) &&
        !/^\d+$/.test(l.replace(/[\s\-_.:/]/g, '')),
    );
    if (candidate) {
      merchant = candidate;
      const match = resolveMerchantCategory(candidate);
      if (match) {
        category = match.category;
        suggestedTags = match.suggestedTags;
      }
    }
  }

  // 2. Date Detection
  let date: string | null = null;
  const isoDateRegex = /\b(202\d[-/.](?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01]))\b/;
  const dmyDateRegex = /\b((?:0[1-9]|[12]\d|3[01])[-/.](?:0[1-9]|1[0-2])[-/.](?:202\d|2\d))\b/;
  const wordDateRegex =
    /\b((?:0?[1-9]|[12]\d|3[01])\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:202\d))\b/i;

  for (const line of lines) {
    const isoMatch = line.match(isoDateRegex);
    if (isoMatch) {
      date = isoMatch[1].replace(/[/.]/g, '-');
      break;
    }

    const dmyMatch = line.match(dmyDateRegex);
    if (dmyMatch) {
      const parts = dmyMatch[1].split(/[-/.]/);
      if (parts.length === 3) {
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        const month = parts[1].padStart(2, '0');
        const day = parts[0].padStart(2, '0');
        date = `${year}-${month}-${day}`;
        break;
      }
    }

    const wordMatch = line.match(wordDateRegex);
    if (wordMatch) {
      const parts = wordMatch[1].split(/\s+/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const monthKey = parts[1].toLowerCase().slice(0, 3);
        const year = parts[2];
        const monthMap: Record<string, string> = {
          jan: '01',
          feb: '02',
          mar: '03',
          apr: '04',
          may: '05',
          jun: '06',
          jul: '07',
          aug: '08',
          sep: '09',
          oct: '10',
          nov: '11',
          dec: '12',
        };
        const month = monthMap[monthKey];
        if (month) {
          date = `${year}-${month}-${day}`;
          break;
        }
      }
    }
  }

  // 3. Amount Detection
  let amount: number | null = null;
  const totalKeywords =
    /(total|grand total|jumlah|subtotal|amount due|tagihan|bayar|net amount|total bayar)/i;

  // Search in reverse (totals are usually at the bottom)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (totalKeywords.test(line)) {
      // Extract numbers with possible commas/dots
      const numMatches = line.match(/(?:rp|idr|\$|€|£)?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+)/gi);
      if (numMatches && numMatches.length > 0) {
        // Take the last number on the total line
        const lastNumStr = numMatches[numMatches.length - 1]
          .replace(/(?:rp|idr|\$|€|£)\s*/gi, '')
          .trim();
        const parsedAmt = parseMonetaryString(lastNumStr);
        if (parsedAmt !== null && parsedAmt > 0) {
          amount = parsedAmt;
          break;
        }
      }
    }
  }

  // Fallback: If no keyword found, find the largest monetary number in the bottom half of the text
  if (amount === null) {
    const bottomHalf = lines.slice(Math.floor(lines.length / 2));
    let maxVal = 0;
    for (const line of bottomHalf) {
      const nums = line.match(/\b([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]{2,})\b/g);
      if (nums) {
        for (const n of nums) {
          const val = parseMonetaryString(n);
          if (val !== null && val > maxVal && val < 100000000) {
            maxVal = val;
          }
        }
      }
    }
    if (maxVal > 0) {
      amount = maxVal;
    }
  }

  // Calculate confidence score (0 to 1)
  let score = 0;
  if (amount !== null) score += 0.4;
  if (merchant !== null) score += 0.3;
  if (date !== null) score += 0.2;
  if (category !== null) score += 0.1;

  return {
    merchant,
    amount,
    date,
    category,
    suggestedTags,
    rawText,
    confidence: Math.round(score * 100) / 100,
  };
}

/**
 * Parses numeric strings in both Western ($12.50 or $1,250.00) and Indonesian (Rp 125.000 or 12.500,50) formats.
 */
function parseMonetaryString(val: string): number | null {
  const cleaned = val.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;

  // Indonesian/European format: 125.000,00 or 125.000
  if (/\.\d{3},\d{2}$/.test(cleaned)) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(normalized);
    return isNaN(n) ? null : n;
  }
  if (/,\d{3}\.\d{2}$/.test(cleaned)) {
    const normalized = cleaned.replace(/,/g, '');
    const n = parseFloat(normalized);
    return isNaN(n) ? null : n;
  }

  // Thousands separator with dot: 125.000
  if (/^\d{1,3}(?:\.\d{3})+$/.test(cleaned)) {
    const n = parseFloat(cleaned.replace(/\./g, ''));
    return isNaN(n) ? null : n;
  }
  // Thousands separator with comma: 125,000
  if (/^\d{1,3}(?:,\d{3})+$/.test(cleaned)) {
    const n = parseFloat(cleaned.replace(/,/g, ''));
    return isNaN(n) ? null : n;
  }

  // Standard float: 12.50
  if (/^\d+\.\d{1,2}$/.test(cleaned)) {
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  }
  // Comma decimal: 12,50
  if (/^\d+,\d{1,2}$/.test(cleaned)) {
    const n = parseFloat(cleaned.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  // Plain integers: 125000
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/**
 * Performs client-side Zero-Storage OCR extraction on a receipt image.
 * The image is processed in browser memory and NEVER uploaded to Supabase Storage.
 */
export async function extractReceiptData(
  file: File,
  onProgress?: (progress: number, status: string) => void,
): Promise<ExtractedReceiptData> {
  onProgress?.(10, 'Preprocessing receipt image...');
  const processedBlob = await preprocessReceiptImage(file);

  onProgress?.(30, 'Initializing OCR engine...');
  const { createWorker } = await import('tesseract.js');

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(30 + Math.round(m.progress * 60), 'Recognizing receipt text...');
      }
    },
  });

  try {
    const {
      data: { text },
    } = await worker.recognize(processedBlob);

    onProgress?.(95, 'Parsing merchant, amount, and date...');
    const result = parseReceiptText(text);
    onProgress?.(100, 'Complete');
    return result;
  } finally {
    await worker.terminate();
  }
}
